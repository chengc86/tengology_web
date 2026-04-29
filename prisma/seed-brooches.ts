import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = [
    {
      slug: "golden-amber-batik-flower-brooch",
      title: "Golden Amber Batik Flower Brooch",
      shortDescription:
        "A hand-beaded flower brooch featuring golden amber batik fabric petals outlined in gold seed beads on grey wool felt.",
      fullDescription:
        "This exquisite handmade brooch features a flower motif cut from authentic batik fabric in warm golden amber tones, carefully hand-stitched onto grey wool felt and outlined with hundreds of gold seed beads, applied one at a time.\n\nThe intricate beadwork creates a shimmering border that catches the light beautifully, while the batik fabric brings depth and texture with its traditional wax-resist patterning. The grey felt backing provides a sophisticated contrast that lets the warm tones of the flower truly shine.\n\nPerfect as a statement piece on a coat lapel, scarf, hat, or bag. Lightweight and comfortable to wear all day.\n\nThis is a one-of-a-kind piece — the natural variation in batik fabric means this exact design cannot be replicated.",
      category: "BROOCHES",
      materials:
        "batik fabric, wool felt, gold seed beads, brooch pin back, thread",
      price: 18.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Batik Heritage",
    },
    {
      slug: "plum-blossom-batik-flower-brooch",
      title: "Plum Blossom Batik Flower Brooch",
      shortDescription:
        "A hand-beaded flower brooch with deep plum batik fabric petals outlined in gold seed beads on lilac wool felt.",
      fullDescription:
        "This beautiful handmade brooch showcases a flower design cut from authentic batik fabric in rich, deep plum and burgundy tones, mounted on soft lilac wool felt and meticulously outlined with gold seed beads.\n\nEvery bead is hand-stitched individually, creating a gorgeous textured border that frames the dark, dramatic batik petals. The contrast between the deep plum fabric and the lilac felt gives this piece a striking, contemporary feel rooted in traditional craft.\n\nThe brooch makes a bold yet elegant accent on jackets, wraps, or bags. Despite its detailed appearance, it's lightweight and easy to wear.\n\nA one-of-a-kind piece — the unique character of the batik fabric ensures no two are ever the same.",
      category: "BROOCHES",
      materials:
        "batik fabric, wool felt, gold seed beads, brooch pin back, thread",
      price: 18.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
      collection: "Batik Heritage",
    },
    {
      slug: "sunset-lotus-batik-statement-brooch",
      title: "Sunset Lotus Batik Statement Brooch",
      shortDescription:
        "A large hand-beaded statement brooch featuring a vibrant orange and red batik lotus flower on green wool felt.",
      fullDescription:
        "This show-stopping statement brooch features a large, bold lotus flower cut from authentic batik fabric in vivid sunset oranges and reds, mounted on rich green wool felt and edged with meticulous gold seed bead embroidery.\n\nAt approximately 10cm across, this is a true statement piece — designed to be noticed and admired. The vibrant batik fabric captures the warmth and energy of a tropical sunset, while the green felt ground evokes lush foliage. Hundreds of gold seed beads have been hand-stitched around each petal, adding sparkle and defining the flower's dramatic silhouette.\n\nWear it on a coat, blazer, or use it as a decorative accent on a bag or hat. The size makes it a focal point of any outfit.\n\nA one-of-a-kind wearable art piece that celebrates traditional batik craft in a contemporary way.",
      category: "BROOCHES",
      materials:
        "batik fabric, wool felt, gold seed beads, brooch pin back, thread",
      price: 28.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: true,
      collection: "Batik Heritage",
    },
    {
      slug: "garden-bloom-batik-flower-brooch",
      title: "Garden Bloom Batik Flower Brooch",
      shortDescription:
        "A hand-beaded flower brooch in green, pink, and golden batik tones on magenta wool felt.",
      fullDescription:
        "This charming handmade brooch features a flower motif cut from authentic batik fabric in a fresh palette of greens, pinks, and golden yellows, set against vibrant magenta wool felt and finished with delicate gold seed bead embroidery.\n\nThe colourful batik petals are outlined one bead at a time, creating a detailed, textured border that adds depth and sparkle. The magenta felt backing makes the garden-fresh colours pop beautifully.\n\nA versatile size that works as an accent on lapels, scarves, hats, or bags. Lightweight and comfortable for all-day wear.\n\nEach piece is one-of-a-kind — crafted from a unique section of batik fabric that can never be exactly repeated.",
      category: "BROOCHES",
      materials:
        "batik fabric, wool felt, gold seed beads, brooch pin back, thread",
      price: 16.0,
      compareAtPrice: null,
      stockCount: 1,
      isPublished: true,
      isFeatured: false,
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

  // Create tags
  const tagMap: Record<string, string[]> = {
    "golden-amber-batik-flower-brooch": [
      "batik brooch",
      "flower brooch",
      "bead embroidery",
      "handmade brooch",
      "statement brooch",
      "textile brooch",
      "gold beaded",
      "one of a kind",
      "wearable art",
      "fabric brooch",
      "artisan jewellery",
      "gift for her",
      "coat brooch",
    ],
    "plum-blossom-batik-flower-brooch": [
      "batik brooch",
      "flower brooch",
      "bead embroidery",
      "handmade brooch",
      "purple brooch",
      "textile brooch",
      "gold beaded",
      "one of a kind",
      "wearable art",
      "plum brooch",
      "artisan jewellery",
      "gift for her",
      "coat brooch",
    ],
    "sunset-lotus-batik-statement-brooch": [
      "statement brooch",
      "large brooch",
      "batik brooch",
      "lotus brooch",
      "bead embroidery",
      "handmade brooch",
      "orange brooch",
      "one of a kind",
      "wearable art",
      "textile art",
      "artisan jewellery",
      "bold jewellery",
      "gift for her",
    ],
    "garden-bloom-batik-flower-brooch": [
      "batik brooch",
      "flower brooch",
      "bead embroidery",
      "handmade brooch",
      "colourful brooch",
      "textile brooch",
      "gold beaded",
      "one of a kind",
      "wearable art",
      "fabric brooch",
      "artisan jewellery",
      "gift for her",
      "floral brooch",
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
    "golden-amber-batik-flower-brooch": {
      metaTitle: "Golden Amber Batik Flower Brooch | Handmade Bead Embroidery",
      metaDescription:
        "One-of-a-kind handmade batik flower brooch with gold seed bead embroidery on grey wool felt. Wearable textile art. Free UK shipping over £50.",
      focusKeyword: "batik flower brooch",
    },
    "plum-blossom-batik-flower-brooch": {
      metaTitle: "Plum Blossom Batik Flower Brooch | Handmade Bead Embroidery",
      metaDescription:
        "One-of-a-kind handmade batik flower brooch in deep plum tones with gold bead embroidery on lilac felt. Wearable art. Free UK shipping over £50.",
      focusKeyword: "handmade flower brooch",
    },
    "sunset-lotus-batik-statement-brooch": {
      metaTitle: "Sunset Lotus Statement Brooch | Large Batik Bead Embroidery",
      metaDescription:
        "Bold one-of-a-kind statement brooch with vibrant orange batik lotus and gold seed bead embroidery. Large 10cm wearable art piece. Free UK shipping over £50.",
      focusKeyword: "statement brooch",
    },
    "garden-bloom-batik-flower-brooch": {
      metaTitle: "Garden Bloom Batik Flower Brooch | Handmade Bead Embroidery",
      metaDescription:
        "One-of-a-kind handmade batik flower brooch in fresh greens and pinks with gold bead embroidery on magenta felt. Free UK shipping over £50.",
      focusKeyword: "floral brooch handmade",
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

  console.log("\nDone! Brooch products seeded successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
