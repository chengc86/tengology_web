import "dotenv/config";
import { prisma } from "../src/lib/db";
import { codesInRegion } from "../src/lib/countries";

/**
 * Seeds the commercial configuration a storefront needs before it can take an
 * order: delivery options, store settings, and a starter discount code.
 * Safe to re-run — everything is upserted.
 */

const SHIPPING_METHODS = [
  {
    id: "standard-uk",
    name: "Standard Delivery",
    description: "Royal Mail Tracked 48",
    carrier: "ROYAL_MAIL",
    price: 3.95,
    freeThreshold: 50,
    minDays: 2,
    maxDays: 4,
    countries: "GB",
    sortOrder: 0,
  },
  {
    id: "express-uk",
    name: "Express Delivery",
    description: "Royal Mail Tracked 24",
    carrier: "ROYAL_MAIL",
    price: 6.95,
    freeThreshold: null,
    minDays: 1,
    maxDays: 2,
    countries: "GB",
    sortOrder: 1,
  },
  {
    id: "ireland",
    name: "Ireland Delivery",
    description: "Tracked international",
    carrier: "ROYAL_MAIL",
    price: 9.95,
    freeThreshold: null,
    minDays: 3,
    maxDays: 7,
    countries: "IE",
    sortOrder: 2,
  },
  {
    id: "europe",
    name: "Europe Delivery",
    description: "Royal Mail International Tracked",
    carrier: "ROYAL_MAIL",
    price: 12.95,
    freeThreshold: null,
    minDays: 5,
    maxDays: 10,
    // Ireland has its own cheaper rate above, and specificity wins.
    countries: codesInRegion("Europe").join(","),
    sortOrder: 3,
  },
  {
    id: "international",
    name: "International Delivery",
    description: "Royal Mail International Tracked",
    carrier: "ROYAL_MAIL",
    price: 19.95,
    freeThreshold: null,
    minDays: 7,
    maxDays: 21,
    // Catch-all: used only where no zone names the country directly.
    countries: "*",
    sortOrder: 4,
  },
];

const SETTINGS = {
  storeName: "Tengology",
  storeEmail: "orders@tengology.com",
  supportEmail: "hello@tengology.com",
  freeShippingThreshold: "50",
  taxRatePercent: "0",
  taxIncludedInPrice: "true",
  allowGuestCheckout: "true",
  lowStockThreshold: "3",
  orderPrefix: "TNG",
};

async function main() {
  for (const method of SHIPPING_METHODS) {
    const { id, ...data } = method;
    await prisma.shippingMethod.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }
  console.log(`✓ ${SHIPPING_METHODS.length} shipping methods`);

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {}, // never clobber a value the owner has changed in the admin
    });
  }
  console.log(`✓ ${Object.keys(SETTINGS).length} store settings`);

  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      type: "PERCENT",
      value: 10,
      minSubtotal: 20,
      perCustomerLimit: 1,
      isActive: true,
    },
    update: {},
  });
  console.log("✓ starter discount code WELCOME10");

  // The order counter drives order numbers; start it past any existing orders.
  const orderCount = await prisma.order.count();
  await prisma.setting.upsert({
    where: { key: "orderSeq" },
    create: { key: "orderSeq", value: String(orderCount) },
    update: {},
  });
  console.log(`✓ order sequence primed at ${orderCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
