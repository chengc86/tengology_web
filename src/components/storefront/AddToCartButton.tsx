"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

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
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ productId, title, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      onClick={handleAdd}
      disabled={!inStock}
      className="w-full h-12 text-xs tracking-[0.2em] uppercase"
      size="lg"
    >
      {!inStock ? "Sold Out" : added ? "Added to Bag" : "Add to Bag"}
    </Button>
  );
}
