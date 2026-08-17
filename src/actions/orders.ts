"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { releaseOrderStock, recordOrderEvent } from "@/lib/orders";
import { getAccessibleOrder } from "@/lib/order-access";
import { sendOrderCancelled } from "@/lib/email";
import { CUSTOMER_CANCELLABLE, ORDER_EVENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { refundOrderPayment } from "@/lib/refunds";

/**
 * Customer-side order actions. Every one re-checks ownership: a server action
 * is a public POST endpoint, so the caller's session is the only thing that
 * decides which order they may touch.
 */

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

/**
 * Cancel an order the customer placed. Allowed until it ships. If it was paid,
 * the money is refunded through Square in the same step — a customer should
 * never have to chase a refund for an order they cancelled themselves.
 */
export async function cancelMyOrder({
  orderNumber,
  guestToken,
  reason,
}: {
  orderNumber: string;
  guestToken?: string | null;
  reason?: string;
}): Promise<ActionResult> {
  const access = await getAccessibleOrder(orderNumber, guestToken);

  if (!access) return { ok: false, error: "We couldn't find that order." };

  const { order } = access;

  if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
    return {
      ok: false,
      error:
        order.status === "SHIPPED" || order.status === "DELIVERED"
          ? "This order has already been dispatched, so it can't be cancelled. Please contact us to arrange a return."
          : "This order can no longer be cancelled.",
    };
  }

  const wasPaid = order.paymentStatus === PAYMENT_STATUS.PAID;

  await releaseOrderStock(order.id, "Order cancelled by customer", access.isOwner ? "customer" : "guest");

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason?.slice(0, 200) || "Cancelled by customer",
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    type: ORDER_EVENT.CANCELLED,
    message: `Order cancelled by customer${reason ? ` — ${reason}` : ""}`,
    actor: "customer",
  });

  if (wasPaid) {
    const refund = await refundOrderPayment({
      orderId: order.id,
      amount: order.total - order.refundedAmount,
      reason: "Cancelled by customer",
      restock: false, // stock already released above
      actor: "customer",
      notifyCustomer: false,
    });

    if (!refund.ok) {
      await recordOrderEvent({
        orderId: order.id,
        type: ORDER_EVENT.NOTE,
        message: `Automatic refund failed — needs manual attention: ${refund.error}`,
        actor: "system",
        isCustomerVisible: false,
      });
    }
  }

  const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  if (fresh) await sendOrderCancelled(fresh, reason).catch(() => {});

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderNumber}`);
  revalidatePath("/admin/orders");

  return { ok: true };
}

/**
 * Rebuild a past basket. Returns the lines that are still buyable so the
 * client can drop them into the cart, plus a note about anything skipped.
 */
export async function reorderItems(orderNumber: string, guestToken?: string | null) {
  const access = await getAccessibleOrder(orderNumber, guestToken);
  if (!access) return { ok: false as const, error: "We couldn't find that order." };

  const productIds = access.order.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isPublished: true },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const available: Array<{ productId: string; title: string; price: number; image?: string; quantity: number }> = [];
  const unavailable: string[] = [];

  for (const item of access.order.items) {
    const product = byId.get(item.productId);
    if (!product || product.stockCount < 1) {
      unavailable.push(item.productTitleSnapshot);
      continue;
    }
    available.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0]?.url,
      quantity: Math.min(item.quantity, product.stockCount),
    });
  }

  return { ok: true as const, items: available, unavailable };
}

/** Orders list for the signed-in customer, newest first. */
export async function getMyOrders({ take = 20, skip = 0 }: { take?: number; skip?: number } = {}) {
  const session = await auth();
  if (!session?.user?.id) return { orders: [], total: 0 };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { select: { id: true, productTitleSnapshot: true, quantity: true, productImageSnapshot: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);

  return { orders, total };
}
