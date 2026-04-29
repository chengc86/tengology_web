import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.order;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-6" />
      <h1 className="font-heading text-3xl font-light mb-3">
        Thank you for your order
      </h1>
      {orderNumber && (
        <p className="text-sm text-muted-foreground mb-2">
          Order number: <span className="font-mono">{orderNumber}</span>
        </p>
      )}
      <p className="text-muted-foreground mb-8 leading-relaxed">
        We&apos;ll send you a confirmation email with your order details.
        Each item is handmade with care, so please allow a few days for
        preparation.
      </p>
      <div className="flex gap-3 justify-center">
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account/orders">View Orders</Link>
        </Button>
      </div>
    </div>
  );
}
