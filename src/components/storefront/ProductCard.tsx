"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  slug: string;
  title: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  image?: string | null;
  category?: string;
}

export function ProductCard({
  slug,
  title,
  price,
  compareAtPrice,
  image,
}: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`} className="group block">
      <div className="aspect-square overflow-hidden bg-muted rounded-sm">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <span className="font-heading text-4xl">T</span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium leading-tight group-hover:text-rose-dark transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">{formatPrice(price)}</span>
          {compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
