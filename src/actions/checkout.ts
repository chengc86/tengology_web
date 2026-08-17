"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { priceCart, createPendingOrder, releaseOrderStock, recordOrderEvent, OrderStockError } from "@/lib/orders";
import { getShippingOptions } from "@/lib/shipping";
import { createSquarePayment, isSquareConfigured, serialiseError, type SquareAddress } from "@/lib/square";
import { sendOrderConfirmation, sendAdminNewOrder, sendPaymentFailed } from "@/lib/email";
import { ORDER_EVENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { CURRENCY } from "@/lib/money";
import { HOME_COUNTRY, countryName, isDomestic } from "@/lib/countries";
import { placeOrderSchema, quoteSchema, fieldErrors, type AddressInput } from "@/lib/validation";
import type { CartIssue, PricedCart } from "@/lib/orders";
import type { ShippingOption } from "@/lib/shipping";

/**
 * Checkout.
 *
 * `quoteCheckout` prices a basket for display; `placeOrder` is the only thing
 * that moves money. Both re-derive every figure from the database — the client
 * sends product ids and quantities, never prices.
 */

export interface QuoteResult {
  ok: boolean;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  currency: string;
  lines: PricedCart["lines"];
  issues: CartIssue[];
  shippingOptions: ShippingOption[];
  selectedShippingId: string | null;
  discount: { valid: boolean; code?: string; reason?: string; description?: string | null } | null;
  freeShippingRemaining: number;
  /** Destination context, so the UI can explain duties and unsupported countries. */
  country: string;
  shipsToCountry: boolean;
  customsApplies: boolean;
}

export async function quoteCheckout(input: unknown): Promise<QuoteResult> {
  const parsed = quoteSchema.safeParse(input);

  if (!parsed.success) {
    return emptyQuote();
  }

  const session = await auth();
  const data = parsed.data;

  const priced = await priceCart({
    items: data.items,
    shippingMethodId: data.shippingMethodId,
    discountCode: data.discountCode,
    country: data.country,
    email: data.email || session?.user?.email,
    userId: session?.user?.id,
  });

  const shippingOptions = await getShippingOptions(priced.subtotal, data.country);
  const { amountUntilFreeShipping } = await import("@/lib/shipping");

  return {
    ok: true,
    country: data.country,
    shipsToCountry: shippingOptions.length > 0,
    // Anything leaving the UK may attract import VAT or duty on arrival.
    customsApplies: !isDomestic(data.country),
    subtotal: priced.subtotal,
    discountAmount: priced.discountAmount,
    shippingCost: priced.shippingCost,
    taxAmount: priced.taxAmount,
    total: priced.total,
    itemCount: priced.itemCount,
    currency: priced.currency,
    lines: priced.lines,
    issues: priced.issues,
    shippingOptions,
    selectedShippingId: priced.shipping?.id ?? null,
    discount: priced.discount
      ? {
          valid: priced.discount.valid,
          code: priced.discount.code,
          reason: priced.discount.reason,
          description: priced.discount.description,
        }
      : null,
    freeShippingRemaining: await amountUntilFreeShipping(priced.subtotal, data.country),
  };
}

function emptyQuote(): QuoteResult {
  return {
    ok: false,
    subtotal: 0,
    discountAmount: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 0,
    itemCount: 0,
    currency: CURRENCY,
    lines: [],
    issues: [],
    shippingOptions: [],
    selectedShippingId: null,
    discount: null,
    freeShippingRemaining: 0,
    country: HOME_COUNTRY,
    shipsToCountry: true,
    customsApplies: false,
  };
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; orderId: string; guestToken: string | null; total: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; issues?: CartIssue[]; retryable?: boolean };

/**
 * Place and pay for an order.
 *
 * Order of operations matters: the order row and its stock claim are written
 * *before* the card is charged, so a crash mid-payment always leaves a record
 * we can reconcile against Square. If the charge fails we release the stock
 * and mark the order FAILED rather than deleting it.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const email = (session?.user?.email ?? data.email).toLowerCase();

  // 1. Re-price server-side. Whatever the client believed is irrelevant.
  const priced = await priceCart({
    items: data.items,
    shippingMethodId: data.shippingMethodId,
    discountCode: data.discountCode,
    country: data.shippingAddress.country,
    email,
    userId,
  });

  if (priced.lines.length === 0) {
    return {
      ok: false,
      error: "Your basket is empty or none of the items are available any more.",
      issues: priced.issues,
    };
  }

  // Anything removed or reduced needs the shopper's eyes before we charge them.
  if (priced.issues.length > 0) {
    return {
      ok: false,
      error: "Your basket changed while you were checking out. Please review it and try again.",
      issues: priced.issues,
    };
  }

  // No delivery option means no route to this destination — say so plainly
  // rather than failing on a generic "choose a delivery method".
  if (!priced.shipping) {
    return {
      ok: false,
      error: `We can't deliver to ${countryName(data.shippingAddress.country)} yet. Please email us and we'll see what we can arrange.`,
      fieldErrors: { "shippingAddress.country": "Not currently served" },
    };
  }

  const squareReady = isSquareConfigured();

  if (squareReady && !data.sourceId) {
    return { ok: false, error: "Please enter your card details.", retryable: true };
  }

  // 2. Claim stock and create the order.
  let order;
  try {
    order = await createPendingOrder({
      priced,
      email,
      phone: data.phone || null,
      userId,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingSameAsShipping ? data.shippingAddress : (data.billingAddress ?? null),
      notes: data.notes || null,
      giftMessage: data.giftMessage || null,
    });
  } catch (error) {
    if (error instanceof OrderStockError) {
      return {
        ok: false,
        error: error.message,
        issues: [
          {
            productId: error.productId,
            title: "",
            type: "INSUFFICIENT_STOCK",
            message: error.message,
            availableQuantity: error.availableQuantity,
          },
        ],
      };
    }
    console.error("[checkout] order creation failed", error);
    return { ok: false, error: "We couldn't create your order. Please try again.", retryable: true };
  }

  if (data.marketingOptIn && userId) {
    await prisma.user.update({ where: { id: userId }, data: { marketingOptIn: true } }).catch(() => {});
  }

  // 3. Without Square credentials the shop still takes orders — they simply
  //    stay unpaid for the owner to collect manually.
  if (!squareReady) {
    await recordOrderEvent({
      orderId: order.id,
      type: ORDER_EVENT.NOTE,
      message: "Payment provider not configured — order recorded as awaiting payment.",
      actor: "system",
      isCustomerVisible: false,
    });

    await deliverNewOrderEmails(order.id, { confirmation: true });

    return {
      ok: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      guestToken: userId ? null : order.guestToken,
      total: order.total,
    };
  }

  // 4. Charge. The idempotency key is tied to this order, so a retried
  //    submission can never take the money twice.
  const idempotencyKey = `${order.id}-${randomUUID().slice(0, 8)}`;

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      idempotencyKey,
      status: "PENDING",
      amount: order.total,
      currency: order.currency,
    },
  });

  const result = await createSquarePayment({
    sourceId: data.sourceId!,
    idempotencyKey,
    amount: order.total,
    currency: order.currency,
    orderNumber: order.orderNumber,
    buyerEmail: email,
    verificationToken: data.verificationToken ?? undefined,
    billingAddress: toSquareAddress(
      data.billingSameAsShipping ? data.shippingAddress : (data.billingAddress ?? data.shippingAddress)
    ),
    shippingAddress: toSquareAddress(data.shippingAddress),
  });

  if (!result.ok) {
    // 5a. Payment refused — release the stock, keep the order for the record.
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        squarePaymentId: result.paymentId ?? null,
        errorCode: result.errorCode ?? null,
        errorMessage: result.errorMessage ?? null,
        raw: result.raw ? serialiseError(result.raw) : null,
      },
    });

    await releaseOrderStock(order.id, "Payment failed", "system");

    await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.FAILED, paymentStatus: PAYMENT_STATUS.FAILED },
    });

    await recordOrderEvent({
      orderId: order.id,
      type: ORDER_EVENT.PAYMENT_FAILED,
      message: result.errorMessage ?? "Payment failed",
      meta: { code: result.errorCode },
      actor: "system",
    });

    // Only email a failure if the shopper is unlikely to still be watching.
    sendPaymentFailedSafely(order.id, result.errorMessage ?? "Your payment was declined.");

    return {
      ok: false,
      error: result.errorMessage ?? "Your payment was declined. Please try another card.",
      retryable: true,
    };
  }

  // 5b. Paid.
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      squarePaymentId: result.paymentId ?? null,
      receiptUrl: result.receiptUrl ?? null,
      cardBrand: result.cardBrand ?? null,
      last4: result.last4 ?? null,
      walletType: result.walletType ?? null,
      raw: result.raw ? serialiseError(result.raw) : null,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUS.PAID,
      paymentStatus: PAYMENT_STATUS.PAID,
      paidAt: new Date(),
      squarePaymentId: result.paymentId ?? null,
      squareReceiptUrl: result.receiptUrl ?? null,
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    type: ORDER_EVENT.PAYMENT_SUCCEEDED,
    message: `Payment received${result.cardBrand ? ` — ${result.cardBrand} ending ${result.last4}` : ""}`,
    meta: { paymentId: result.paymentId },
    actor: "system",
  });

  await deliverNewOrderEmails(order.id, { confirmation: true });

  return {
    ok: true,
    orderNumber: order.orderNumber,
    orderId: order.id,
    guestToken: userId ? null : order.guestToken,
    total: order.total,
  };
}

/** Email failures must never fail a paid order, so everything here is swallowed. */
async function deliverNewOrderEmails(orderId: string, { confirmation }: { confirmation: boolean }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    if (confirmation) {
      const sent = await sendOrderConfirmation(order);
      if (sent.ok) {
        await recordOrderEvent({
          orderId,
          type: ORDER_EVENT.EMAIL_SENT,
          message: "Order confirmation emailed",
          actor: "system",
          isCustomerVisible: false,
        });
      }
    }

    await sendAdminNewOrder(order);
  } catch (error) {
    console.error("[checkout] email dispatch failed", error);
  }
}

async function sendPaymentFailedSafely(orderId: string, message: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (order) await sendPaymentFailed(order, message);
  } catch {
    // best effort
  }
}

function toSquareAddress(address: AddressInput): SquareAddress {
  return {
    addressLine1: address.line1,
    addressLine2: address.line2 || undefined,
    locality: address.city,
    administrativeDistrictLevel1: address.county || undefined,
    postalCode: address.postcode,
    country: address.country,
    firstName: address.firstName,
    lastName: address.lastName,
  };
}

/** Addresses saved on the account, offered as one-tap fill at checkout. */
export async function getSavedAddresses() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
