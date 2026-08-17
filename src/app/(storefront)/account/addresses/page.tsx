import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata: Metadata = {
  title: "Addresses | Tengology",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/account/addresses");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return <AddressBook addresses={addresses} />;
}
