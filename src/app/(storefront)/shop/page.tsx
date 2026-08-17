import Image from "next/image";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse our collection of handcrafted hair accessories, jewellery, and ornaments.",
};

const categoryLabels: Record<string, string> = {
  HAIR_ACCESSORIES: "Hair Accessories",
  JEWELLERY: "Jewellery",
  CHRISTMAS_ORNAMENTS: "Christmas Ornaments",
  BROOCHES: "Brooches",
  OTHER: "Other",
};

const categoryIntros: Record<string, { heading: string; body: string }> = {
  JEWELLERY: {
    heading: "Grounded Luxury",
    body: "Tengology is a boutique jewellery brand that bridges the gap between the raw power of the earth and the refined elegance of modern life. We create ritual jewellery for the intentional wearer: pieces that don\u2019t just look beautiful, but provide a physical point of connection to nature.",
  },
};

const subcategoryLabels: Record<string, Record<string, string>> = {
  JEWELLERY: {
    NECKLACES: "Necklaces",
    BRACELETS: "Bracelets",
    EARRINGS: "Earrings",
    RINGS: "Rings",
  },
};

const intentionOptions: { value: string; label: string }[] = [
  { value: "Connection", label: "Connection" },
  { value: "Focus", label: "Focus" },
  { value: "Protection", label: "Protection" },
  { value: "Clarity", label: "Clarity" },
  { value: "Stillness", label: "Stillness" },
  { value: "Energy", label: "Energy" },
  { value: "Shielding", label: "Shielding" },
  { value: "Uniqueness", label: "Uniqueness" },
  { value: "Softness", label: "Softness" },
  { value: "Optimism", label: "Optimism" },
  { value: "Alignment", label: "Alignment" },
];

const collectionShowcases: Record<
  string,
  { name: string; slug: string; tagline: string; detail: string; tags: string[] }[]
> = {
  JEWELLERY: [
    {
      name: "Moon and Sun",
      slug: "Moon and Sun",
      tagline: "Layer your intention",
      detail:
        "Delicate 4mm crystal beads paired with Argentium Silver and Gold-filled accents. Designed for stacking — wear one for a whisper, or three for a statement. Also available as a Micro Crystal Necklace.",
      tags: ["4mm crystals", "Argentium Silver", "Gold-filled", "Stackable", "Bracelets", "Necklaces"],
    },
    {
      name: "The Horizon",
      slug: "The Horizon",
      tagline: "The foundation of every look",
      detail:
        "A refined Gold-filled chain with a 10mm polished disc pendant — understated enough to wear daily, elegant enough to anchor any stack.",
      tags: ["Gold-filled chain", "10mm disc pendant", "Necklaces"],
    },
    {
      name: "Orbit",
      slug: "Orbit",
      tagline: "Your foundation, your way",
      detail:
        "7–8mm crystal bases in Black Obsidian, Clear Quartz, Lychee Jelly Agate, or Hematoid Clear Quartz, accented with Gold-filled and Argentium beads. Add a charm to make it yours.",
      tags: ["7–8mm crystals", "Customisable charms", "Argentium Silver", "Gold-filled", "Bracelets"],
    },
    {
      name: "Meridian",
      slug: "Meridian",
      tagline: "Find your centre",
      detail:
        "10mm crystal bracelets anchored by a striking 12–13mm focal crystal, flanked by Sterling Silver and Gold-filled spacer discs. A piece that draws the eye inward.",
      tags: ["10mm crystals", "Focal crystal", "Sterling Silver", "Gold-filled", "Bracelets"],
    },
    {
      name: "Satellite",
      slug: "Satellite",
      tagline: "The finishing touch",
      detail:
        "4mm bead studs with a 7–8mm crystal drop attached by hand-wrapped wire. Available in Argentium Silver and Gold-filled to match your stack.",
      tags: ["4mm stud", "7–8mm drop", "Wire wrap", "Argentium Silver", "Gold-filled", "Earrings"],
    },
    {
      name: "Titan",
      slug: "Titan",
      tagline: "Pure crystal, nothing else",
      detail:
        "Statement pieces featuring rare 13–16mm crystals with no metal parts. Each bead is chosen for its natural beauty — the crystal is the entire design.",
      tags: ["13–16mm crystals", "No metal", "Rare stones", "Bracelets"],
    },
    {
      name: "Planets",
      slug: "Planets",
      tagline: "Worlds on your wrist",
      detail:
        "Spherical crystal charms in two sizes — 12mm Planet and 7–8mm Mini Planet. Clip onto your Orbit base to build your own constellation.",
      tags: ["12mm charms", "7–8mm mini charms", "For Orbit base"],
    },
    {
      name: "Asteroid",
      slug: "Asteroid",
      tagline: "Beautifully irregular",
      detail:
        "One-of-a-kind charms crafted from raw, irregular-shaped crystals. No two are alike — nature\u2019s own design, ready to clip onto your Orbit.",
      tags: ["Irregular crystals", "Raw shapes", "For Orbit base"],
    },
  ],
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sub?: string; collection?: string; sort?: string; q?: string; intention?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const subcategory = params.sub;
  const collection = params.collection;
  const intention = params.intention;
  const sortBy = params.sort || "newest";
  const query = params.q;

  const orderBy =
    sortBy === "price-asc"
      ? { price: "asc" as const }
      : sortBy === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];

  try {
    products = await prisma.product.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
        ...(subcategory ? { subcategory } : {}),
        ...(collection ? { collection } : {}),
        ...(intention ? { intention } : {}),
        ...(query
          ? {
              // Postgres `LIKE` is case-sensitive, so shopper searches need
              // an explicit insensitive mode to behave the way people expect.
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { shortDescription: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy,
    });
  } catch {
    // DB not connected yet
  }

  const subcatLabel = category && subcategory && subcategoryLabels[category]?.[subcategory];
  const title = intention
    ? `Intention: ${intention}`
    : collection
      ? collection
      : subcatLabel
        ? subcatLabel
        : category
          ? categoryLabels[category] || "Shop"
          : "All Products";

  return (
    <div>
      {/* Shop Hero */}
      <div className="relative h-48 lg:h-64 overflow-hidden bg-muted">
        <Image
          src="/lookbook/felt-sprout-ornaments-wreath-wide.jpg"
          alt="A willow wreath laid with handmade wool felt sprout ornaments and brass bells"
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="relative flex items-center justify-center h-full">
          <h1 className="font-heading text-4xl lg:text-5xl font-light">
            Shop
          </h1>
        </div>
      </div>

      {/* Category Introduction */}
      {category && categoryIntros[category] && !collection && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center">
          <h2 className="font-heading text-2xl lg:text-3xl font-light mb-4">
            {categoryIntros[category].heading}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {categoryIntros[category].body}
          </p>
        </div>
      )}

      {/* Collection Showcase */}
      {category && collectionShowcases[category] && !collection && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-8">
          <h3 className="text-xs tracking-[0.2em] uppercase text-muted-foreground text-center mb-8">
            Our Collections
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collectionShowcases[category].map((col) => (
              <a
                key={col.slug}
                href={`/shop?category=${category}&collection=${encodeURIComponent(col.slug)}`}
                className="group border rounded-sm p-6 lg:p-8 transition-colors hover:bg-muted/50"
              >
                <h4 className="font-heading text-xl lg:text-2xl font-light mb-1">
                  {col.name}
                </h4>
                <p className="text-sm italic text-muted-foreground mb-4">
                  {col.tagline}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {col.detail}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {col.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] tracking-wider uppercase px-2 py-0.5 border rounded-sm text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-block mt-5 text-xs tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                  View Collection &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Collection back link */}
      {category && collection && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
          <a
            href={`/shop?category=${category}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; All {categoryLabels[category]}
          </a>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h2 className="font-heading text-3xl lg:text-4xl font-light">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <a
            href="/shop"
            className={`text-xs tracking-wider uppercase px-3 py-1.5 border rounded-sm transition-colors ${
              !category
                ? "bg-foreground text-background"
                : "hover:bg-muted"
            }`}
          >
            All
          </a>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <a
              key={key}
              href={`/shop?category=${key}`}
              className={`text-xs tracking-wider uppercase px-3 py-1.5 border rounded-sm transition-colors ${
                category === key
                  ? "bg-foreground text-background"
                  : "hover:bg-muted"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Subcategory filter pills */}
      {category && subcategoryLabels[category] && (
        <div className="flex flex-wrap gap-2 mb-8">
          <a
            href={`/shop?category=${category}`}
            className={`text-xs tracking-wider uppercase px-3 py-1.5 border rounded-sm transition-colors ${
              !subcategory
                ? "bg-foreground text-background"
                : "hover:bg-muted"
            }`}
          >
            All {categoryLabels[category]}
          </a>
          {Object.entries(subcategoryLabels[category]).map(([key, label]) => (
            <a
              key={key}
              href={`/shop?category=${category}&sub=${key}`}
              className={`text-xs tracking-wider uppercase px-3 py-1.5 border rounded-sm transition-colors ${
                subcategory === key
                  ? "bg-foreground text-background"
                  : "hover:bg-muted"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      {/* Intention filter */}
      {category === "JEWELLERY" && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground mr-1">
            Intention
          </span>
          <a
            href={`/shop?category=JEWELLERY${subcategory ? `&sub=${subcategory}` : ""}${collection ? `&collection=${encodeURIComponent(collection)}` : ""}`}
            className={`text-xs tracking-wider uppercase px-3 py-1.5 border rounded-sm transition-colors ${
              !intention ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
          >
            All
          </a>
          {intentionOptions.map((opt) => (
            <a
              key={opt.value}
              href={`/shop?category=JEWELLERY${subcategory ? `&sub=${subcategory}` : ""}${collection ? `&collection=${encodeURIComponent(collection)}` : ""}&intention=${encodeURIComponent(opt.value)}`}
              className={`text-xs tracking-wider uppercase px-3 py-1.5 border rounded-sm transition-colors ${
                intention === opt.value ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      )}

      {/* Products grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product: { id: string; slug: string; title: string; price: number; compareAtPrice?: number | null; category: string; images: { url: string }[] }) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              title={product.title}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              image={product.images[0]?.url}
              category={product.category}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="font-heading text-2xl font-light mb-2">
            No products yet
          </p>
          <p className="text-sm text-muted-foreground">
            Check back soon — new pieces are always in the works.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
