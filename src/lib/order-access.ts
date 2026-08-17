import { prisma } from "./db";
import { auth } from "./auth";

/**
 * Authorization for order reads.
 *
 * An order is visible to the signed-in user who owns it, to anyone holding the
 * guest token that was emailed with it, or to an admin. Guest tokens are
 * compared in constant time so this endpoint can't be used as an oracle.
 */

const orderInclude = {
  items: { orderBy: { id: "asc" } },
  events: { orderBy: { createdAt: "desc" } },
  payments: { orderBy: { createdAt: "desc" } },
  refunds: { orderBy: { createdAt: "desc" } },
} as const;

export type FullOrder = NonNullable<Awaited<ReturnType<typeof findOrderByNumber>>>;

async function findOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: orderInclude,
  });
}

function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface OrderAccess {
  order: FullOrder;
  isOwner: boolean;
  isAdmin: boolean;
  viaGuestToken: boolean;
}

export async function getAccessibleOrder(
  orderNumber: string,
  guestToken?: string | null
): Promise<OrderAccess | null> {
  const order = await findOrderByNumber(orderNumber);
  if (!order) return null;

  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = Boolean(userId && order.userId === userId);
  const viaGuestToken = Boolean(guestToken && order.guestToken && safeEquals(guestToken, order.guestToken));

  if (!isOwner && !isAdmin && !viaGuestToken) return null;

  return { order, isOwner, isAdmin, viaGuestToken };
}

/** Guest lookup by order number + the email the order was placed with. */
export async function findOrderForGuest(orderNumber: string, email: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: orderInclude,
  });

  if (!order) return null;
  if (order.email.toLowerCase() !== email.trim().toLowerCase()) return null;

  return order;
}

export async function getAdminOrder(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;

  return prisma.order.findUnique({
    where: { id },
    include: {
      ...orderInclude,
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Not authorised");
  }
  return session;
}
