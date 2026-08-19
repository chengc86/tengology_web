import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Reveal } from "@/components/storefront/Reveal";
import { SectionHeading } from "@/components/storefront/SectionHeading";

// Revalidate via ISR: the home page shows DB-driven featured products.
export const revalidate = 60;

const collections = [
  {
    name: "Hair Accessories",
    href: "/shop?category=HAIR_ACCESSORIES",
    description: "Handcrafted clips, barrettes & headbands",
    image: "/lookbook/felt-flower-headband-portrait.jpg",
  },
  {
    name: "Jewellery",
    href: "/shop?category=JEWELLERY",
    description: "Unique earrings, rings & necklaces",
    image: "/Gemini_Generated_Image_ukw8ilukw8ilukw8.png",
  },
  {
    name: "Christmas",
    href: "/shop?category=CHRISTMAS_ORNAMENTS",
    description: "Festive ornaments & decorations",
    image: "/lookbook/felt-sprout-ornaments-pair.jpg",
  },
  {
    name: "Brooches",
    href: "/shop?category=BROOCHES",
    description: "Statement brooches & pins",
    image: "/Gemini_Generated_Image_9wvh4a9wvh4a9wvh.png",
  },
];

export default async function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let featuredProducts: any[] = [];

  try {
    featuredProducts = await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not connected yet — show empty state
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-muted">
        <Image
          src="/lookbook/felt-flower-headbands-garden.jpg"
          alt="Two girls lying in the grass wearing handmade wool felt flower headbands"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 motion-safe:animate-[hero-zoom_14s_var(--ease-soft)_forwards]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-44">
          <div className="max-w-3xl">
            <p
              className="eyebrow mb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:duration-700"
              style={{ animationDelay: "0ms" }}
            >
              Designed &amp; Made in Oxford
            </p>
            <h1
              className="font-heading text-6xl leading-[0.92] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:duration-700 sm:text-7xl lg:text-8xl"
              style={{ animationDelay: "90ms" }}
            >
              Made with
              <br />
              <em>intention</em>
            </h1>
            <p
              className="mt-8 max-w-md leading-relaxed text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:duration-700"
              style={{ animationDelay: "180ms" }}
            >
              Every piece is designed and handmade in Oxford using wool felt,
              wood, and natural materials. Made to be treasured.
            </p>
            <div
              className="mt-10 flex flex-wrap gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:duration-700"
              style={{ animationDelay: "270ms" }}
            >
              <Link
                href="/shop"
                className="eyebrow inline-flex items-center border border-foreground bg-foreground px-8 py-4 !text-background transition-colors hover:bg-transparent hover:!text-foreground"
              >
                Shop the collection
              </Link>
              <Link
                href="/designer/bracelet"
                className="eyebrow inline-flex items-center border px-8 py-4 !text-foreground transition-colors hover:border-foreground"
              >
                Design your own
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading index="01" eyebrow="Shop by craft" title="Collections" />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {collections.map((col, i) => (
            <Reveal key={col.name} delay={i * 80}>
              <Link
                href={col.href}
                className="group relative flex aspect-[3/4] items-end overflow-hidden bg-muted p-6"
              >
                {col.image && (
                  <Image
                    src={col.image}
                    alt={col.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                    style={{ transitionTimingFunction: "var(--ease-soft)" }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <span className="eyebrow absolute right-5 top-5 z-10">
                  0{i + 1}
                </span>
                <div className="relative z-10">
                  <h3 className="font-heading text-xl leading-tight lg:text-2xl">
                    {col.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {col.description}
                  </p>
                  <span className="eyebrow mt-3 inline-flex items-center gap-2 text-foreground">
                    View
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <SectionHeading
            index="02"
            eyebrow="From the studio"
            title="Featured pieces"
            action={{ href: "/shop", label: "View all" }}
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {featuredProducts.map(
              (
                product: {
                  id: string;
                  slug: string;
                  title: string;
                  price: number;
                  compareAtPrice?: number | null;
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
                  />
                </Reveal>
              )
            )}
          </div>
        </section>
      )}

      {/* Story teaser */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading
          index="03"
          eyebrow="The maker"
          title="Every piece tells a story"
        />
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="left">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                src="/lookbook/felt-sprout-ornaments-wreath.jpg"
                alt="Hand-stitched wool felt sprout ornaments with brass bells, arranged on a willow wreath"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                From carefully chosen materials to the finishing touches, each
                Tengology creation is made by hand with attention to every
                detail.
              </p>
              <Link
                href="/pages/about"
                className="eyebrow mt-8 inline-flex border border-foreground px-8 py-4 !text-foreground transition-colors hover:bg-foreground hover:!text-background"
              >
                Our story
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
