import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          {product.images.length > 0 ? (
            <>
              <div className="aspect-square bg-muted rounded-sm overflow-hidden">
                <img
                  src={product.images[0].url}
                  alt={product.images[0].altText || product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(1).map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square bg-muted rounded-sm overflow-hidden"
                    >
                      <img
                        src={img.url}
                        alt={img.altText || product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-muted rounded-sm flex items-center justify-center">
              <span className="font-heading text-6xl text-muted-foreground/20">
                T
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:py-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
                {product.collection || product.category.replace(/_/g, " ")}
              </p>
              <h1 className="font-heading text-3xl lg:text-4xl font-light">
                {product.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl">{formatPrice(price)}</span>
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
                  <span className="text-amber-600">
                    Only {product.stockCount} left
                  </span>
                ) : (
                  <span className="text-green-700">In stock</span>
                )
              ) : (
                <span className="text-destructive">Sold out</span>
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              title={product.title}
              price={price}
              image={product.images[0]?.url}
              inStock={product.stockCount > 0}
            />

            {/* Materials */}
            {product.materials && product.materials.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-xs tracking-[0.15em] uppercase font-medium mb-2">
                  Materials
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.split(",").map((mat) => (
                    <span
                      key={mat.trim()}
                      className="text-xs px-2 py-1 bg-muted rounded-sm"
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
                <h3 className="text-xs tracking-[0.15em] uppercase font-medium mb-3">
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
