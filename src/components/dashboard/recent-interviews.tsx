"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type RecentInterview = {
  id: string;
  company: string;
  role: string;
  createdAt: string;
  status: string;
  overallScore: number | null;
};

function statusLabel(interview: RecentInterview) {
  if (interview.status === "completed") {
    return interview.overallScore !== null ? `${interview.overallScore}%` : "Completed";
  }
  if (interview.status === "in_progress") return "In progress";
  return "Not started";
}

function DashboardPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      {children}
    </section>
  );
}

export function RecentInterviews({
  interviews: initialInterviews,
  initialTotal
}: {
  interviews: RecentInterview[];
  initialTotal?: number;
}) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [total, setTotal] = useState(initialTotal ?? initialInterviews.length);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const hasMore = interviews.length < total;

  async function loadMore() {
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await fetch(`/api/interviews?skip=${interviews.length}&take=6`);
      const payload = await response.json();

      if (!response.ok) {
        setLoadMoreError(payload.error ?? "Could not load more interviews.");
        return;
      }

      setInterviews((current) => [...current, ...payload.interviews]);
      if (typeof payload.total === "number") {
        setTotal(payload.total);
      }
    } catch {
      setLoadMoreError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function deleteInterview(id: string) {
    setPendingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/interviews/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Could not delete this interview.");
        return;
      }

      setInterviews((current) => current.filter((interview) => interview.id !== id));
      setTotal((current) => Math.max(0, current - 1));
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <DashboardPanel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent interviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your latest generated practice sessions.</p>
        </div>
        <Link href="/dashboard/interviews" className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80">
          View all
        </Link>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {interviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
            No interviews yet. Generate one below to get started.
          </p>
        ) : (
          interviews.map((interview) => {
            const isConfirming = confirmingId === interview.id;
            const isPending = pendingId === interview.id;

            return (
              <div
                key={interview.id}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-primary/40 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/interviews/${interview.id}`} className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{interview.role}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {interview.company} ·{" "}
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(interview.createdAt))}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {statusLabel(interview)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      aria-label={isConfirming ? `Confirm delete for ${interview.role}` : `Delete ${interview.role}`}
                      onClick={() => {
                        if (!isConfirming) {
                          setConfirmingId(interview.id);
                          return;
                        }
                        void deleteInterview(interview.id);
                      }}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isConfirming
                          ? "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-red-400/30 hover:text-red-300"
                      )}
                    >
                      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </div>
                {isConfirming && !isPending ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Click the icon again to permanently delete this interview.{" "}
                    <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {loadMoreError ? <p className="mt-3 text-sm text-red-300">{loadMoreError}</p> : null}

      {hasMore ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground disabled:opacity-60"
          >
            {isLoadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
          <p className="text-xs text-muted-foreground">
            Showing {interviews.length} of {total} interview{total === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}
    </DashboardPanel>
  );
}