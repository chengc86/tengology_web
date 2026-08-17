import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findOrderForGuest } from "@/lib/order-access";
import { guestLookupSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Track your order | Tengology",
  description: "Look up an order using your order number and email address.",
};

/**
 * Guest order lookup. Uses a plain server action form so it works without
 * JavaScript — a shopper chasing a parcel shouldn't be blocked by a failed
 * script load.
 */
export default async function OrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function lookup(formData: FormData) {
    "use server";

    const parsed = guestLookupSchema.safeParse({
      orderNumber: formData.get("orderNumber"),
      email: formData.get("email"),
    });

    if (!parsed.success) {
      redirect("/orders/lookup?error=invalid");
    }

    const order = await findOrderForGuest(parsed.data.orderNumber, parsed.data.email);

    // Same response either way — this must not reveal whether an order exists.
    if (!order) {
      redirect("/orders/lookup?error=notfound");
    }

    if (order.userId) {
      redirect(`/account/orders/${order.orderNumber}`);
    }

    redirect(`/orders/${order.orderNumber}?token=${order.guestToken ?? ""}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:py-24">
      <div className="mb-8 text-center">
        <Search className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50" />
        <h1 className="mb-2 font-heading text-3xl font-light">Track your order</h1>
        <p className="text-sm text-muted-foreground">
          Enter your order number and the email you used at checkout.
        </p>
      </div>

      {error && (
        <p className="mb-5 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
          {error === "invalid"
            ? "Please check both fields and try again."
            : "We couldn't find an order with those details."}
        </p>
      )}

      <form action={lookup} className="space-y-4">
        <div>
          <Label htmlFor="orderNumber" className="mb-1.5 block text-xs">
            Order number
          </Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            placeholder="TNG-2026-00001"
            className="font-mono uppercase"
            required
          />
        </div>

        <div>
          <Label htmlFor="email" className="mb-1.5 block text-xs">
            Email address
          </Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <Button type="submit" className="h-11 w-full text-xs uppercase tracking-[0.2em]">
          Find my order
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Have an account?{" "}
        <Link href="/auth/signin?callbackUrl=/account/orders" className="underline hover:text-foreground">
          Sign in
        </Link>{" "}
        to see all your orders.
      </p>
    </div>
  );
}
