import "dotenv/config";
import { prisma } from "../src/lib/db";
import { priceCart, createPendingOrder, releaseOrderStock, formatAddress } from "../src/lib/orders";
import { getShippingOptions, amountUntilFreeShipping } from "../src/lib/shipping";
import { addressSchema } from "../src/lib/validation";
import { countryName, isPostcodeRequired, countriesByRegion } from "../src/lib/countries";

/**
 * International selling: zone routing, duty-free-shipping rules, per-country
 * postcode handling, VAT zero-rating on exports, and a real overseas order.
 */

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) console.log(`  ✓ ${label}`);
  else {
    failures++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

async function main() {
  const product = await prisma.product.findFirstOrThrow({
    where: { isPublished: true, stockCount: { gt: 0 } },
  });
  const created: string[] = [];

  console.log(`\nUsing "${product.title}" at £${product.price}\n`);

  // ── Zone routing ─────────────────────────────────
  console.log("Shipping zone routing");
  const zones: Array<[string, string]> = [
    ["GB", "Standard Delivery"],
    ["IE", "Ireland Delivery"],
    ["FR", "Europe Delivery"],
    ["DE", "Europe Delivery"],
    ["US", "International Delivery"],
    ["AU", "International Delivery"],
    ["JP", "International Delivery"],
  ];

  for (const [code, expected] of zones) {
    const options = await getShippingOptions(20, code);
    check(
      `${countryName(code)} → ${expected}`,
      options.some((o) => o.name === expected),
      options.map((o) => o.name)
    );
  }

  // Specificity: a European country must not also be offered the catch-all.
  const french = await getShippingOptions(20, "FR");
  check(
    "France isn't offered the catch-all as well",
    !french.some((o) => o.name === "International Delivery"),
    french.map((o) => o.name)
  );

  const unknown = await getShippingOptions(20, "ZZ");
  check("an unknown country still resolves to the catch-all", unknown.length > 0);

  // ── Free delivery stays domestic ─────────────────
  console.log("\nFree delivery is UK-only");
  const ukBig = await getShippingOptions(200, "GB");
  const usBig = await getShippingOptions(200, "US");
  const frBig = await getShippingOptions(200, "FR");

  check("£200 UK order gets free delivery", ukBig.some((o) => o.effectivePrice === 0), ukBig);
  check(
    "£200 US order is still charged delivery",
    usBig.every((o) => o.effectivePrice > 0),
    usBig.map((o) => `${o.name}: ${o.effectivePrice}`)
  );
  check(
    "£200 France order is still charged delivery",
    frBig.every((o) => o.effectivePrice > 0),
    frBig.map((o) => `${o.name}: ${o.effectivePrice}`)
  );

  check("UK shopper is nudged toward free delivery", (await amountUntilFreeShipping(10, "GB")) > 0);
  check(
    "overseas shopper isn't promised free delivery",
    (await amountUntilFreeShipping(10, "US")) === 0
  );

  // ── Postcode rules ───────────────────────────────
  console.log("\nPer-country postcode rules");
  check("UK requires a postcode", isPostcodeRequired("GB"));
  check("Hong Kong does not", !isPostcodeRequired("HK"));
  check("UAE does not", !isPostcodeRequired("AE"));

  const noPostcode = addressSchema.safeParse({
    firstName: "Wing",
    lastName: "Chan",
    line1: "12 Hollywood Road",
    city: "Sheung Wan",
    country: "HK",
    postcode: "",
  });
  check("a Hong Kong address validates without a postcode", noPostcode.success, noPostcode.error?.issues);

  const missingUkPostcode = addressSchema.safeParse({
    firstName: "Ada",
    lastName: "Lovelace",
    line1: "12 Bead Lane",
    city: "Oxford",
    country: "GB",
    postcode: "",
  });
  check("a UK address without a postcode is rejected", !missingUkPostcode.success);

  const unsupported = addressSchema.safeParse({
    firstName: "Test",
    lastName: "Test",
    line1: "1 Street",
    city: "Nowhere",
    country: "ZZ",
    postcode: "12345",
  });
  check("an unsupported country is rejected", !unsupported.success);

  // ── Export VAT ───────────────────────────────────
  console.log("\nVAT on exports");
  await prisma.setting.upsert({
    where: { key: "taxRatePercent" },
    create: { key: "taxRatePercent", value: "20" },
    update: { value: "20" },
  });
  await prisma.setting.upsert({
    where: { key: "taxIncludedInPrice" },
    create: { key: "taxIncludedInPrice", value: "false" },
    update: { value: "false" },
  });

  const ukTaxed = await priceCart({ items: [{ productId: product.id, quantity: 1 }], country: "GB" });
  const usTaxed = await priceCart({ items: [{ productId: product.id, quantity: 1 }], country: "US" });

  check("UK order is charged VAT at 20%", ukTaxed.taxAmount > 0, ukTaxed.taxAmount);
  check("export is zero-rated", usTaxed.taxAmount === 0, usTaxed.taxAmount);

  await prisma.setting.update({ where: { key: "taxRatePercent" }, data: { value: "0" } });
  await prisma.setting.update({ where: { key: "taxIncludedInPrice" }, data: { value: "true" } });

  // ── A real overseas order ────────────────────────
  console.log("\nPlacing an order to Japan");
  const priced = await priceCart({
    items: [{ productId: product.id, quantity: 1 }],
    country: "JP",
  });

  check("a delivery option was found", priced.shipping !== null, priced.shipping);
  check("international delivery was charged", priced.shippingCost > 0, priced.shippingCost);

  const order = await createPendingOrder({
    priced,
    email: "intl-test@example.com",
    userId: null,
    shippingAddress: {
      firstName: "Yuki",
      lastName: "Tanaka",
      line1: "2-1 Nishishinjuku",
      city: "Tokyo",
      postcode: "163-8001",
      country: "JP",
    },
  });
  created.push(order.id);

  check("order was created", Boolean(order.orderNumber));
  check(
    "shipping method recorded",
    order.shippingMethodName === "International Delivery",
    order.shippingMethodName
  );
  check("no UK VAT on the export order", order.taxAmount === 0, order.taxAmount);

  const printed = formatAddress(JSON.parse(order.shippingAddress!));
  check("address prints the country name, not the code", printed.includes("Japan"), printed);

  // ── Picker coverage ──────────────────────────────
  console.log("\nCountry picker");
  const groups = countriesByRegion();
  const total = groups.reduce((n, g) => n + g.countries.length, 0);
  check("regions are populated", groups.length >= 5, groups.map((g) => g.region));
  check("a useful number of destinations is offered", total >= 50, total);

  // ── Clean up ─────────────────────────────────────
  for (const id of created) {
    await releaseOrderStock(id, "International test cleanup", "test").catch(() => {});
    await prisma.order.delete({ where: { id } }).catch(() => {});
  }
  await prisma.inventoryLog.deleteMany({
    where: {
      OR: [
        { note: { contains: "International test cleanup" } },
        { note: { contains: "Reserved at checkout" } },
      ],
    },
  });

  console.log(
    failures === 0 ? "\n✅ All international checks passed\n" : `\n❌ ${failures} check(s) failed\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
