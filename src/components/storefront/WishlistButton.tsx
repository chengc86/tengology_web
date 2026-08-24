"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/actions/account";

/**
 * Save-for-later. Signed-out shoppers are sent to sign-in with a callback
 * back to this product, so the intent isn't lost.
 */
export function WishlistButton({
  productId,
  productSlug,
  initiallySaved,
  isSignedIn,
}: {
  productId: string;
  productSlug: string;
  initiallySaved: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!isSignedIn) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/product/${productSlug}`)}`);
      return;
    }

    // Optimistic — the heart should fill the moment it's clicked.
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (!result.ok) setSaved(!next);
      else if (typeof result.saved === "boolean") setSaved(result.saved);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      disabled={pending}
      className="h-12 w-full rounded-none text-xs uppercase tracking-[0.15em]"
      aria-pressed={saved}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      )}
      {saved ? "Saved" : "Save for later"}
    </Button>
  );
}
