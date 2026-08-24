import type { Metadata } from "next";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSquarePublicConfig } from "@/lib/square";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Tengology",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Read Square env at request time. Next.js 16 can otherwise prerender
  // this page with empty credentials and hide the card form forever.
  await connection();
  const session = await auth();

  const [user, savedAddresses] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true, name: true, phone: true },
        })
      : null,
    session?.user?.id
      ? prisma.address.findMany({
          where: { userId: session.user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        })
      : [],
  ]);

  return (
    <CheckoutClient
      squareConfig={getSquarePublicConfig()}
      user={user}
      savedAddresses={savedAddresses}
    />
  );
}
