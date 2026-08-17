import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";

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
      <section className="relative bg-muted overflow-hidden">
        <Image
          src="/lookbook/felt-flower-headbands-garden.jpg"
          alt="Two girls lying in the grass wearing handmade wool felt flower headbands"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Designed &amp; Made in Oxford
            </p>
            <h1 className="font-heading text-5xl lg:text-7xl font-light leading-[1.1] mb-6">
              Made with
              <br />
              <span className="italic">intention</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
              Every piece is designed and handmade in Oxford using wool felt,
              wood, and natural materials. Made to be treasured.
            </p>
            <Link
              href="/shop"
              className="inline-block border border-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <h2 className="font-heading text-3xl lg:text-4xl font-light text-center mb-12">
          Collections
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {collections.map((col) => (
            <Link
              key={col.name}
              href={col.href}
              className="group relative aspect-[3/4] bg-muted rounded-sm overflow-hidden flex items-end p-6"
            >
              {col.image && (
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="relative z-10">
                <h3 className="font-heading text-xl lg:text-2xl font-light mb-1">
                  {col.name}
                </h3>
                <p className="text-xs text-muted-foreground tracking-wider">
                  {col.description}
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-heading text-3xl lg:text-4xl font-light">
              Featured
            </h2>
            <Link
              href="/shop"
              className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.map((product: { id: string; slug: string; title: string; price: number; compareAtPrice?: number | null; images: { url: string }[] }) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                title={product.title}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                image={product.images[0]?.url}
              />
            ))}
          </div>
        </section>
      )}

      {/* Story teaser */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
              <Image
                src="/lookbook/felt-sprout-ornaments-wreath.jpg"
                alt="Hand-stitched wool felt sprout ornaments with brass bells, arranged on a willow wreath"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center lg:text-left">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
                The Maker
              </p>
              <h2 className="font-heading text-3xl lg:text-4xl font-light mb-6 max-w-xl">
                Every piece tells a story
              </h2>
              <p className="text-muted-foreground max-w-lg leading-relaxed mb-8">
                From carefully chosen materials to the finishing touches, each
                Tengology creation is made by hand with attention to every detail.
              </p>
              <Link
                href="/pages/about"
                className="inline-block border border-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition-colors"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
