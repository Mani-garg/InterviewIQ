"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  FileText,
  type LucideIcon,
  Sparkles,
  Target,
  Trash2
} from "lucide-react";

export type ActivityEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

const iconByType: Record<string, LucideIcon> = {
  resume_uploaded: FileText,
  interview_generated: Sparkles,
  interview_completed: CheckCircle2,
  goal_created: Target,
  goal_updated: Target,
  goal_deleted: Trash2,
  interview_scheduled: CalendarDays,
  interview_schedule_cancelled: CalendarX2
};

function DashboardPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      {children}
    </section>
  );
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export function ActivityFeedPanel({ initialActivity }: { initialActivity: ActivityEvent[] }) {
  const items = useMemo(
    () => initialActivity.map((event) => ({ ...event, time: formatRelativeTime(event.createdAt) })),
    [initialActivity]
  );

  return (
    <DashboardPanel>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Activity feed</h2>
      <p className="mt-1 text-sm text-muted-foreground">Recent workspace updates.</p>

      <div className="mt-5 space-y-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <Sparkles className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              No activity yet. Upload a resume or generate an interview to get started.
            </p>
          </div>
        ) : (
          items.map((activity) => {
            const Icon = iconByType[activity.type] ?? Sparkles;
            return (
              <div key={activity.id} className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm leading-6 text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
}