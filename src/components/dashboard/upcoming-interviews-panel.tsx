"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Plus, X } from "lucide-react";

export type ScheduledInterview = {
  id: string;
  company: string;
  role: string;
  type: string;
  scheduledAt: string;
};

const interviewTypes = ["Phone screen", "Technical screen", "Hiring manager", "Portfolio review", "Panel", "Final round"] as const;

function DashboardPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  description,
  action,
  onAction
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);

  const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);

  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Tomorrow · ${time}`;
  if (dayDiff > 1 && dayDiff < 7) return `${new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)} · ${time}`;
  return `${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date)} · ${time}`;
}

function toDatetimeLocalDefault() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function UpcomingInterviewsPanel({ initialScheduledInterviews }: { initialScheduledInterviews: ScheduledInterview[] }) {
  const router = useRouter();
  const [interviews, setInterviews] = useState(initialScheduledInterviews);
  const [isAdding, setIsAdding] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState<(typeof interviewTypes)[number]>("Technical screen");
  const [scheduledAt, setScheduledAt] = useState(() => toDatetimeLocalDefault());
  const [isCreating, setIsCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInterviews(initialScheduledInterviews);
  }, [initialScheduledInterviews]);

  const sorted = useMemo(
    () => [...interviews].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [interviews]
  );

  async function createScheduledInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/scheduled-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, type, scheduledAt: new Date(scheduledAt).toISOString() })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not schedule this interview.");
        return;
      }

      setInterviews((current) => [...current, payload.scheduledInterview]);
      setCompany("");
      setRole("");
      setType("Technical screen");
      setScheduledAt(toDatetimeLocalDefault());
      setIsAdding(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function cancelInterview(interview: ScheduledInterview) {
    setPendingId(interview.id);
    setError(null);

    const previous = interviews;
    setInterviews((current) => current.filter((item) => item.id !== interview.id));

    try {
      const response = await fetch(`/api/scheduled-interviews/${interview.id}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setInterviews(previous);
        setError(payload.error ?? "Could not cancel this interview.");
        return;
      }

      router.refresh();
    } catch {
      setInterviews(previous);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DashboardPanel>
      <SectionHeader
        title="Upcoming interviews"
        description="Your next scheduled conversations."
        action={isAdding ? undefined : "Schedule"}
        onAction={() => setIsAdding(true)}
      />

      {isAdding ? (
        <form onSubmit={createScheduledInterview} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">New scheduled interview</p>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder="Company"
              className="h-10 rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder="Role"
              className="h-10 rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as (typeof interviewTypes)[number])}
              className="h-10 rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none"
            >
              {interviewTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              className="h-10 rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {isCreating ? "Scheduling..." : "Schedule interview"}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-2.5 text-xs text-red-200">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {sorted.length === 0 && !isAdding ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <CalendarDays className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled yet. Add your next interview.</p>
          </div>
        ) : (
          sorted.map((interview) => (
            <div
              key={interview.id}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{interview.role}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {interview.company} · {formatWhen(interview.scheduledAt)}
                </p>
                <p className="mt-1 text-xs text-primary">{interview.type}</p>
              </div>
              <button
                type="button"
                disabled={pendingId === interview.id}
                aria-label={`Cancel interview with ${interview.company}`}
                onClick={() => cancelInterview(interview)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-red-400/30 hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
              >
                {pendingId === interview.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              </button>
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}