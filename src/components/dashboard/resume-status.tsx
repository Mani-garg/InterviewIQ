"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ResumeSummary = {
  id: string;
  fileName: string;
  createdAt: string;
  sections: Record<string, string[]>;
} | null;

function DashboardPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      {children}
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-label={`${clamped}% complete`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function ResumeStatus({ resume: initialResume }: { resume: ResumeSummary }) {
  const [resume, setResume] = useState(initialResume);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resume) {
    return (
      <DashboardPanel>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Resume status</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload a resume to see extraction results here.</p>
        <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">No resume uploaded yet.</p>
          <a href="#resume-upload" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Upload one now
          </a>
        </div>
      </DashboardPanel>
    );
  }

  async function deleteResume() {
    if (!resume) return;
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Could not delete this resume.");
        return;
      }

      setResume(null);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  }

  const sectionEntries = Object.entries(resume.sections);
  const uploadedAt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(resume.createdAt));

  return (
    <DashboardPanel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Resume status</h2>
          <p className="mt-1 text-sm text-muted-foreground">{resume.fileName} · uploaded {uploadedAt}</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          aria-label={isConfirming ? "Confirm delete resume" : "Delete resume"}
          onClick={() => {
            if (!isConfirming) {
              setIsConfirming(true);
              return;
            }
            void deleteResume();
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

      {isConfirming && !isPending ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Click the icon again to permanently delete this resume.{" "}
          <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => setIsConfirming(false)}>
            Cancel
          </button>
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}

      <div className="mt-5 space-y-4">
        {sectionEntries.map(([label, items]) => {
          const coverage = Math.min(100, items.length * 25);
          return (
            <div key={label}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="capitalize">{label}</span>
                <span className="text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"} found</span>
              </div>
              <ProgressBar value={coverage} />
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}