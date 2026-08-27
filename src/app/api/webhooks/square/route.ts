import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySquareWebhook } from "@/lib/square";
import {
  extractPaymentPayload,
  extractRefundPayload,
  extractWebhookType,
  type SquarePaymentPayload,
  type SquareRefundPayload,
} from "@/lib/square-webhooks";
import { reconcilePaymentUpdate } from "@/lib/square-payment";
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

  let event: unknown;

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const type = extractWebhookType(event);

  try {
    switch (type) {
      case "payment.updated":
      case "payment.created":
        await handlePaymentUpdate(extractPaymentPayload(event));
        break;

      case "refund.updated":
      case "refund.created":
        await handleRefundUpdate(extractRefundPayload(event));
        break;

      default:
        // Unhandled event types are acknowledged so Square stops retrying.
        break;
    }
  } catch (error) {
    console.error("[square-webhook] handler failed", type, error);
    // 500 tells Square to retry, which is what we want for a transient failure.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentUpdate(payload?: SquarePaymentPayload) {
  if (!payload?.id) return;

  let payment = await prisma.payment.findUnique({
    where: { squarePaymentId: payload.id },
    include: { order: true },
  });

  // Checkout writes squarePaymentId after CreatePayment returns. A
  // payment.created event can land in that window — match on the order
  // number we sent as Square's reference_id and attach the id.
  if (!payment && payload.referenceId) {
    const order = await prisma.order.findUnique({
      where: { orderNumber: payload.referenceId },
      include: {
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    const pending = order?.payments.find(
      (row) => !row.squarePaymentId || row.squarePaymentId === payload.id
    );

    if (pending) {
      payment = await prisma.payment.update({
        where: { id: pending.id },
        data: { squarePaymentId: payload.id },
        include: { order: true },
      });
    }
  }

  if (!payment) {
    console.warn("[square-webhook] payment not matched", payload.id, payload.referenceId);
    return;
  }

  const incoming = payload.status ?? payment.status;
  const plan = reconcilePaymentUpdate({
    localPaymentStatus: payment.status,
    localOrderStatus: payment.order.status,
    localOrderPaymentStatus: payment.order.paymentStatus,
    incomingStatus: incoming,
  });

  if (plan.skip) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: plan.paymentStatus, receiptUrl: payload.receiptUrl ?? payment.receiptUrl },
  });

  const order = payment.order;

  if (plan.markOrderPaid) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PAYMENT_STATUS.PAID,
        status: plan.nextOrderStatus ?? order.status,
        paidAt: order.paidAt ?? new Date(),
        squarePaymentId: payload.id,
        squareReceiptUrl: payload.receiptUrl ?? order.squareReceiptUrl,
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

  if (plan.markOrderFailed) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PAYMENT_STATUS.FAILED },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: ORDER_EVENT.PAYMENT_FAILED,
      message: `Square reported the payment as ${incoming.toLowerCase()}`,
      actor: "square-webhook",
      isCustomerVisible: false,
    });
  }
}

async function handleRefundUpdate(payload?: SquareRefundPayload) {
  if (!payload?.id) return;

  const existing = await prisma.refund.findUnique({
    where: { squareRefundId: payload.id },
    include: { order: true },
  });

  // A refund issued from the Square dashboard has no local record yet.
  if (!existing) {
    if (!payload.paymentId || payload.status !== "COMPLETED") return;

    const payment = await prisma.payment.findUnique({
      where: { squarePaymentId: payload.paymentId },
      include: { order: true },
    });
    if (!payment) return;

    const amount = fromMinorUnits(payload.amountMinor ?? 0);
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
