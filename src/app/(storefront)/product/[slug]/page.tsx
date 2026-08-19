import Image from "next/image";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { auth } from "@/lib/auth";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { WishlistButton } from "@/components/storefront/WishlistButton";
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

  const session = await auth();
  const isSaved = session?.user?.id
    ? Boolean(
        await prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: session.user.id, productId: product.id } },
          select: { id: true },
        })
      )
    : false;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          {product.images.length > 0 ? (
            <>
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].altText || product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(1).map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square overflow-hidden bg-muted"
                    >
                      <Image
                        src={img.url}
                        alt={img.altText || product.title}
                        fill
                        sizes="(max-width: 1024px) 25vw, 12vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-muted">
              <span className="font-heading text-6xl text-muted-foreground/20">
                T
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-[calc(var(--header-h,5rem)+1.5rem)] lg:self-start lg:py-8">
          <div className="space-y-6">
            <div className="border-t pt-6">
              <p className="eyebrow mb-4">
                {product.collection || product.category.replace(/_/g, " ")}
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
              <p className="text-muted-foreground leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Stock status */}
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

            {/* Materials */}
            {product.materials && product.materials.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="eyebrow mb-3">
                  Materials
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.split(",").map((mat) => (
                    <span
                      key={mat.trim()}
                      className="eyebrow bg-muted px-2 py-1"
                    >
                      {mat.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.fullDescription && (
              <div className="border-t pt-6">
                <h3 className="eyebrow mb-4">
                  Description
                </h3>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.fullDescription}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((pt) => (
                    <span
                      key={pt.tagId}
                      className="text-xs text-muted-foreground"
                    >
                      #{pt.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
