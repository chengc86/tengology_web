import { prisma } from "./db";
import { round2 } from "./money";

/**
 * Discount codes. Validation is always re-run on the server at order time —
 * a code accepted while the shopper filled in their address may have expired,
 * hit its redemption cap, or stopped meeting the minimum by the time they pay.
 */

export interface DiscountResult {
  valid: boolean;
  reason?: string;
  code?: string;
  codeId?: string;
  type?: string;
  /** Money off the subtotal. Free-shipping codes report 0 here. */
  amount: number;
  freeShipping: boolean;
  description?: string | null;
}

const INVALID = (reason: string): DiscountResult => ({
  valid: false,
  reason,
  amount: 0,
  freeShipping: false,
});

export async function validateDiscountCode({
  code,
  subtotal,
  email,
  userId,
}: {
  code: string;
  subtotal: number;
  email?: string | null;
  userId?: string | null;
}): Promise<DiscountResult> {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return INVALID("Enter a code.");

  const discount = await prisma.discountCode.findUnique({
    where: { code: normalised },
  });

  if (!discount || !discount.isActive) return INVALID("That code isn't valid.");

  const now = new Date();
  if (discount.startsAt > now) return INVALID("That code isn't active yet.");
  if (discount.endsAt && discount.endsAt < now) return INVALID("That code has expired.");

  if (discount.maxRedemptions !== null && discount.timesRedeemed >= discount.maxRedemptions) {
    return INVALID("That code has been fully redeemed.");
  }

  if (discount.minSubtotal !== null && subtotal < discount.minSubtotal) {
    return INVALID(`Spend £${discount.minSubtotal.toFixed(2)} to use this code.`);
  }

  if (discount.perCustomerLimit !== null && (userId || email)) {
    const used = await prisma.discountRedemption.count({
      where: {
        discountCodeId: discount.id,
        ...(userId ? { userId } : { email: email!.toLowerCase() }),
      },
    });
    if (used >= discount.perCustomerLimit) {
      return INVALID("You've already used that code.");
    }
  }

  let amount = 0;
  let freeShipping = false;

  switch (discount.type) {
    case "PERCENT":
      amount = round2((subtotal * discount.value) / 100);
      break;
    case "FIXED":
      // Never discount below zero — a £10 code on a £6 basket takes £6.
      amount = round2(Math.min(discount.value, subtotal));
      break;
    case "FREE_SHIPPING":
      freeShipping = true;
      break;
    default:
      return INVALID("That code isn't valid.");
  }

  return {
    valid: true,
    code: discount.code,
    codeId: discount.id,
    type: discount.type,
    amount,
    freeShipping,
    description: discount.description,
  };
}

/**
 * Record a redemption once an order is actually paid for. Called inside the
 * order transaction so the counter can never drift from the orders it belongs to.
 */
export async function recordRedemption(
  tx: Pick<typeof prisma, "discountCode" | "discountRedemption">,
  {
    codeId,
    orderId,
    userId,
    email,
    amount,
  }: {
    codeId: string;
    orderId: string;
    userId?: string | null;
    email: string;
    amount: number;
  }
) {
  await tx.discountRedemption.create({
    data: {
      discountCodeId: codeId,
      orderId,
      userId: userId ?? null,
      email: email.toLowerCase(),
      amount,
    },
  });

  await tx.discountCode.update({
    where: { id: codeId },
    data: { timesRedeemed: { increment: 1 } },
  });
}
