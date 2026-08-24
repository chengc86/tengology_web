import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/storefront/Reveal";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import { PageHero } from "@/components/storefront/PageHero";
import { StorefrontCta } from "@/components/storefront/StorefrontCta";
import { categoryHeroes, categoryLabels, defaultShopHero, shopHref } from "@/lib/storefront";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse our collection of handcrafted hair accessories, jewellery, and ornaments.",
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
  {
    name: string;
    slug: string;
    tagline: string;
    detail: string;
    tags: string[];
    image?: string;
  }[]
> = {
  JEWELLERY: [
    {
      name: "Moon and Sun",
      slug: "Moon and Sun",
      tagline: "Layer your intention",
      detail:
        "Delicate 4mm crystal beads paired with Argentium Silver and Gold-filled accents. Designed for stacking — wear one for a whisper, or three for a statement. Also available as a Micro Crystal Necklace.",
      tags: ["4mm crystals", "Argentium Silver", "Gold-filled", "Stackable"],
      image: "/lookbook/clear-quartz-worn-1.jpg",
    },
    {
      name: "The Horizon",
      slug: "The Horizon",
      tagline: "The foundation of every look",
      detail:
        "A refined Gold-filled chain with a 10mm polished disc pendant — understated enough to wear daily, elegant enough to anchor any stack.",
      tags: ["Gold-filled chain", "10mm disc pendant"],
      image: "/lookbook/gold-alphabet-reference.jpg",
    },
    {
      name: "Orbit",
      slug: "Orbit",
      tagline: "Your foundation, your way",
      detail:
        "7–8mm crystal bases in Black Obsidian, Clear Quartz, Lychee Jelly Agate, or Hematoid Clear Quartz, accented with Gold-filled and Argentium beads. Add a charm to make it yours.",
      tags: ["7–8mm crystals", "Customisable charms"],
      image: "/lookbook/howlite-worn-2.jpg",
    },
    {
      name: "Meridian",
      slug: "Meridian",
      tagline: "Find your centre",
      detail:
        "10mm crystal bracelets anchored by a striking 12–13mm focal crystal, flanked by Sterling Silver and Gold-filled spacer discs. A piece that draws the eye inward.",
      tags: ["10mm crystals", "Focal crystal"],
      image: "/lookbook/lychee-jelly-10mm-worn.jpg",
    },
    {
      name: "Satellite",
      slug: "Satellite",
      tagline: "The finishing touch",
      detail:
        "4mm bead studs with a 7–8mm crystal drop attached by hand-wrapped wire. Available in Argentium Silver and Gold-filled to match your stack.",
      tags: ["4mm stud", "7–8mm drop", "Wire wrap"],
      image: "/lookbook/rose-quartz-rose-detail-1.jpg",
    },
    {
      name: "Titan",
      slug: "Titan",
      tagline: "Pure crystal, nothing else",
      detail:
        "Statement pieces featuring rare 13–16mm crystals with no metal parts. Each bead is chosen for its natural beauty — the crystal is the entire design.",
      tags: ["13–16mm crystals", "No metal"],
      image: "/lookbook/aquamarine-12mm-detail.jpg",
    },
    {
      name: "Planets",
      slug: "Planets",
      tagline: "Worlds on your wrist",
      detail:
        "Spherical crystal charms in two sizes — 12mm Planet and 7–8mm Mini Planet. Clip onto your Orbit base to build your own constellation.",
      tags: ["12mm charms", "For Orbit base"],
      image: "/lookbook/coral-jade-moon-detail-1.jpg",
    },
    {
      name: "Asteroid",
      slug: "Asteroid",
      tagline: "Beautifully irregular",
      detail:
        "One-of-a-kind charms crafted from raw, irregular-shaped crystals. No two are alike — nature\u2019s own design, ready to clip onto your Orbit.",
      tags: ["Irregular crystals", "Raw shapes"],
      image: "/lookbook/citrine-nugget-detail-1.jpg",
    },
  ],
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price · low" },
  { value: "price-desc", label: "Price · high" },
];

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`eyebrow border px-4 py-2 transition-colors ${
        active
          ? "border-foreground bg-foreground !text-background"
          : "hover:border-foreground hover:!text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sub?: string;
    collection?: string;
    sort?: string;
    q?: string;
    intention?: string;
  }>;
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

  const hero = (category && categoryHeroes[category]) || defaultShopHero;
  const sharedParams = {
    category,
    sub: subcategory,
    collection,
    intention,
    q: query,
  };

  return (
    <div>
      <PageHero
        image={hero.image}
        alt={hero.alt}
        eyebrow={hero.eyebrow}
        title={category ? title : "Shop"}
      />

      {category && categoryIntros[category] && !collection && (
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <h2 className="mb-4 font-heading text-2xl leading-tight lg:text-3xl">
            {categoryIntros[category].heading}
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {categoryIntros[category].body}
          </p>
        </div>
      )}

      {category && collectionShowcases[category] && !collection && (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <p className="eyebrow mb-8">Our collections</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {collectionShowcases[category].map((col) => (
              <Link
                key={col.slug}
                href={shopHref({ category, collection: col.slug })}
                className="group border-t pt-5 transition-colors"
              >
                {col.image && (
                  <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-muted">
                    <Image
                      src={col.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                      style={{ transitionTimingFunction: "var(--ease-soft)" }}
                    />
                  </div>
                )}
                <h3 className="font-heading text-xl leading-tight lg:text-2xl">
                  {col.name}
                </h3>
                <p className="mt-1 text-sm italic text-muted-foreground">
                  {col.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {col.detail}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {col.tags.map((tag) => (
                    <span key={tag} className="eyebrow bg-muted px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="eyebrow mt-5 inline-flex items-center gap-2 text-foreground">
                  View
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {category && collection && (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <Link
            href={shopHref({ category })}
            className="link-underline eyebrow text-foreground"
          >
            &larr; All {categoryLabels[category]}
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-6 border-t pt-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-3xl leading-[0.95] lg:text-4xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          <form action="/shop" method="get" className="flex w-full max-w-sm items-center border-b">
            {category && <input type="hidden" name="category" value={category} />}
            {subcategory && <input type="hidden" name="sub" value={subcategory} />}
            {collection && <input type="hidden" name="collection" value={collection} />}
            {intention && <input type="hidden" name="intention" value={intention} />}
            {sortBy !== "newest" && <input type="hidden" name="sort" value={sortBy} />}
            <input
              name="q"
              defaultValue={query}
              placeholder="Search the shop"
              aria-label="Search the shop"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <FilterPill href="/shop" active={!category}>
            All
          </FilterPill>
          {Object.entries(categoryLabels)
            .filter(([key]) => key !== "OTHER")
            .map(([key, label]) => (
              <FilterPill
                key={key}
                href={shopHref({ category: key })}
                active={category === key}
              >
                {label}
              </FilterPill>
            ))}
        </div>

        {category && subcategoryLabels[category] && (
          <div className="mb-8 flex flex-wrap gap-2">
            <FilterPill href={shopHref({ category })} active={!subcategory}>
              All {categoryLabels[category]}
            </FilterPill>
            {Object.entries(subcategoryLabels[category]).map(([key, label]) => (
              <FilterPill
                key={key}
                href={shopHref({ category, sub: key, collection, intention, q: query })}
                active={subcategory === key}
              >
                {label}
              </FilterPill>
            ))}
          </div>
        )}

        {category === "JEWELLERY" && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">Intention</span>
            <FilterPill
              href={shopHref({ category: "JEWELLERY", sub: subcategory, collection, q: query })}
              active={!intention}
            >
              All
            </FilterPill>
            {intentionOptions.map((opt) => (
              <FilterPill
                key={opt.value}
                href={shopHref({
                  category: "JEWELLERY",
                  sub: subcategory,
                  collection,
                  intention: opt.value,
                  q: query,
                })}
                active={intention === opt.value}
              >
                {opt.label}
              </FilterPill>
            ))}
          </div>
        )}

        <div className="mb-10 flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
            <FilterPill
              key={opt.value}
              href={shopHref({ ...sharedParams, sort: opt.value === "newest" ? undefined : opt.value })}
              active={sortBy === opt.value}
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products.map(
              (
                product: {
                  id: string;
                  slug: string;
                  title: string;
                  price: number;
                  compareAtPrice?: number | null;
                  category: string;
                  images: { url: string }[];
                },
                i: number
              ) => (
                <Reveal key={product.id} delay={(i % 4) * 70}>
                  <ProductCard
                    slug={product.slug}
                    title={product.title}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={product.images[0]?.url}
                    category={product.category}
                  />
                </Reveal>
              )
            )}
          </div>
        ) : (
          <div className="border-t py-24 text-center">
            <p className="eyebrow mb-4">Nothing here yet</p>
            <p className="mb-8 font-heading text-3xl leading-[0.95]">
              No pieces match this <em>filter</em>
            </p>
            <StorefrontCta href="/shop" variant="outline">
              Browse all
            </StorefrontCta>
          </div>
        )}
      </div>
    </div>
  );
}
