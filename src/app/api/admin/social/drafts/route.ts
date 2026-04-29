import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const drafts = await prisma.socialDraft.findMany({
    where,
    include: { product: { select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ drafts });
}
