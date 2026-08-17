import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Bespoke designs from the studio are not catalogue products — each one is
 * unique — but `OrderItem.productId` is a required foreign key. So every
 * bespoke line points at this single anchor product, and the design itself
 * travels in the order item's snapshot fields.
 *
 * It is deliberately unpublished, so it never appears in /shop listings.
 */
export const BESPOKE_PRODUCT_SLUG = "bespoke-crystal-design";

/**
 * Read-mostly: the row is created once and then only ever looked up, so the
 * designer page costs a single indexed SELECT rather than a write per render.
 * `cache` dedupes it across a single request's component tree.
 */
export const ensureBespokeProduct = cache(async () => {
  const existing = await prisma.product.findUnique({
    where: { slug: BESPOKE_PRODUCT_SLUG },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.product.upsert({
    where: { slug: BESPOKE_PRODUCT_SLUG },
    update: {},
    create: {
      slug: BESPOKE_PRODUCT_SLUG,
      title: "Bespoke Crystal Design",
      shortDescription:
        "A one-off piece designed in the Tengology studio and made to order in Oxford.",
      category: "JEWELLERY",
      // Priced per design by the designer engine, never from this row.
      price: 0,
      stockCount: 0,
      isPublished: false,
    },
    select: { id: true },
  });
});
