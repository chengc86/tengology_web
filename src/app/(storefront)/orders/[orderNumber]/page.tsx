import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAccessibleOrder } from "@/lib/order-access";
import { OrderDetail } from "@/components/orders/OrderDetail";

export const metadata: Metadata = {
  title: "Track your order | Tengology",
  robots: { index: false, follow: false },
};

/**
 * Guest order view. Access is granted by the unguessable token emailed with
 * the order, so no account is needed to track or cancel it.
 */
export default async function GuestOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ orderNumber }, { token }] = await Promise.all([params, searchParams]);

  const access = await getAccessibleOrder(orderNumber, token);
  if (!access) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        href="/orders/lookup"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Find another order
      </Link>

      <OrderDetail order={access.order} guestToken={token ?? access.order.guestToken} />
    </div>
  );
}
