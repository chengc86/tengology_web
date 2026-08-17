import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { round2 } from "./money";
import { refundSquarePayment, isSquareConfigured } from "./square";
import { recordOrderEvent } from "./orders";
import { sendRefundIssued } from "./email";
import { ORDER_EVENT, ORDER_STATUS, PAYMENT_STATUS } from "./constants";

/**
 * Refund engine.
 *
 * NOT a server action: callers must authorise first. Exposing this directly
 * would let anyone refund any order. The admin action and the customer-cancel
 * flow each check permission before calling in.
 */

export interface RefundOutcome {
  ok: boolean;
  error?: string;
  refundId?: string;
  amount?: number;
}

export async function refundOrderPayment({
  orderId,
  amount,
  reason,
  restock,
  actor,
  notifyCustomer = true,
}: {
  orderId: string;
  amount: number;
  reason?: string | null;
  restock: boolean;
  actor: string;
  notifyCustomer?: boolean;
}): Promise<RefundOutcome> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) return { ok: false, error: "Order not found." };

  const remaining = round2(order.total - order.refundedAmount);
  const requested = round2(amount);

  if (requested <= 0) return { ok: false, error: "Enter an amount above zero." };
  if (requested > remaining) {
    return { ok: false, error: `Only ${remaining.toFixed(2)} is left to refund on this order.` };
  }

  const payment = order.payments.find((p) => p.squarePaymentId);

  // An unpaid order (manual/offline) is "refunded" as bookkeeping only.
  if (!payment?.squarePaymentId || !isSquareConfigured()) {
    return finaliseRefund({
      order,
      amount: requested,
      reason,
      restock,
      actor,
      notifyCustomer,
      squareRefundId: null,
      paymentId: payment?.id ?? null,
      status: "COMPLETED",
      note: payment?.squarePaymentId
        ? "Recorded without contacting Square (provider not configured)"
        : "Recorded manually — no card payment on file",
    });
  }

  const idempotencyKey = `refund-${order.id}-${randomUUID().slice(0, 12)}`;

  const record = await prisma.refund.create({
    data: {
      orderId: order.id,
      paymentId: payment.id,
      idempotencyKey,
      amount: requested,
      currency: order.currency,
      reason: reason ?? null,
      status: "PENDING",
      createdBy: actor,
    },
  });

  const result = await refundSquarePayment({
    paymentId: payment.squarePaymentId,
    idempotencyKey,
    amount: requested,
    currency: order.currency,
    reason: reason ?? `Refund for ${order.orderNumber}`,
  });

  if (!result.ok) {
    await prisma.refund.update({
      where: { id: record.id },
      data: { status: "FAILED", errorMessage: result.errorMessage ?? "Refund failed" },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: ORDER_EVENT.NOTE,
      message: `Refund of ${requested.toFixed(2)} failed: ${result.errorMessage ?? "unknown error"}`,
      actor,
      isCustomerVisible: false,
    });

    return { ok: false, error: result.errorMessage ?? "The refund was rejected by Square." };
  }

  await prisma.refund.update({
    where: { id: record.id },
    data: {
      status: result.status === "COMPLETED" ? "COMPLETED" : "PENDING",
      squareRefundId: result.refundId ?? null,
    },
  });

  return finaliseRefund({
    order,
    amount: requested,
    reason,
    restock,
    actor,
    notifyCustomer,
    squareRefundId: result.refundId ?? null,
    paymentId: payment.id,
    status: result.status ?? "PENDING",
    existingRefundId: record.id,
  });
}

async function finaliseRefund({
  order,
  amount,
  reason,
  restock,
  actor,
  notifyCustomer,
  squareRefundId,
  paymentId,
  status,
  note,
  existingRefundId,
}: {
  order: { id: string; orderNumber: string; total: number; refundedAmount: number; currency: string; items: Array<{ productId: string; quantity: number; quantityRefunded: number }> };
  amount: number;
  reason?: string | null;
  restock: boolean;
  actor: string;
  notifyCustomer: boolean;
  squareRefundId: string | null;
  paymentId: string | null;
  status: string;
  note?: string;
  existingRefundId?: string;
}): Promise<RefundOutcome> {
  let refundId = existingRefundId;

  if (!refundId) {
    const created = await prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId,
        idempotencyKey: `manual-${order.id}-${randomUUID().slice(0, 12)}`,
        amount,
        currency: order.currency,
        reason: reason ?? null,
        status: "COMPLETED",
        createdBy: actor,
        restocked: restock,
      },
    });
    refundId = created.id;
  } else if (restock) {
    await prisma.refund.update({ where: { id: refundId }, data: { restocked: true } });
  }

  // Sum the refund rows rather than adding to the value read earlier: another
  // refund (or a Square webhook) may have landed in between, and this way the
  // order's total always matches the refunds that actually exist.
  const settled = await prisma.refund.findMany({
    where: { orderId: order.id, status: { in: ["COMPLETED", "PENDING"] } },
    select: { amount: true },
  });

  const totalRefunded = round2(settled.reduce((sum, r) => sum + r.amount, 0));
  const fullyRefunded = totalRefunded >= round2(order.total);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      refundedAmount: totalRefunded,
      paymentStatus: fullyRefunded ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED,
      ...(fullyRefunded ? { status: ORDER_STATUS.REFUNDED } : {}),
    },
  });

  if (restock) {
    await restockOrderItems(order, actor);
  }

  await recordOrderEvent({
    orderId: order.id,
    type: ORDER_EVENT.REFUNDED,
    message: `Refunded ${amount.toFixed(2)}${reason ? ` — ${reason}` : ""}${note ? ` (${note})` : ""}`,
    meta: { squareRefundId, status },
    actor,
  });

  if (notifyCustomer) {
    const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    if (fresh) await sendRefundIssued(fresh, amount, reason).catch(() => {});
  }

  return { ok: true, refundId: squareRefundId ?? refundId, amount };
}

/** Return refunded pieces to sellable stock. */
async function restockOrderItems(
  order: { id: string; orderNumber: string; items: Array<{ productId: string; quantity: number; quantityRefunded: number }> },
  actor: string
) {
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const outstanding = item.quantity - item.quantityRefunded;
      if (outstanding <= 0) continue;

      // The database applies the increment, so the returned level is correct
      // even if another refund lands at the same moment.
      const updated = await tx.product
        .update({
          where: { id: item.productId },
          data: { stockCount: { increment: outstanding } },
          select: { stockCount: true },
        })
        .catch(() => null);

      if (!updated) continue;

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          changeType: "RESTOCK",
          quantityBefore: updated.stockCount - outstanding,
          quantityAfter: updated.stockCount,
          delta: outstanding,
          note: `Refund restock — order ${order.orderNumber}`,
          triggeredBy: actor,
        },
      });

      // Mark the line fully returned so a second refund can't restock it again.
      await tx.orderItem.updateMany({
        where: { orderId: order.id, productId: item.productId },
        data: { quantityRefunded: item.quantity },
      });
    }
  });
}
