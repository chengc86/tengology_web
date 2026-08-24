"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  altText: string | null;
};

export function ProductGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center bg-muted">
        <span className="font-heading text-6xl text-muted-foreground/20">T</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          key={current.id}
          src={current.url}
          alt={current.altText || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${title}`}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-square overflow-hidden bg-muted transition-opacity",
                i === active
                  ? "ring-1 ring-foreground"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.altText || title}
                fill
                sizes="(max-width: 1024px) 25vw, 12vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
