"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Clock } from "lucide-react";

const PLATFORM_META: Record<string, { icon: React.ReactNode; reason: string }> = {
  INSTAGRAM: {
    icon: <span className="text-xs font-bold">IG</span>,
    reason: "11:00 AM — Peak engagement when users browse during lunch break",
  },
  FACEBOOK: {
    icon: <span className="text-xs font-bold">FB</span>,
    reason: "10:00 AM — Mid-morning when users check feeds at work",
  },
  TIKTOK: {
    icon: <span className="text-xs font-bold">TT</span>,
    reason: "7:00 PM — Evening wind-down when TikTok usage peaks",
  },
  X: {
    icon: <span className="text-xs font-bold">X</span>,
    reason: "9:00 AM — Morning commute and start-of-day scrolling",
  },
  PINTEREST: {
    icon: <span className="text-xs font-bold">P</span>,
    reason: "8:00 PM — Evening browsing and planning time",
  },
};

interface Schedule {
  id: string;
  platform: string;
  postTime: string;
  isActive: boolean;
  timezone: string;
}

export function SocialScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    const res = await fetch("/api/admin/social/schedule");
    const data = await res.json();
    setSchedules(data.schedules || []);
    setLoading(false);
  }

  async function updateSchedule(id: string, data: Record<string, unknown>) {
    setSaving(id);
    await fetch("/api/admin/social/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    await fetchSchedules();
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Posting Schedule
          </CardTitle>
          <CardDescription>
            Optimal posting times for each platform, set to UK time (Europe/London).
            These times are based on peak engagement data for handmade / artisan content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const meta = PLATFORM_META[schedule.platform];
              return (
                <div
                  key={schedule.id}
                  className="flex items-center gap-4 py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 w-28">
                    {meta?.icon}
                    <span className="text-sm font-medium">
                      {schedule.platform}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={schedule.postTime}
                      onChange={(e) =>
                        updateSchedule(schedule.id, { postTime: e.target.value })
                      }
                      className="w-32"
                    />
                    {saving === schedule.id && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={schedule.isActive ? "default" : "outline"}
                    onClick={() =>
                      updateSchedule(schedule.id, { isActive: !schedule.isActive })
                    }
                  >
                    {schedule.isActive ? "Active" : "Paused"}
                  </Button>

                  <p className="text-xs text-muted-foreground hidden lg:block flex-1">
                    {meta?.reason}
                  </p>

                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {schedule.timezone}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Why These Times?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-3">
          <p>
            <strong>Instagram (11:00 AM)</strong> — Lunch-break browsing peaks.
            Visual content like handmade products performs best mid-morning to midday.
          </p>
          <p>
            <strong>Facebook (10:00 AM)</strong> — Users check feeds mid-morning.
            Community-focused content gets more shares during work hours.
          </p>
          <p>
            <strong>TikTok (7:00 PM)</strong> — Evening wind-down is peak TikTok time.
            Short-form video content thrives when users relax after work.
          </p>
          <p>
            <strong>X (9:00 AM)</strong> — Morning commuters and early risers check X first.
            Quick, timely posts get the most retweets in the morning.
          </p>
          <p>
            <strong>Pinterest (8:00 PM)</strong> — Evening planners and dreamers browse Pinterest.
            Product pins get saved most during quiet evening hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
