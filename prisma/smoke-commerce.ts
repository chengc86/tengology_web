import "dotenv/config";
import { prisma } from "../src/lib/db";
import { priceCart, createPendingOrder, releaseOrderStock, recordOrderEvent } from "../src/lib/orders";
import { validateDiscountCode } from "../src/lib/discounts";
import { getShippingOptions } from "../src/lib/shipping";

/**
 * End-to-end exercise of the order pipeline against the real database:
 * pricing → discounts → stock claim → order creation → cancellation restock.
 * Cleans up after itself so it can be run repeatedly.
 */

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

async function main() {
  const product = await prisma.product.findFirst({
    where: { isPublished: true, stockCount: { gt: 0 } },
  });

  if (!product) {
    console.error("No published product with stock — seed the database first.");
    process.exit(1);
  }

  const startingStock = product.stockCount;
  console.log(`\nUsing "${product.title}" — ${startingStock} in stock at £${product.price}\n`);

  // ── Pricing ──────────────────────────────────────
  console.log("Pricing");
  const shippingOptions = await getShippingOptions(product.price, "GB");
  check("shipping options are offered", shippingOptions.length > 0);

  const priced = await priceCart({
    items: [{ productId: product.id, quantity: 1 }],
    shippingMethodId: shippingOptions[0]?.id,
    country: "GB",
  });

  check("one line priced", priced.lines.length === 1);
  check("no issues on a clean cart", priced.issues.length === 0, priced.issues);
  check(
    "subtotal matches the database price",
    priced.subtotal === Math.round(product.price * 100) / 100,
    { subtotal: priced.subtotal, price: product.price }
  );
  check(
    "total = subtotal + shipping",
    priced.total === Math.round((priced.subtotal + priced.shippingCost) * 100) / 100,
    { total: priced.total, subtotal: priced.subtotal, shipping: priced.shippingCost }
  );

  // ── Over-ordering is clamped, not oversold ───────
  console.log("\nStock limits");
  const greedy = await priceCart({
    items: [{ productId: product.id, quantity: startingStock + 5 }],
    country: "GB",
  });
  check("quantity is clamped to available stock", greedy.lines[0]?.quantity === startingStock, {
    got: greedy.lines[0]?.quantity,
    stock: startingStock,
  });
  check("shopper is warned about the reduction", greedy.issues.length > 0);

  // ── Discounts ────────────────────────────────────
  console.log("\nDiscounts");
  const bogus = await validateDiscountCode({ code: "NOT-A-REAL-CODE", subtotal: 100 });
  check("unknown code is rejected", !bogus.valid);

  const welcome = await validateDiscountCode({ code: "WELCOME10", subtotal: 100 });
  check("WELCOME10 gives 10% off £100", welcome.valid && welcome.amount === 10, welcome);

  const belowMinimum = await validateDiscountCode({ code: "WELCOME10", subtotal: 5 });
  check("minimum spend is enforced", !belowMinimum.valid, belowMinimum);

  // ── Order creation claims stock ──────────────────
  console.log("\nOrder creation");
  const order = await createPendingOrder({
    priced,
    email: "smoke-test@example.com",
    userId: null,
    shippingAddress: {
      firstName: "Smoke",
      lastName: "Test",
      line1: "1 Test Street",
      city: "Oxford",
      postcode: "OX1 1AA",
      country: "GB",
    },
  });

  check("order number was issued", /^TNG-\d{4}-\d{5}$/.test(order.orderNumber), order.orderNumber);
  check("guest token was issued", Boolean(order.guestToken));
  check("order starts unpaid", order.paymentStatus === "UNPAID" && order.status === "PENDING");
  check("order total matches the quote", order.total === priced.total);

  const afterOrder = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  check("stock was decremented", afterOrder.stockCount === startingStock - 1, {
    before: startingStock,
    after: afterOrder.stockCount,
  });

  const saleLog = await prisma.inventoryLog.findFirst({
    where: { productId: product.id, changeType: "SALE" },
    orderBy: { createdAt: "desc" },
  });
  check("inventory movement was logged", saleLog?.delta === -1, saleLog);

  const created = await prisma.orderEvent.findFirst({
    where: { orderId: order.id, type: "CREATED" },
  });
  check("timeline records creation", Boolean(created));

  // Order numbers must never collide.
  const second = await createPendingOrder({
    priced: await priceCart({ items: [{ productId: product.id, quantity: 1 }], country: "GB" }),
    email: "smoke-test-2@example.com",
    userId: null,
    shippingAddress: { firstName: "A", lastName: "B", line1: "2 Test St", city: "Oxford", postcode: "OX1 1AA", country: "GB" },
  });
  check("sequential order numbers are unique", second.orderNumber !== order.orderNumber, {
    first: order.orderNumber,
    second: second.orderNumber,
  });

  // ── Cancellation restores stock ──────────────────
  console.log("\nCancellation");
  await releaseOrderStock(order.id, "Smoke test cancellation", "test");
  await releaseOrderStock(second.id, "Smoke test cancellation", "test");

  const afterRelease = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  check("stock was fully restored", afterRelease.stockCount === startingStock, {
    expected: startingStock,
    got: afterRelease.stockCount,
  });

  await recordOrderEvent({
    orderId: order.id,
    type: "CANCELLED",
    message: "Smoke test cleanup",
    actor: "test",
  });

  // ── Sold-out handling ────────────────────────────
  console.log("\nSold-out handling");
  await prisma.product.update({ where: { id: product.id }, data: { stockCount: 0 } });
  const soldOut = await priceCart({ items: [{ productId: product.id, quantity: 1 }], country: "GB" });
  check("sold-out item is dropped from the basket", soldOut.lines.length === 0);
  check("sold-out item raises an issue", soldOut.issues[0]?.type === "INSUFFICIENT_STOCK", soldOut.issues);
  await prisma.product.update({ where: { id: product.id }, data: { stockCount: startingStock } });

  // ── Clean up ─────────────────────────────────────
  await prisma.order.deleteMany({ where: { id: { in: [order.id, second.id] } } });
  await prisma.inventoryLog.deleteMany({
    where: { productId: product.id, note: { contains: "Smoke test" } },
  });
  await prisma.inventoryLog.deleteMany({
    where: { productId: product.id, note: { contains: "Reserved at checkout" } },
  });

  const finalStock = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  check("stock is back where it started", finalStock.stockCount === startingStock);

  console.log(
    failures === 0 ? "\n✅ All commerce checks passed\n" : `\n❌ ${failures} check(s) failed\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
