import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = [
    // ─── Crystal Bracelets (Stone & Spirit collection) ───
    {
      slug: "autumn-glow-mixed-crystal-bracelet",
      title: "Autumn Glow Mixed Crystal Bracelet",
      shortDescription:
        "A one-of-a-kind chunky bracelet featuring sunstone, grey agate, citrine, and smoky quartz in warm, earthy tones.",
      fullDescription:
        "This stunning handmade bracelet brings together a curated mix of natural crystals in warm autumnal tones. Each 14–15mm bead has been hand-selected for its unique colour, clarity, and character.\n\nThe bracelet features golden sunstone with its signature shimmer, banded grey agate, honey-toned citrine, and translucent smoky quartz — all strung together to create a harmonious blend of warmth and grounding energy.\n\nAs a one-of-a-kind piece, no two beads are alike, and this exact combination cannot be recreated. Sunstone is believed to carry the energy of the sun, promoting joy and vitality, while smoky quartz is known for its grounding and protective qualities.\n\nStrung on strong elastic cord for a comfortable, stretchy fit. Suits wrist sizes 16–19cm.",
      category: "JEWELLERY",
      materials: "sunstone, grey agate, citrine, smoky quartz, elastic cord",
      price: 26.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Stone & Spirit",
    },
    {
      slug: "rose-garden-mixed-crystal-bracelet",
      title: "Rose Garden Mixed Crystal Bracelet",
      shortDescription:
        "A one-of-a-kind bracelet blending rose quartz, labradorite, moonstone, lepidolite, and citrine in soft, romantic tones.",
      fullDescription:
        "This beautiful handmade bracelet combines a thoughtfully curated selection of natural crystals in soft pinks, gentle greys, and subtle golds. Each 14–15mm bead is hand-picked for its unique pattern and energy.\n\nThe bracelet features blush rose quartz for love and compassion, iridescent labradorite with its mysterious flash, glowing peach moonstone, calming purple lepidolite, and sunny citrine — creating a palette that feels both romantic and grounding.\n\nEvery bead is unique, making this a truly one-of-a-kind piece that cannot be replicated. Rose quartz is the stone of unconditional love, while moonstone is associated with new beginnings and inner strength.\n\nStrung on strong elastic cord for a comfortable, stretchy fit. Suits wrist sizes 16–19cm.",
      category: "JEWELLERY",
      materials:
        "rose quartz, labradorite, peach moonstone, lepidolite, citrine, clear quartz, elastic cord",
      price: 28.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Stone & Spirit",
    },
    {
      slug: "golden-hour-amethyst-citrine-bracelet",
      title: "Golden Hour Amethyst & Citrine Bracelet",
      shortDescription:
        "A one-of-a-kind bracelet pairing rich amethyst with golden citrine and clear quartz, finished with silver-toned spacer beads.",
      fullDescription:
        "This elegant handmade bracelet pairs the regal purple of natural amethyst with the warm golden glow of citrine, accented by crystal-clear quartz. Decorative silver-toned spacer beads add a refined finishing touch.\n\nEach 14–15mm crystal bead is hand-selected, creating a striking contrast between cool purples and warm golds. The combination is both bold and balanced — perfect for those who love colour with sophistication.\n\nAmethyst is known as the stone of calm and clarity, while citrine is associated with abundance and positivity. Together they create a powerful pairing of peace and purpose.\n\nA truly one-of-a-kind piece — this exact combination of beads cannot be recreated. Strung on strong elastic cord for a comfortable, stretchy fit. Suits wrist sizes 16–19cm.",
      category: "JEWELLERY",
      materials:
        "amethyst, citrine, clear quartz, silver-toned spacer beads, elastic cord",
      price: 28.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Stone & Spirit",
    },

    // ─── Bead-Embroidered Earrings (Batik Heritage collection) ───
    {
      slug: "golden-leaf-batik-bead-embroidered-earrings",
      title: "Golden Leaf Batik Bead-Embroidered Earrings",
      shortDescription:
        "Handcrafted statement earrings featuring batik fabric leaves outlined in gold seed beads on wool felt.",
      fullDescription:
        "These striking statement earrings are entirely handmade, combining traditional batik fabric with meticulous bead embroidery. Each earring features a leaf motif cut from authentic batik fabric in rich amber and gold tones, then hand-stitched onto wool felt and outlined with hundreds of tiny gold seed beads.\n\nThe bead embroidery is done entirely by hand, one bead at a time — a labour of love that gives each earring its beautiful, textured border. The batik fabric brings warmth and cultural heritage, while the beadwork adds sparkle and dimension.\n\nBacked with soft felt for comfort, these earrings are surprisingly lightweight despite their bold appearance. Each pair is one-of-a-kind, as the placement of the batik pattern varies naturally.\n\nPresented in a gift box, ready to give or treasure.",
      category: "JEWELLERY",
      materials:
        "batik fabric, wool felt, gold seed beads, earring hooks, thread",
      price: 24.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Batik Heritage",
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });
    if (existing) {
      console.log(`Skipping (already exists): ${product.title}`);
      continue;
    }

    await prisma.product.create({ data: product });
    console.log(`Created: ${product.title}`);
  }

  // Create tags for the new products
  const tagMap: Record<string, string[]> = {
    "autumn-glow-mixed-crystal-bracelet": [
      "crystal bracelet",
      "sunstone",
      "smoky quartz",
      "citrine",
      "grey agate",
      "handmade bracelet",
      "chunky bracelet",
      "one of a kind",
      "healing crystals",
      "gemstone jewellery",
      "boho bracelet",
      "gift for her",
      "statement bracelet",
    ],
    "rose-garden-mixed-crystal-bracelet": [
      "crystal bracelet",
      "rose quartz",
      "moonstone",
      "labradorite",
      "lepidolite",
      "handmade bracelet",
      "one of a kind",
      "healing crystals",
      "gemstone jewellery",
      "romantic jewellery",
      "boho bracelet",
      "gift for her",
      "pink bracelet",
    ],
    "golden-hour-amethyst-citrine-bracelet": [
      "crystal bracelet",
      "amethyst",
      "citrine",
      "clear quartz",
      "handmade bracelet",
      "one of a kind",
      "healing crystals",
      "gemstone jewellery",
      "purple bracelet",
      "statement bracelet",
      "boho bracelet",
      "gift for her",
      "crystal healing",
    ],
    "golden-leaf-batik-bead-embroidered-earrings": [
      "batik earrings",
      "bead embroidery",
      "handmade earrings",
      "statement earrings",
      "gold earrings",
      "textile earrings",
      "leaf earrings",
      "one of a kind",
      "fabric earrings",
      "seed bead earrings",
      "artisan jewellery",
      "gift for her",
      "bold earrings",
    ],
  };

  for (const [slug, tags] of Object.entries(tagMap)) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) continue;

    for (const tagName of tags) {
      const tagSlug = tagName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (!tagSlug) continue;

      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        create: { name: tagName, slug: tagSlug },
        update: {},
      });

      // Check if product-tag link already exists
      const existing = await prisma.productTag.findFirst({
        where: { productId: product.id, tagId: tag.id },
      });
      if (!existing) {
        await prisma.productTag.create({
          data: { productId: product.id, tagId: tag.id },
        });
      }
    }
    console.log(`Tagged: ${slug} (${tags.length} tags)`);
  }

  // Create SEO data
  const seoData: Record<
    string,
    { metaTitle: string; metaDescription: string; focusKeyword: string }
  > = {
    "autumn-glow-mixed-crystal-bracelet": {
      metaTitle: "Autumn Glow Crystal Bracelet | Sunstone & Smoky Quartz",
      metaDescription:
        "One-of-a-kind handmade crystal bracelet with 14-15mm sunstone, grey agate, citrine & smoky quartz beads. Unique earthy tones. Free UK shipping over £50.",
      focusKeyword: "crystal bracelet",
    },
    "rose-garden-mixed-crystal-bracelet": {
      metaTitle: "Rose Garden Crystal Bracelet | Rose Quartz & Moonstone",
      metaDescription:
        "One-of-a-kind handmade crystal bracelet with 14-15mm rose quartz, labradorite, moonstone & lepidolite beads. Soft romantic tones. Free UK shipping over £50.",
      focusKeyword: "rose quartz bracelet",
    },
    "golden-hour-amethyst-citrine-bracelet": {
      metaTitle: "Golden Hour Crystal Bracelet | Amethyst & Citrine",
      metaDescription:
        "One-of-a-kind handmade crystal bracelet pairing rich amethyst with golden citrine and clear quartz. Silver-toned accents. Free UK shipping over £50.",
      focusKeyword: "amethyst citrine bracelet",
    },
    "golden-leaf-batik-bead-embroidered-earrings": {
      metaTitle: "Batik Bead-Embroidered Leaf Earrings | Handmade",
      metaDescription:
        "Handcrafted statement earrings with batik fabric leaves outlined in gold seed beads. One-of-a-kind wearable art. Presented in gift box. Free UK shipping over £50.",
      focusKeyword: "batik earrings",
    },
  };

  for (const [slug, seo] of Object.entries(seoData)) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) continue;

    await prisma.productSeo.upsert({
      where: { productId: product.id },
      create: { productId: product.id, ...seo },
      update: seo,
    });
    console.log(`SEO created: ${slug}`);
  }

  console.log("\nDone! New products seeded successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
