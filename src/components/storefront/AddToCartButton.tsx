"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useEffect, useRef, useState } from "react";

interface AddToCartButtonProps {
  productId: string;
  title: string;
  price: number;
  image?: string;
  inStock: boolean;
}

export function AddToCartButton({
  productId,
  title,
  price,
  image,
  inStock,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleAdd = () => {
    addItem({ productId, title, price, image });
    // The drawer is the confirmation: it slides in showing the added line.
    openCart();
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Button
      onClick={handleAdd}
      disabled={!inStock}
      className="h-12 w-full text-xs uppercase tracking-[0.2em]"
      size="lg"
    >
      {!inStock ? (
        "Sold Out"
      ) : added ? (
        <span className="animate-in zoom-in-95 duration-200">Added &#10003;</span>
      ) : (
        "Add to Bag"
      )}
    </Button>
  );
}
