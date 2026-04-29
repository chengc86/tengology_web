import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_SCHEDULES = [
  { platform: "INSTAGRAM", postTime: "11:00", isActive: true },
  { platform: "FACEBOOK", postTime: "10:00", isActive: true },
  { platform: "TIKTOK", postTime: "19:00", isActive: true },
  { platform: "X", postTime: "09:00", isActive: true },
  { platform: "PINTEREST", postTime: "20:00", isActive: true },
];

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let schedules = await prisma.socialSchedule.findMany({
    orderBy: { platform: "asc" },
  });

  // Seed defaults if empty
  if (schedules.length === 0) {
    await Promise.all(
      DEFAULT_SCHEDULES.map((s) =>
        prisma.socialSchedule.create({ data: s })
      )
    );
    schedules = await prisma.socialSchedule.findMany({
      orderBy: { platform: "asc" },
    });
  }

  return NextResponse.json({ schedules });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, postTime, isActive } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (postTime !== undefined) data.postTime = postTime;
  if (isActive !== undefined) data.isActive = isActive;

  const schedule = await prisma.socialSchedule.update({
    where: { id },
    data,
  });

  return NextResponse.json({ schedule });
}
