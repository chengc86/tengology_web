"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { toggleWishlist } from "@/actions/account";

export function WishlistAddToCart({
  productId,
  title,
  price,
  image,
  soldOut,
}: {
  productId: string;
  title: string;
  price: number;
  image?: string;
  soldOut: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function addToBag() {
    addItem({ productId, title, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function unsave() {
    startTransition(async () => {
      await toggleWishlist(productId);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex gap-1.5">
      <Button size="sm" className="flex-1 text-xs" onClick={addToBag} disabled={soldOut}>
        {soldOut ? "Sold out" : added ? "Added" : "Add to bag"}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={unsave}
        disabled={pending}
        aria-label="Remove from favourites"
        className="h-8 w-8 shrink-0"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Heart className="h-3.5 w-3.5 fill-current" />
        )}
      </Button>
    </div>
  );
}
