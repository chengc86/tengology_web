import { prisma } from "@/lib/db";
import { DiscountManager } from "@/components/admin/DiscountManager";

export default async function AdminDiscountsPage() {
  const discounts = await prisma.discountCode.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return <DiscountManager discounts={discounts} />;
}
