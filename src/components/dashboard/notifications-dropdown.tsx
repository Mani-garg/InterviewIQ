"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  FileText,
  type LucideIcon,
  Sparkles,
  Target,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ActivityEvent = {
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

const LAST_SEEN_KEY = "interviewiq:notifications:last-seen";

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

export function NotificationsDropdown({ initialActivity }: { initialActivity: ActivityEvent[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Unread tracking is intentionally client-only (localStorage), mirroring
  // the pattern already used in interview-session.tsx. This is a real,
  // working feature; it just doesn't need a database column, since "have I
  // looked at this list on this device" is genuinely local state.
  useEffect(() => {
    const lastSeen = window.localStorage.getItem(LAST_SEEN_KEY);
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    const unread = initialActivity.filter((event) => new Date(event.createdAt).getTime() > lastSeenTime).length;
    setUnreadCount(unread);
  }, [initialActivity]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOpen() {
    setIsOpen((current) => {
      const next = !current;
      if (next) {
        window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        setUnreadCount(0);
      }
      return next;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <Button variant="outline" size="icon" aria-label="Notifications" onClick={toggleOpen} className="relative">
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {initialActivity.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet. Activity from your account will show up here.
              </p>
            ) : (
              initialActivity.map((event) => {
                const Icon = iconByType[event.type] ?? Sparkles;
                return (
                  <div key={event.id} className="flex gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-white/[0.04]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block leading-5 text-foreground">{event.message}</span>
                      <span className="block text-xs text-muted-foreground">{formatRelativeTime(event.createdAt)}</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}