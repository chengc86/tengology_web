import "dotenv/config";
import { prisma } from "../src/lib/db";
import { priceCart, createPendingOrder, releaseOrderStock, OrderStockError } from "../src/lib/orders";

/**
 * Concurrency safety on Postgres.
 *
 * SQLite serialised every write, so read-then-write stock logic was safe by
 * accident. Postgres runs at READ COMMITTED and does not, so these checks fire
 * simultaneous checkouts at the same scarce stock and assert that the database
 * never goes negative and no order number is ever reused.
 */

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) console.log(`  ✓ ${label}`);
  else {
    failures++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

async function placeOne(productId: string, quantity: number) {
  const priced = await priceCart({ items: [{ productId, quantity }], country: "GB" });
  if (priced.lines.length === 0) return { ok: false as const, reason: "no stock at pricing time" };

  try {
    const order = await createPendingOrder({
      priced,
      email: `race-${Math.random().toString(36).slice(2, 8)}@example.com`,
      userId: null,
      shippingAddress: {
        firstName: "Race",
        lastName: "Test",
        line1: "1 Test Street",
        city: "Oxford",
        postcode: "OX1 1AA",
        country: "GB",
      },
    });
    return { ok: true as const, order };
  } catch (error) {
    if (error instanceof OrderStockError) return { ok: false as const, reason: error.message };
    throw error;
  }
}

async function main() {
  const product = await prisma.product.findFirstOrThrow({
    where: { isPublished: true },
  });

  const originalStock = product.stockCount;
  const created: string[] = [];

  try {
    // ── Everyone races for the single last piece ────
    console.log("\nSingle last item, 8 simultaneous buyers");
    await prisma.product.update({ where: { id: product.id }, data: { stockCount: 1 } });

    const results = await Promise.all(
      Array.from({ length: 8 }, () => placeOne(product.id, 1))
    );

    const winners = results.filter((r) => r.ok);
    for (const r of results) if (r.ok) created.push(r.order.id);

    const afterRace = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });

    check("exactly one buyer succeeded", winners.length === 1, {
      winners: winners.length,
      reasons: results.filter((r) => !r.ok).map((r) => r.reason),
    });
    check("stock never went negative", afterRace.stockCount >= 0, afterRace.stockCount);
    check("stock landed at zero", afterRace.stockCount === 0, afterRace.stockCount);

    // ── Order numbers stay unique under load ───────
    console.log("\nConcurrent order numbering");
    await prisma.product.update({ where: { id: product.id }, data: { stockCount: 20 } });

    const batch = await Promise.all(Array.from({ length: 10 }, () => placeOne(product.id, 1)));
    const numbers = batch.filter((r) => r.ok).map((r) => r.order.orderNumber);
    for (const r of batch) if (r.ok) created.push(r.order.id);

    check("all ten orders were created", numbers.length === 10, numbers.length);
    check("every order number is unique", new Set(numbers).size === numbers.length, numbers);
    check(
      "order numbers are well formed",
      numbers.every((n) => /^[A-Z]+-\d{4}-\d{5}$/.test(n)),
      numbers.slice(0, 3)
    );

    const afterBatch = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    check("stock decremented exactly ten times", afterBatch.stockCount === 10, afterBatch.stockCount);

    // ── Over-claiming a partially stocked product ──
    console.log("\nCompeting for limited stock");
    await prisma.product.update({ where: { id: product.id }, data: { stockCount: 3 } });

    const greedy = await Promise.all([
      placeOne(product.id, 2),
      placeOne(product.id, 2),
      placeOne(product.id, 2),
    ]);
    for (const r of greedy) if (r.ok) created.push(r.order.id);

    const afterGreedy = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    const sold = greedy.filter((r) => r.ok).length;

    check("at most one 2-unit order cleared 3 in stock", sold === 1, {
      sold,
      remaining: afterGreedy.stockCount,
    });
    check("stock never went negative", afterGreedy.stockCount >= 0, afterGreedy.stockCount);
  } finally {
    // ── Clean up ─────────────────────────────────
    for (const id of created) {
      await releaseOrderStock(id, "Concurrency test cleanup", "test").catch(() => {});
      await prisma.order.delete({ where: { id } }).catch(() => {});
    }
    await prisma.inventoryLog.deleteMany({
      where: {
        OR: [
          { note: { contains: "Concurrency test cleanup" } },
          { note: { contains: "Reserved at checkout" } },
        ],
      },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { stockCount: originalStock },
    });
    console.log(`\nRestored "${product.title}" to ${originalStock} in stock`);
  }

  console.log(
    failures === 0 ? "\n✅ All concurrency checks passed\n" : `\n❌ ${failures} check(s) failed\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
