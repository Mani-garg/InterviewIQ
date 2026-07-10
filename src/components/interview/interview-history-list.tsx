"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type HistoryInterview = {
  id: string;
  company: string;
  role: string;
  difficulty: string;
  questionCount: number;
  createdAt: string;
  status: string;
  overallScore: number | null;
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" }
] as const;

function statusLabel(interview: HistoryInterview) {
  if (interview.status === "completed") {
    return interview.overallScore !== null ? `${interview.overallScore}%` : "Completed";
  }
  if (interview.status === "in_progress") return "In progress";
  return "Not started";
}

export function InterviewHistoryList({ interviews: initialInterviews }: { interviews: HistoryInterview[] }) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return interviews.filter((interview) => {
      const matchesStatus = statusFilter === "all" || interview.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        interview.company.toLowerCase().includes(normalizedQuery) ||
        interview.role.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [interviews, query, statusFilter]);

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
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Interview history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {interviews.length} interview{interviews.length === 1 ? "" : "s"} generated in total.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-11 min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-muted-foreground sm:w-64">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company or role..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === item.value
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
            {interviews.length === 0
              ? "No interviews yet. Generate one above to get started."
              : "No interviews match your search or filter."}
          </p>
        ) : (
          filtered.map((interview) => {
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
                      {interview.company} · {interview.difficulty} · {interview.questionCount} questions ·{" "}
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
                        new Date(interview.createdAt)
                      )}
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
                    <button
                      type="button"
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </button>
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}