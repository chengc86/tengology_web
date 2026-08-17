import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySquareWebhook } from "@/lib/square";
import { fromMinorUnits, round2 } from "@/lib/money";
import { recordOrderEvent } from "@/lib/orders";
import { ORDER_EVENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";

/**
 * Square webhooks.
 *
 * Payments can change state after checkout finishes — a bank reverses a
 * charge, a refund settles, a dispute opens — and we'd otherwise never know.
 * Every request must carry a valid signature; unsigned payloads are dropped.
 *
 * Configure the endpoint URL and signature key in the Square dashboard, then
 * set SQUARE_WEBHOOK_URL and SQUARE_WEBHOOK_SIGNATURE_KEY.
 */

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  const valid = await verifySquareWebhook(body, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment.updated":
      case "payment.created":
        await handlePaymentUpdate(event.data?.object?.payment as SquarePaymentPayload | undefined);
        break;

      case "refund.updated":
      case "refund.created":
        await handleRefundUpdate(event.data?.object?.refund as SquareRefundPayload | undefined);
        break;

      default:
        // Unhandled event types are acknowledged so Square stops retrying.
        break;
    }
  } catch (error) {
    console.error("[square-webhook] handler failed", event.type, error);
    // 500 tells Square to retry, which is what we want for a transient failure.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

interface SquarePaymentPayload {
  id?: string;
  status?: string;
  receipt_url?: string;
  refunded_money?: { amount?: number };
  amount_money?: { amount?: number };
}

async function handlePaymentUpdate(payload?: SquarePaymentPayload) {
  if (!payload?.id) return;

  const payment = await prisma.payment.findUnique({
    where: { squarePaymentId: payload.id },
    include: { order: true },
  });

  if (!payment) return;

  const status = payload.status ?? payment.status;
  if (status === payment.status) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status, receiptUrl: payload.receipt_url ?? payment.receiptUrl },
  });

  const order = payment.order;

  // A payment that lands as COMPLETED out of band (e.g. delayed capture)
  // still needs to flip the order to paid.
  if (status === "COMPLETED" && order.paymentStatus !== PAYMENT_STATUS.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PAYMENT_STATUS.PAID,
        status: order.status === ORDER_STATUS.PENDING ? ORDER_STATUS.PAID : order.status,
        paidAt: order.paidAt ?? new Date(),
        squarePaymentId: payload.id,
        squareReceiptUrl: payload.receipt_url ?? order.squareReceiptUrl,
      },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: ORDER_EVENT.PAYMENT_SUCCEEDED,
      message: "Payment confirmed by Square",
      actor: "square-webhook",
    });
    return;
  }

  if (status === "CANCELED" || status === "FAILED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PAYMENT_STATUS.FAILED },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: ORDER_EVENT.PAYMENT_FAILED,
      message: `Square reported the payment as ${status.toLowerCase()}`,
      actor: "square-webhook",
      isCustomerVisible: false,
    });
  }
}

interface SquareRefundPayload {
  id?: string;
  status?: string;
  payment_id?: string;
  amount_money?: { amount?: number };
}

async function handleRefundUpdate(payload?: SquareRefundPayload) {
  if (!payload?.id) return;

  const existing = await prisma.refund.findUnique({
    where: { squareRefundId: payload.id },
    include: { order: true },
  });

  // A refund issued from the Square dashboard has no local record yet.
  if (!existing) {
    if (!payload.payment_id || payload.status !== "COMPLETED") return;

    const payment = await prisma.payment.findUnique({
      where: { squarePaymentId: payload.payment_id },
      include: { order: true },
    });
    if (!payment) return;

    const amount = fromMinorUnits(payload.amount_money?.amount ?? 0);
    if (amount <= 0) return;

    await prisma.refund.create({
      data: {
        orderId: payment.orderId,
        paymentId: payment.id,
        squareRefundId: payload.id,
        idempotencyKey: `square-${payload.id}`,
        amount,
        currency: payment.currency,
        status: "COMPLETED",
        reason: "Refunded in Square",
        createdBy: "square-webhook",
      },
    });

    await applyRefundTotals(payment.orderId);

    await recordOrderEvent({
      orderId: payment.orderId,
      type: ORDER_EVENT.REFUNDED,
      message: `Refund of ${amount.toFixed(2)} issued from Square`,
      actor: "square-webhook",
    });
    return;
  }

  if (existing.status === payload.status) return;

  await prisma.refund.update({
    where: { id: existing.id },
    data: { status: payload.status ?? existing.status },
  });

  // Only a refund that settles moves the order's refunded total.
  if (payload.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await applyRefundTotals(existing.orderId);

    await recordOrderEvent({
      orderId: existing.orderId,
      type: ORDER_EVENT.REFUNDED,
      message: `Refund of ${existing.amount.toFixed(2)} completed`,
      actor: "square-webhook",
    });
  }
}

/**
 * Recompute the order's refunded total from its refund rows rather than
 * incrementing. Webhooks can arrive twice, and a refund we issued ourselves
 * has already been counted — summing the source of truth is idempotent either way.
 */
async function applyRefundTotals(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { refunds: true },
  });
  if (!order) return;

  const refunded = round2(
    order.refunds
      .filter((r) => r.status === "COMPLETED" || r.status === "PENDING")
      .reduce((sum, r) => sum + r.amount, 0)
  );

  if (refunded === round2(order.refundedAmount)) return;

  const fully = refunded >= round2(order.total);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      refundedAmount: refunded,
      paymentStatus:
        refunded <= 0
          ? order.paymentStatus
          : fully
            ? PAYMENT_STATUS.REFUNDED
            : PAYMENT_STATUS.PARTIALLY_REFUNDED,
      ...(fully ? { status: ORDER_STATUS.REFUNDED } : {}),
    },
  });
}
