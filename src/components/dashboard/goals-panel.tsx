"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Target, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type Goal = {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
};

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

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-label={`${clamped}% complete`}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function GoalsPanel({ initialGoals }: { initialGoals: Goal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [targetCount, setTargetCount] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  async function createGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, targetCount })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not create this goal.");
        return;
      }

      setGoals((current) => [payload.goal, ...current]);
      setTitle("");
      setTargetCount(4);
      setIsAdding(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateCount(goal: Goal, nextCount: number) {
    const clamped = Math.max(0, Math.min(goal.targetCount, nextCount));
    if (clamped === goal.currentCount) return;

    setPendingId(goal.id);
    setError(null);

    const previous = goals;
    setGoals((current) => current.map((item) => (item.id === goal.id ? { ...item, currentCount: clamped } : item)));

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCount: clamped })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setGoals(previous);
        setError(payload.error ?? "Could not update this goal.");
        return;
      }

      router.refresh();
    } catch {
      setGoals(previous);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteGoal(goal: Goal) {
    setPendingId(goal.id);
    setError(null);

    const previous = goals;
    setGoals((current) => current.filter((item) => item.id !== goal.id));

    try {
      const response = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setGoals(previous);
        setError(payload.error ?? "Could not remove this goal.");
        return;
      }

      router.refresh();
    } catch {
      setGoals(previous);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DashboardPanel>
      <SectionHeader
        title="Goals"
        description="Keep your preparation on track."
        action={isAdding ? undefined : "Add goal"}
        onAction={() => setIsAdding(true)}
      />

      {isAdding ? (
        <form onSubmit={createGoal} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">New goal</p>
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
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={3}
            maxLength={120}
            placeholder="Complete 4 mock interviews"
            className="h-11 w-full rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="goal-target">
              Target count
            </label>
            <input
              id="goal-target"
              type="number"
              min={1}
              max={1000}
              value={targetCount}
              onChange={(event) => setTargetCount(Number(event.target.value))}
              className="h-9 w-20 rounded-lg border border-white/10 bg-background/60 px-2 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {isCreating ? "Creating..." : "Create goal"}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-2.5 text-xs text-red-200">{error}</p> : null}

      <div className="mt-5 space-y-4">
        {goals.length === 0 && !isAdding ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <Target className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">No goals yet. Add one to start tracking progress.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const percent = goal.targetCount > 0 ? Math.round((goal.currentCount / goal.targetCount) * 100) : 0;
            const isPending = pendingId === goal.id;
            const isComplete = goal.currentCount >= goal.targetCount;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className={cn("font-medium text-foreground", isComplete && "text-emerald-300")}>{goal.title}</span>
                  <span className="text-muted-foreground">
                    {goal.currentCount} of {goal.targetCount} done
                  </span>
                </div>
                <ProgressBar value={percent} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending || goal.currentCount <= 0}
                    aria-label={`Decrease progress on ${goal.title}`}
                    onClick={() => updateCount(goal, goal.currentCount - 1)}
                    className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending || isComplete}
                    aria-label={`Increase progress on ${goal.title}`}
                    onClick={() => updateCount(goal, goal.currentCount + 1)}
                    className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label={`Delete goal ${goal.title}`}
                    onClick={() => deleteGoal(goal)}
                    className="ml-auto flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-400/30 hover:text-red-300 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
}