import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { round2, sumMoney, CURRENCY } from "./money";
import { getNumericSetting, getSetting } from "./settings";
import { resolveShippingOption, type ShippingOption } from "./shipping";
import { validateDiscountCode, recordRedemption, type DiscountResult } from "./discounts";
import { ORDER_EVENT, ORDER_STATUS, PAYMENT_STATUS, FULFILLMENT_STATUS } from "./constants";
import { HOME_COUNTRY, countryName, isDomestic } from "./countries";

/**
 * Order pricing and lifecycle.
 *
 * Every figure a customer is charged is computed here from database prices —
 * the browser only ever sends product ids and quantities. `priceCart` is the
 * one place totals are derived, so the summary shown at checkout and the amount
 * sent to Square can never disagree.
 */

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  stockCount: number;
}

export interface CartIssue {
  productId: string;
  title: string;
  type: "UNAVAILABLE" | "INSUFFICIENT_STOCK" | "PRICE_CHANGED";
  message: string;
  availableQuantity?: number;
}

export interface PricedCart {
  lines: PricedLine[];
  issues: CartIssue[];
  subtotal: number;
  discountAmount: number;
  discount: DiscountResult | null;
  shipping: ShippingOption | null;
  shippingCost: number;
  taxAmount: number;
  total: number;
  currency: string;
  itemCount: number;
}

/**
 * Validate a cart against live product data and compute totals.
 *
 * Lines that can't be fulfilled are dropped into `issues` rather than throwing,
 * so the checkout can show the shopper exactly what changed and let them
 * continue with the rest of their basket.
 */
export async function priceCart({
  items,
  shippingMethodId,
  discountCode,
  country = HOME_COUNTRY,
  email,
  userId,
}: {
  items: CartLineInput[];
  shippingMethodId?: string | null;
  discountCode?: string | null;
  country?: string;
  email?: string | null;
  userId?: string | null;
}): Promise<PricedCart> {
  const issues: CartIssue[] = [];
  const lines: PricedLine[] = [];

  const wanted = items.filter((i) => i.quantity > 0);
  const productIds = [...new Set(wanted.map((i) => i.productId))];

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        },
      })
    : [];

  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of wanted) {
    const product = byId.get(item.productId);

    if (!product || !product.isPublished) {
      issues.push({
        productId: item.productId,
        title: product?.title ?? "This item",
        type: "UNAVAILABLE",
        message: `${product?.title ?? "An item"} is no longer available and has been removed.`,
      });
      continue;
    }

    if (product.stockCount <= 0) {
      issues.push({
        productId: product.id,
        title: product.title,
        type: "INSUFFICIENT_STOCK",
        message: `${product.title} has sold out and has been removed.`,
        availableQuantity: 0,
      });
      continue;
    }

    const quantity = Math.min(item.quantity, product.stockCount);

    if (quantity < item.quantity) {
      issues.push({
        productId: product.id,
        title: product.title,
        type: "INSUFFICIENT_STOCK",
        message: `Only ${product.stockCount} of ${product.title} left — your quantity was reduced.`,
        availableQuantity: product.stockCount,
      });
    }

    const unitPrice = round2(product.price);

    lines.push({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.images[0]?.url ?? null,
      unitPrice,
      quantity,
      totalPrice: round2(unitPrice * quantity),
      stockCount: product.stockCount,
    });
  }

  const subtotal = sumMoney(lines.map((l) => l.totalPrice));

  // Discount is validated against the *current* subtotal, so removing an item
  // that dropped the basket below a code's minimum invalidates it immediately.
  let discount: DiscountResult | null = null;
  if (discountCode && subtotal > 0) {
    discount = await validateDiscountCode({ code: discountCode, subtotal, email, userId });
  }
  const discountAmount = discount?.valid ? discount.amount : 0;

  const shipping = lines.length ? await resolveShippingOption(shippingMethodId, subtotal, country) : null;
  const baseShipping = shipping?.effectivePrice ?? 0;
  const shippingCost = discount?.valid && discount.freeShipping ? 0 : baseShipping;

  const taxableBase = round2(Math.max(0, subtotal - discountAmount));
  const taxAmount = await computeTax(taxableBase, country);

  const total = round2(Math.max(0, taxableBase + shippingCost + taxAmount));

  return {
    lines,
    issues,
    subtotal,
    discountAmount,
    discount,
    shipping,
    shippingCost,
    taxAmount,
    total,
    currency: CURRENCY,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  };
}

/**
 * VAT. When prices are entered tax-inclusive (the default for a UK retail
 * storefront) there is nothing to add on top — the tax line stays 0 and the
 * VAT element is shown for information only.
 *
 * Exports are zero-rated: goods leaving the UK carry no UK VAT, and the
 * customer settles any import VAT or duty with their own customs authority.
 */
async function computeTax(taxableBase: number, country: string): Promise<number> {
  if (!isDomestic(country)) return 0;

  const rate = await getNumericSetting("taxRatePercent");
  if (!rate) return 0;
  const inclusive = (await getSetting("taxIncludedInPrice")) === "true";
  if (inclusive) return 0;
  return round2((taxableBase * rate) / 100);
}

/** The VAT already contained in a tax-inclusive total, for the receipt. */
export async function includedTaxPortion(total: number): Promise<number> {
  const rate = await getNumericSetting("taxRatePercent");
  const inclusive = (await getSetting("taxIncludedInPrice")) === "true";
  if (!rate || !inclusive) return 0;
  return round2(total - total / (1 + rate / 100));
}

export function generateGuestToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * TNG-2026-00042 — human-readable, sequential, unique.
 *
 * The counter is bumped by a single atomic upsert so two checkouts running at
 * the same time can't both read the same value and mint a duplicate order
 * number. `ON CONFLICT … DO UPDATE` re-reads the row under lock, and RETURNING
 * hands back the value this transaction actually claimed.
 */
async function nextOrderNumber(
  tx: Pick<typeof prisma, "$queryRaw">,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear();

  const rows = await tx.$queryRaw<Array<{ value: string }>>`
    INSERT INTO "Setting" ("key", "value", "updatedAt")
    VALUES ('orderSeq', '1', NOW())
    ON CONFLICT ("key") DO UPDATE
      SET "value" = ((COALESCE(NULLIF("Setting"."value", ''), '0'))::bigint + 1)::text,
          "updatedAt" = NOW()
    RETURNING "value"
  `;

  const next = Number(rows[0]?.value ?? "1") || 1;

  return `${prefix}-${year}-${String(next).padStart(5, "0")}`;
}

export interface CreateOrderInput {
  priced: PricedCart;
  email: string;
  phone?: string | null;
  userId?: string | null;
  shippingAddress: Record<string, unknown>;
  billingAddress?: Record<string, unknown> | null;
  notes?: string | null;
  giftMessage?: string | null;
}

/**
 * Create the order and take the stock in one transaction, before any money
 * moves. Stock is verified again inside the transaction: two shoppers racing
 * for the last piece means the loser's order is rejected rather than oversold.
 *
 * The order starts PENDING/UNPAID; payment flips it to PAID, and a failure
 * releases the stock again via `releaseOrderStock`.
 */
export async function createPendingOrder(input: CreateOrderInput) {
  const { priced } = input;

  if (priced.lines.length === 0) {
    throw new Error("Cannot create an order with no items.");
  }

  const prefix = await getSetting("orderPrefix");
  const guestToken = generateGuestToken();

  return prisma.$transaction(
    async (tx) => {
      // Claim stock with a conditional UPDATE rather than read-then-write.
      //
      // Postgres runs at READ COMMITTED, so a check followed by a decrement is
      // not atomic: two shoppers racing for the last piece can both read
      // stockCount = 1 and both decrement it. Folding the check into the
      // UPDATE's WHERE clause makes the database re-evaluate it against the
      // latest committed row, so exactly one of them claims the stock and the
      // loser gets count = 0.
      for (const line of priced.lines) {
        const claimed = await tx.product.updateMany({
          where: {
            id: line.productId,
            isPublished: true,
            stockCount: { gte: line.quantity },
          },
          data: { stockCount: { decrement: line.quantity } },
        });

        if (claimed.count === 0) {
          throw await describeFailedClaim(tx, line);
        }
      }

      // Read the post-claim levels in one round trip for the audit log.
      const productIds = priced.lines.map((l) => l.productId);
      const after = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stockCount: true },
      });
      const stockAfter = new Map(after.map((p) => [p.id, p.stockCount]));

      await tx.inventoryLog.createMany({
        data: priced.lines.map((line) => {
          const quantityAfter = stockAfter.get(line.productId) ?? 0;
          return {
            productId: line.productId,
            changeType: "SALE",
            quantityBefore: quantityAfter + line.quantity,
            quantityAfter,
            delta: -line.quantity,
            note: "Reserved at checkout",
            triggeredBy: input.userId ?? "guest",
          };
        }),
      });

      const orderNumber = await nextOrderNumber(tx, prefix);

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId ?? null,
        email: input.email.toLowerCase(),
        guestEmail: input.userId ? null : input.email.toLowerCase(),
        phone: input.phone ?? null,
        guestToken,
        status: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        fulfillmentStatus: FULFILLMENT_STATUS.UNFULFILLED,
        currency: priced.currency,
        subtotal: priced.subtotal,
        discountAmount: priced.discountAmount,
        discountCode: priced.discount?.valid ? priced.discount.code : null,
        shippingCost: priced.shippingCost,
        shippingMethodId: priced.shipping?.id ?? null,
        shippingMethodName: priced.shipping?.name ?? null,
        taxAmount: priced.taxAmount,
        total: priced.total,
        shippingAddress: JSON.stringify(input.shippingAddress),
        billingAddress: input.billingAddress ? JSON.stringify(input.billingAddress) : null,
        notes: input.notes ?? null,
        giftMessage: input.giftMessage ?? null,
        items: {
          create: priced.lines.map((line) => ({
            productId: line.productId,
            productTitleSnapshot: line.title,
            productSlugSnapshot: line.slug,
            productImageSnapshot: line.image,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
          })),
        },
        events: {
          create: {
            type: ORDER_EVENT.CREATED,
            message: "Order placed",
            actor: input.userId ?? "customer",
            isCustomerVisible: true,
          },
        },
      },
      include: { items: true },
    });

      if (priced.discount?.valid && priced.discount.codeId) {
        await recordRedemption(tx, {
          codeId: priced.discount.codeId,
          orderId: order.id,
          userId: input.userId,
          email: input.email,
          amount: priced.discountAmount,
        });
      }

      return order;
    },
    // Neon is a network hop away, so a multi-item order needs more headroom
    // than Prisma's 5s default before the transaction is rolled back.
    { timeout: 20_000, maxWait: 10_000 }
  );
}

/**
 * Work out why a stock claim failed so the shopper gets a useful message.
 * Only runs on the losing path, so the extra read costs nothing normally.
 */
async function describeFailedClaim(
  tx: Pick<typeof prisma, "product">,
  line: { productId: string; title: string; quantity: number }
): Promise<OrderStockError> {
  const product = await tx.product.findUnique({
    where: { id: line.productId },
    select: { stockCount: true, title: true, isPublished: true },
  });

  if (!product || !product.isPublished) {
    return new OrderStockError(`${line.title} is no longer available.`, line.productId);
  }

  return new OrderStockError(
    product.stockCount === 0
      ? `${product.title} has just sold out.`
      : `Only ${product.stockCount} of ${product.title} left.`,
    line.productId,
    product.stockCount
  );
}

export class OrderStockError extends Error {
  constructor(
    message: string,
    public productId: string,
    public availableQuantity?: number
  ) {
    super(message);
    this.name = "OrderStockError";
  }
}

/** Put stock back when a payment fails or an order is cancelled. */
export async function releaseOrderStock(orderId: string, reason: string, actor = "system") {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const restoreQty = item.quantity - item.quantityRefunded;
      if (restoreQty <= 0) continue;

      // `increment` is applied by the database, so the returned row is the
      // authoritative post-increment level even under concurrent writes —
      // the "before" figure is derived from it rather than a separate read.
      const updated = await tx.product
        .update({
          where: { id: item.productId },
          data: { stockCount: { increment: restoreQty } },
          select: { stockCount: true },
        })
        .catch(() => null);

      if (!updated) continue;

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          changeType: "RESTOCK",
          quantityBefore: updated.stockCount - restoreQty,
          quantityAfter: updated.stockCount,
          delta: restoreQty,
          note: `${reason} — order ${order.orderNumber}`,
          triggeredBy: actor,
        },
      });
    }
  });
}

export async function recordOrderEvent({
  orderId,
  type,
  message,
  meta,
  actor,
  isCustomerVisible = true,
}: {
  orderId: string;
  type: string;
  message: string;
  meta?: unknown;
  actor?: string;
  isCustomerVisible?: boolean;
}) {
  return prisma.orderEvent.create({
    data: {
      orderId,
      type,
      message,
      meta: meta === undefined ? null : JSON.stringify(meta),
      actor: actor ?? "system",
      isCustomerVisible,
    },
  });
}

/** Parse the JSON address blobs stored on an order. */
export interface StoredAddress {
  firstName?: string;
  lastName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export function parseAddress(json: string | null): StoredAddress | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StoredAddress;
  } catch {
    return null;
  }
}

export function formatAddress(address: StoredAddress | null): string[] {
  if (!address) return [];
  return [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.line1,
    address.line2,
    address.city,
    address.county,
    address.postcode,
    countryName(address.country ?? HOME_COUNTRY),
  ].filter((line): line is string => Boolean(line && line.trim()));
}

/** How much of an order is still refundable. */
export function refundableAmount(order: { total: number; refundedAmount: number }): number {
  return round2(Math.max(0, order.total - order.refundedAmount));
}
