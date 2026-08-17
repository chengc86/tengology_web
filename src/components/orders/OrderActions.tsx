"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelMyOrder, reorderItems } from "@/actions/orders";
import { useCartStore } from "@/store/cart";

/**
 * Customer-facing order actions: cancel while it's still cancellable,
 * and rebuild the basket from a past order.
 */

export function CancelOrderButton({
  orderNumber,
  guestToken,
}: {
  orderNumber: string;
  guestToken?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError("");
    startTransition(async () => {
      const result = await cancelMyOrder({ orderNumber, guestToken, reason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Ban className="h-3.5 w-3.5" />
        Cancel order
      </Button>
    );
  }

  return (
    <div className="w-full rounded-sm border border-destructive/30 bg-destructive/5 p-4">
      <p className="mb-1 text-sm font-medium">Cancel this order?</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Anything already paid is refunded to your original payment method within 5–10 working days.
      </p>

      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Reason (optional)"
        className="mb-3 bg-background"
        maxLength={200}
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={confirm} disabled={pending}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Yes, cancel it
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Keep order
        </Button>
      </div>
    </div>
  );
}

export function ReorderButton({
  orderNumber,
  guestToken,
}: {
  orderNumber: string;
  guestToken?: string | null;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function reorder() {
    setMessage("");
    startTransition(async () => {
      const result = await reorderItems(orderNumber, guestToken);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      if (result.items.length === 0) {
        setMessage("None of these pieces are available right now.");
        return;
      }

      for (const item of result.items) {
        addItem(
          { productId: item.productId, title: item.title, price: item.price, image: item.image },
          item.quantity
        );
      }

      if (result.unavailable.length > 0) {
        setMessage(`Added. ${result.unavailable.join(", ")} ${result.unavailable.length === 1 ? "is" : "are"} no longer available.`);
        return;
      }

      router.push("/cart");
    });
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={reorder} disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        Buy again
      </Button>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
