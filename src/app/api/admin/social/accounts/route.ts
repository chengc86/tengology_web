import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    orderBy: { platform: "asc" },
  });

  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform, accountName } = await request.json();

  if (!platform || !accountName) {
    return NextResponse.json(
      { error: "Platform and account name are required" },
      { status: 400 }
    );
  }

  const account = await prisma.socialAccount.create({
    data: { platform, accountName, isConnected: false },
  });

  return NextResponse.json({ account });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...data } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
  }

  const account = await prisma.socialAccount.update({
    where: { id },
    data,
  });

  return NextResponse.json({ account });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  await prisma.socialAccount.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
