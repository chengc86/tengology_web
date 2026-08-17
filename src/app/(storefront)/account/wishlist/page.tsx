import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { WishlistAddToCart } from "@/components/account/WishlistAddToCart";

export const metadata: Metadata = {
  title: "Favourites | Tengology",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/account/wishlist");

  const saved = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
      },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-light">Favourites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pieces you&apos;ve saved for later.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-sm border py-16 text-center">
          <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="mb-4 text-sm text-muted-foreground">Nothing saved yet.</p>
          <Button asChild size="sm">
            <Link href="/shop">Browse the shop</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map(({ id, product }) => {
            const image = product.images[0]?.url;
            const soldOut = product.stockCount <= 0;

            return (
              <div key={id} className="group rounded-sm border">
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-t-sm bg-muted">
                    {image ? (
                      <Image
                        src={image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-7 w-7 text-muted-foreground/30" />
                      </div>
                    )}
                    {soldOut && (
                      <span className="absolute left-2 top-2 rounded-sm bg-background/90 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        Sold out
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-3">
                  <Link href={`/product/${product.slug}`} className="block">
                    <p className="truncate text-sm hover:underline">{product.title}</p>
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">{formatMoney(product.price)}</p>

                  <WishlistAddToCart
                    productId={product.id}
                    title={product.title}
                    price={product.price}
                    image={image}
                    soldOut={soldOut}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
