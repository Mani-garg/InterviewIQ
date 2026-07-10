"use client";

import { useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ParsedResumeSections } from "@/lib/resume-parser";

export type HistoryResume = {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  sections: ParsedResumeSections;
};

function formatSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function ResumeHistoryList({ resumes: initialResumes }: { resumes: HistoryResume[] }) {
  const [resumes, setResumes] = useState(initialResumes);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteResume(id: string) {
    setPendingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Could not delete this resume.");
        return;
      }

      setResumes((current) => current.filter((resume) => resume.id !== id));
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Resume history</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {resumes.length} resume{resumes.length === 1 ? "" : "s"} uploaded in total.
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {resumes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
            No resumes yet. Upload one above to get started.
          </p>
        ) : (
          resumes.map((resume) => {
            const isConfirming = confirmingId === resume.id;
            const isPending = pendingId === resume.id;
            const sectionEntries = Object.entries(resume.sections);

            return (
              <div
                key={resume.id}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-primary/40 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileText className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{resume.fileName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSize(resume.fileSize)} · uploaded {formatDate(resume.createdAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sectionEntries.map(([label, items]) => (
                          <span
                            key={label}
                            className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground"
                          >
                            {label}: {items.length}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label={isConfirming ? `Confirm delete for ${resume.fileName}` : `Delete ${resume.fileName}`}
                    onClick={() => {
                      if (!isConfirming) {
                        setConfirmingId(resume.id);
                        return;
                      }
                      void deleteResume(resume.id);
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