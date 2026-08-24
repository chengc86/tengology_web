import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { auth } from "@/lib/auth";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductCard } from "@/components/storefront/ProductCard";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import { categoryLabels } from "@/lib/storefront";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { seo: true },
    });
    if (!product) return { title: "Not Found" };
    return {
      title: product.seo?.metaTitle || product.title,
      description:
        product.seo?.metaDescription ||
        product.shortDescription ||
        product.fullDescription?.slice(0, 160),
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await prisma.product.findUnique({
      where: { slug, isPublished: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        tags: { include: { tag: true } },
      },
    });
  } catch {
    notFound();
  }

  if (!product) notFound();

  const price = product.price;
  const categoryLabel =
    categoryLabels[product.category] || product.category.replace(/_/g, " ");

  const session = await auth();
  const isSaved = session?.user?.id
    ? Boolean(
        await prisma.wishlistItem.findUnique({
          where: {
            userId_productId: { userId: session.user.id, productId: product.id },
          },
          select: { id: true },
        })
      )
    : false;

  let related: {
    id: string;
    slug: string;
    title: string;
    price: number;
    compareAtPrice: number | null;
    images: { url: string }[];
  }[] = [];

  try {
    related = await prisma.product.findMany({
      where: {
        isPublished: true,
        category: product.category,
        id: { not: product.id },
      },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    related = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/shop" className="link-underline hover:text-foreground">
          Shop
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/shop?category=${product.category}`}
          className="link-underline hover:text-foreground"
        >
          {categoryLabel}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={product.images}
          title={product.title}
        />

        <div className="lg:sticky lg:top-[calc(var(--header-h,5rem)+1.5rem)] lg:self-start lg:py-4">
          <div className="space-y-6">
            <div className="border-t pt-6">
              <p className="eyebrow mb-4">
                {product.collection || categoryLabel}
              </p>
              <h1 className="font-heading text-4xl leading-[0.95] lg:text-5xl">
                {product.title}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-xl tabular-nums">{formatPrice(price)}</span>
              {product.compareAtPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="leading-relaxed text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            <div className="text-sm">
              {product.stockCount > 0 ? (
                product.stockCount <= product.lowStockThreshold ? (
                  <span className="eyebrow bg-moss-light px-2 py-1 !text-moss-dark">
                    Only {product.stockCount} left
                  </span>
                ) : (
                  <span className="eyebrow !text-moss">In stock</span>
                )
              ) : (
                <span className="eyebrow !text-destructive">Sold out</span>
              )}
            </div>

            <div className="space-y-2">
              <AddToCartButton
                productId={product.id}
                title={product.title}
                price={price}
                image={product.images[0]?.url}
                inStock={product.stockCount > 0}
              />
              <WishlistButton
                productId={product.id}
                productSlug={product.slug}
                initiallySaved={isSaved}
                isSignedIn={Boolean(session?.user?.id)}
              />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Handmade in Oxford. Packed from the studio. Free UK delivery over
              £50.
            </p>

            {product.materials && product.materials.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="eyebrow mb-3">Materials</h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.split(",").map((mat) => (
                    <span key={mat.trim()} className="eyebrow bg-muted px-2 py-1">
                      {mat.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.fullDescription && (
              <div className="border-t pt-6">
                <h3 className="eyebrow mb-4">Description</h3>
                <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.fullDescription}
                </div>
              </div>
            )}

            {product.tags.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((pt) => (
                    <span key={pt.tagId} className="text-xs text-muted-foreground">
                      #{pt.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 lg:mt-28">
          <SectionHeading
            eyebrow="From the same collection"
            title="You may also like"
            action={{ href: `/shop?category=${product.category}`, label: "View all" }}
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                slug={item.slug}
                title={item.title}
                price={item.price}
                compareAtPrice={item.compareAtPrice}
                image={item.images[0]?.url}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
