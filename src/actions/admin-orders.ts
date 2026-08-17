"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/order-access";
import { releaseOrderStock, recordOrderEvent } from "@/lib/orders";
import { refundOrderPayment } from "@/lib/refunds";
import { sendOrderShipped, sendOrderCancelled, sendOrderConfirmation } from "@/lib/email";
import {
  ALLOWED_TRANSITIONS,
  ORDER_EVENT,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS,
  FULFILLMENT_STATUS,
  trackingUrlFor,
} from "@/lib/constants";
import { refundSchema, shipOrderSchema, fieldErrors } from "@/lib/validation";

/**
 * Admin order operations. Every action re-checks the admin role — these are
 * public POST endpoints, and the sidebar being hidden proves nothing.
 */

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

async function guard(): Promise<{ actorId: string } | null> {
  try {
    const session = await requireAdmin();
    return { actorId: session.user.id };
  } catch {
    return null;
  }
}

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/account/orders");
}

/** Move an order along its lifecycle, refusing transitions that don't make sense. */
export async function updateOrderStatus({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    return {
      ok: false,
      error: `An order that is "${ORDER_STATUS_LABELS[order.status] ?? order.status}" can't move to "${
        ORDER_STATUS_LABELS[status] ?? status
      }".`,
    };
  }

  if (status === ORDER_STATUS.CANCELLED) {
    return cancelOrder({ orderId, reason: "Cancelled by admin" });
  }

  const now = new Date();
  const data: Record<string, unknown> = { status };

  if (status === ORDER_STATUS.PAID) {
    data.paymentStatus = PAYMENT_STATUS.PAID;
    data.paidAt = order.paidAt ?? now;
  }
  if (status === ORDER_STATUS.SHIPPED) {
    data.shippedAt = order.shippedAt ?? now;
    data.fulfillmentStatus = FULFILLMENT_STATUS.FULFILLED;
  }
  if (status === ORDER_STATUS.DELIVERED) {
    data.deliveredAt = now;
    data.fulfillmentStatus = FULFILLMENT_STATUS.FULFILLED;
  }

  await prisma.order.update({ where: { id: orderId }, data });

  await recordOrderEvent({
    orderId,
    type: ORDER_EVENT.STATUS_CHANGED,
    message: `Status changed to ${ORDER_STATUS_LABELS[status] ?? status}`,
    actor: admin.actorId,
  });

  revalidateOrder(orderId);
  return { ok: true, message: `Order marked ${ORDER_STATUS_LABELS[status] ?? status}.` };
}

/** Dispatch: record carrier and tracking, then tell the customer. */
export async function markOrderShipped(input: unknown): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  const parsed = shipOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: Object.values(fieldErrors(parsed.error))[0] ?? "Check the shipping details." };
  }

  const { orderId, carrier, trackingNumber, notifyCustomer } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };

  if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED) {
    return { ok: false, error: "This order has been cancelled and can't be shipped." };
  }

  const tracking = trackingNumber || null;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: ORDER_STATUS.SHIPPED,
      fulfillmentStatus: FULFILLMENT_STATUS.FULFILLED,
      shippingCarrier: carrier,
      trackingNumber: tracking,
      trackingUrl: trackingUrlFor(carrier, tracking),
      shippedAt: new Date(),
    },
  });

  await recordOrderEvent({
    orderId,
    type: ORDER_EVENT.SHIPPED,
    message: tracking
      ? `Dispatched via ${carrier.replace(/_/g, " ")} — tracking ${tracking}`
      : `Dispatched via ${carrier.replace(/_/g, " ")}`,
    actor: admin.actorId,
  });

  if (notifyCustomer) {
    const fresh = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (fresh) {
      const sent = await sendOrderShipped(fresh).catch(() => ({ ok: false }));
      if (sent.ok) {
        await recordOrderEvent({
          orderId,
          type: ORDER_EVENT.EMAIL_SENT,
          message: "Dispatch notification emailed",
          actor: "system",
          isCustomerVisible: false,
        });
      }
    }
  }

  revalidateOrder(orderId);
  return { ok: true, message: "Order marked as shipped." };
}

export async function cancelOrder({
  orderId,
  reason,
  refund = true,
}: {
  orderId: string;
  reason?: string;
  refund?: boolean;
}): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };

  if (order.status === ORDER_STATUS.CANCELLED) {
    return { ok: false, error: "This order is already cancelled." };
  }

  const wasPaid = order.paymentStatus === PAYMENT_STATUS.PAID && order.refundedAmount < order.total;

  await releaseOrderStock(orderId, "Order cancelled", admin.actorId);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason?.slice(0, 200) ?? "Cancelled by admin",
    },
  });

  await recordOrderEvent({
    orderId,
    type: ORDER_EVENT.CANCELLED,
    message: `Order cancelled${reason ? ` — ${reason}` : ""}`,
    actor: admin.actorId,
  });

  if (wasPaid && refund) {
    const result = await refundOrderPayment({
      orderId,
      amount: order.total - order.refundedAmount,
      reason: reason ?? "Order cancelled",
      restock: false, // already released above
      actor: admin.actorId,
      notifyCustomer: false,
    });

    if (!result.ok) {
      await recordOrderEvent({
        orderId,
        type: ORDER_EVENT.NOTE,
        message: `Refund on cancellation failed — refund manually: ${result.error}`,
        actor: "system",
        isCustomerVisible: false,
      });
      revalidateOrder(orderId);
      return { ok: false, error: `Order cancelled, but the refund failed: ${result.error}` };
    }
  }

  const fresh = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (fresh) await sendOrderCancelled(fresh, reason).catch(() => {});

  revalidateOrder(orderId);
  return { ok: true, message: wasPaid && refund ? "Order cancelled and refunded." : "Order cancelled." };
}

export async function refundOrder(input: unknown): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: Object.values(fieldErrors(parsed.error))[0] ?? "Check the refund details." };
  }

  const { orderId, amount, reason, restock, notifyCustomer } = parsed.data;

  const result = await refundOrderPayment({
    orderId,
    amount,
    reason: reason || null,
    restock,
    actor: admin.actorId,
    notifyCustomer,
  });

  if (!result.ok) return { ok: false, error: result.error ?? "The refund failed." };

  revalidateOrder(orderId);
  return { ok: true, message: `Refunded £${amount.toFixed(2)}.` };
}

/** Internal note — never shown to the customer. */
export async function addOrderNote({
  orderId,
  note,
}: {
  orderId: string;
  note: string;
}): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Write something first." };

  await recordOrderEvent({
    orderId,
    type: ORDER_EVENT.NOTE,
    message: trimmed.slice(0, 1000),
    actor: admin.actorId,
    isCustomerVisible: false,
  });

  revalidateOrder(orderId);
  return { ok: true, message: "Note added." };
}

export async function updateAdminNotes({
  orderId,
  notes,
}: {
  orderId: string;
  notes: string;
}): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  await prisma.order.update({
    where: { id: orderId },
    data: { adminNotes: notes.slice(0, 2000) },
  });

  revalidateOrder(orderId);
  return { ok: true, message: "Notes saved." };
}

export async function resendOrderEmail({
  orderId,
  type,
}: {
  orderId: string;
  type: "confirmation" | "shipped";
}): Promise<AdminResult> {
  const admin = await guard();
  if (!admin) return { ok: false, error: "Not authorised." };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found." };

  const sent = type === "shipped" ? await sendOrderShipped(order) : await sendOrderConfirmation(order);

  if (!sent.ok) {
    return {
      ok: false,
      error: sent.skipped
        ? "Email isn't configured yet — set RESEND_API_KEY to send messages."
        : "The email couldn't be sent.",
    };
  }

  await recordOrderEvent({
    orderId,
    type: ORDER_EVENT.EMAIL_SENT,
    message: `${type === "shipped" ? "Dispatch notification" : "Order confirmation"} resent to ${order.email}`,
    actor: admin.actorId,
    isCustomerVisible: false,
  });

  revalidateOrder(orderId);
  return { ok: true, message: `Email sent to ${order.email}.` };
}
