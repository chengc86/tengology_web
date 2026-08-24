import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  slug: string;
  title: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  image?: string | null;
  category?: string;
}

/**
 * Exhibit card: square frame, hairline, then title and price sharing a
 * baseline — product photography carries the page, the caption stays quiet.
 */
export function ProductCard({
  slug,
  title,
  price,
  compareAtPrice,
  image,
}: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
            style={{ transitionTimingFunction: "var(--ease-soft)" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
            <span className="font-heading text-4xl">T</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t pt-3">
        <h3 className="font-heading text-lg leading-tight transition-colors group-hover:text-moss-dark">
          {title}
        </h3>
        <div className="flex shrink-0 items-baseline gap-2">
          {compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
          <span
            className={
              compareAtPrice ? "text-sm text-moss-dark" : "text-sm tabular-nums"
            }
          >
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
