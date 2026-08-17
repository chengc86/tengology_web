import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/account");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[200px_1fr] lg:gap-14">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
