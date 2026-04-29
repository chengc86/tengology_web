import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      stockCount: true,
      lowStockThreshold: true,
      price: true,
      category: true,
      isPublished: true,
    },
    orderBy: { stockCount: "asc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      price: Number(p.price),
    }))
  );
}
