import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { draftId } = await request.json();

  if (!draftId) {
    return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
  }

  const draft = await prisma.socialDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (draft.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Draft must be approved before posting" },
      { status: 400 }
    );
  }

  // Find the connected account for this platform
  const account = await prisma.socialAccount.findFirst({
    where: { platform: draft.platform, isConnected: true },
  });

  if (!account) {
    return NextResponse.json(
      {
        error: `No connected ${draft.platform} account. Please connect your ${draft.platform} account first.`,
      },
      { status: 400 }
    );
  }

  // Get the schedule for this platform
  const schedule = await prisma.socialSchedule.findFirst({
    where: { platform: draft.platform, isActive: true },
  });

  // Create the post record
  const post = await prisma.socialPost.create({
    data: {
      draftId: draft.id,
      socialAccountId: account.id,
      platform: draft.platform,
      caption: draft.caption,
      hashtags: draft.hashtags,
      imageUrl: draft.imageUrl,
      videoUrl: draft.videoUrl,
      status: "PENDING",
      scheduledFor: schedule
        ? getNextScheduledTime(schedule.postTime, schedule.timezone)
        : new Date(),
    },
  });

  // TODO: Integrate with platform APIs when credentials are available
  // For now, mark as pending and it will be picked up by a future cron job

  return NextResponse.json({
    post,
    message: `Post scheduled for ${draft.platform}. Connect your ${draft.platform} API credentials to enable auto-posting.`,
  });
}

function getNextScheduledTime(postTime: string, timezone: string): Date {
  const [hours, minutes] = postTime.split(":").map(Number);
  const now = new Date();

  // Create a date in the target timezone
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === "hour")!.value);
  const currentMinute = parseInt(parts.find((p) => p.type === "minute")!.value);

  const scheduled = new Date(now);
  scheduled.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}
