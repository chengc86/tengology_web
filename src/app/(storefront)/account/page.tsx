import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  let orderCount = 0;
  try {
    orderCount = await prisma.order.count({
      where: { userId: session.user.id },
    });
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <h1 className="font-heading text-3xl font-light mb-8">My Account</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{session.user.name || "—"}</p>
            <p className="text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-light mb-2">
              {orderCount}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <form
          action={async () => {
            "use server";
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
