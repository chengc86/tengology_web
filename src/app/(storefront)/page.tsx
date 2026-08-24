import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Reveal } from "@/components/storefront/Reveal";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import { StorefrontCta } from "@/components/storefront/StorefrontCta";
import { homeCollections } from "@/lib/storefront";

// Revalidate via ISR: the home page shows DB-driven featured products.
export const revalidate = 60;

const materials = [
  {
    name: "Wool felt",
    copy: "Soft, honest, and warm between the fingers.",
    image: "/lookbook/felt-flower-headband-portrait.jpg",
    alt: "A girl in a garden wearing a handmade wool felt flower headband",
  },
  {
    name: "Crystal",
    copy: "Chosen for colour, energy, and feel against the skin.",
    image: "/lookbook/howlite-worn-1.jpg",
    alt: "Howlite crystal bracelets stacked on a wrist",
  },
  {
    name: "Wood & brass",
    copy: "Natural materials, finished by hand in Oxford.",
    image: "/lookbook/felt-sprout-ornaments-pair.jpg",
    alt: "A pair of handmade wool felt sprout ornaments with brass bells",
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
      {/* Hero — split so the photograph stays visible, not washed out */}
      <section className="border-b">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-12 lg:py-28 xl:px-20">
            <div className="mx-auto w-full max-w-xl lg:mx-0">
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
                <StorefrontCta href="/shop">Shop the collection</StorefrontCta>
                <StorefrontCta href="/designer/bracelet" variant="outline">
                  Design your own
                </StorefrontCta>
              </div>
            </div>
          </div>
          <div className="relative min-h-[52vw] bg-muted sm:min-h-[420px] lg:min-h-[36rem] xl:min-h-[40rem]">
            <Image
              src="/lookbook/felt-flower-headbands-garden.jpg"
              alt="Two girls lying in the grass wearing handmade wool felt flower headbands"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[center_35%] motion-safe:animate-[hero-zoom_14s_var(--ease-soft)_forwards]"
            />
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading index="01" eyebrow="Shop by craft" title="Collections" />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {homeCollections.map((col, i) => (
            <Reveal key={col.name} delay={i * 80}>
              <Link
                href={col.href}
                className="group relative flex aspect-[3/4] items-end overflow-hidden bg-muted"
              >
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                  style={{ transitionTimingFunction: "var(--ease-soft)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <span className="eyebrow absolute right-5 top-5 z-10">
                  0{i + 1}
                </span>
                <div className="relative z-10 p-5 lg:p-6">
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

      {/* Materials */}
      <section className="border-y bg-muted/35">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            index={featuredProducts.length > 0 ? "03" : "02"}
            eyebrow="In the hand"
            title="Materials we work with"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-3 lg:gap-6">
            {materials.map((material, i) => (
              <Reveal key={material.name} delay={i * 80}>
                <figure className="group">
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <Image
                      src={material.image}
                      alt={material.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                      style={{ transitionTimingFunction: "var(--ease-soft)" }}
                    />
                  </div>
                  <figcaption className="mt-4 border-t pt-3">
                    <h3 className="font-heading text-2xl leading-tight">
                      {material.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {material.copy}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Story teaser */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading
          index={featuredProducts.length > 0 ? "04" : "03"}
          eyebrow="The maker"
          title="Every piece tells a story"
        />
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="left">
            <div className="relative aspect-[4/5] overflow-hidden bg-muted sm:aspect-[4/3]">
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
              <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                Wool felt is the warmth found in England. Crystals are the
                earth&rsquo;s quiet energy. Every piece is designed to be felt
                as much as it is seen.
              </p>
              <StorefrontCta href="/pages/about" variant="outline" className="mt-8">
                Our story
              </StorefrontCta>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
