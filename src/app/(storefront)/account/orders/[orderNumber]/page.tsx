import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAccessibleOrder } from "@/lib/order-access";
import { OrderDetail } from "@/components/orders/OrderDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber} | Tengology`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/account/orders/${orderNumber}`);
  }

  const access = await getAccessibleOrder(orderNumber);
  if (!access) notFound();

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <OrderDetail order={access.order} />
    </div>
  );
}
