import { prisma } from "@/lib/db";
import { SocialDashboard } from "@/components/admin/social/SocialDashboard";

export default async function SocialMediaPage() {
  let products: Array<{ id: string; title: string }> = [];

  try {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch {
    // DB not connected yet
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-light mb-8">Social Media</h1>
      <SocialDashboard products={products} />
    </div>
  );
}
