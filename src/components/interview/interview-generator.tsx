"use client";

import type * as React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, CheckCircle2, FileCheck, FileText, Layers3, Loader2, MessageSquareText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const questionCounts = [3, 5, 7, 10, 12] as const;

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
  resumeReference?: string;
};

type Interview = {
  id: string;
  company: string;
  role: string;
  difficulty: string;
  questionCount: number;
  questions: InterviewQuestion[];
  createdAt: string;
};

export type ResumeOption = {
  id: string;
  fileName: string;
  createdAt: string;
  sections?: Record<string, string[]>;
};

type InterviewGeneratorProps = {
  initialInterviews: Interview[];
  initialTotal?: number;
  userResumes?: ResumeOption[];
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-foreground">{children}</label>;
}

function InterviewCard({ interview }: { interview: Interview }) {
  const createdAt = useMemo(() => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(interview.createdAt)), [interview.createdAt]);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
      <div className="border-b border-white/10 bg-gradient-to-r from-primary/15 via-cyan-400/10 to-purple-400/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Generated interview</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{interview.role}</h3>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{interview.company}</span>
              <span>•</span>
              <span>{interview.difficulty}</span>
              <span>•</span>
              <span>{interview.questionCount} questions</span>
              <span>•</span>
              <span>{createdAt}</span>
            </p>
          </div>
          <Link href={`/dashboard/interviews/${interview.id}`} className="inline-flex items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15">
            Start session
          </Link>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        {interview.questions.map((item, index) => (
          <div key={`${interview.id}-${index}`} className="rounded-2xl border border-white/10 bg-background/45 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-primary">{item.category}</span>
                    {item.resumeReference ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <FileText className="size-3" />
                        {item.resumeReference}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-lg font-semibold leading-7 text-foreground">{item.question}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl bg-white/[0.035] p-4 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Intent</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{item.intent}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Strong answer signals</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                  {item.strongAnswerSignals.map((signal) => <li key={signal} className="flex gap-2"><CheckCircle2 className="mt-1 size-3.5 shrink-0 text-emerald-300" />{signal}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Follow-ups</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                  {item.followUps.map((followUp) => <li key={followUp}>• {followUp}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function InterviewGenerator({ initialInterviews, initialTotal, userResumes }: InterviewGeneratorProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("Intermediate");
  const [questionCount, setQuestionCount] = useState(5);
  const [resumes, setResumes] = useState<ResumeOption[]>(userResumes ?? []);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(userResumes?.[0]?.id ?? "");
  const [interviews, setInterviews] = useState(initialInterviews);
  const [total, setTotal] = useState(initialTotal ?? initialInterviews.length);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlResumeId = params.get("resumeId");
      if (urlResumeId) {
        setSelectedResumeId(urlResumeId);
      }
    }

    if (!userResumes || userResumes.length === 0) {
      fetch("/api/resumes")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data.resumes && Array.isArray(data.resumes)) {
            setResumes(data.resumes);
            if (data.resumes.length > 0) {
              setSelectedResumeId((curr) => curr || data.resumes[0].id);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [userResumes]);

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  );

  const selectedResumeSkills = useMemo(() => {
    if (!selectedResume?.sections?.skills) return [];
    return Array.isArray(selectedResume.sections.skills) ? selectedResume.sections.skills : [];
  }, [selectedResume]);

  const hasMore = interviews.length < total;

  async function generateInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);

    const response = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        role,
        difficulty,
        questionCount,
        resumeId: selectedResumeId || undefined
      })
    });
    const payload = await response.json();
    setIsGenerating(false);

    if (!response.ok) {
      setError(payload.error ?? "Interview generation failed.");
      return;
    }

    setInterviews((current) => [payload.interview, ...current]);
    setTotal((current) => current + 1);
  }

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

  return (
    <section id="interview-generator" className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Interview generation</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Build a custom AI interview</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Select a company, role, difficulty, and question count. InterviewIQ generates structured questions with intent, answer signals, and follow-ups, then saves the interview to your database.</p>
        </div>
        <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary"><Sparkles className="size-7" /></div>
      </div>

      <form onSubmit={generateInterview} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <FieldLabel>Company</FieldLabel>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
              <Building2 className="size-4 text-muted-foreground" />
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="Google, Stripe, etc."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Role</FieldLabel>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
              <BriefcaseBusiness className="size-4 text-muted-foreground" />
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="Senior Full Stack Engineer"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Difficulty</FieldLabel>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as (typeof difficulties)[number])}
              className="h-12 w-full rounded-2xl border border-white/10 bg-background/80 px-4 text-sm outline-none"
            >
              {difficulties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Question count</FieldLabel>
            <select
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-background/80 px-4 text-sm outline-none"
            >
              {questionCounts.map((item) => (
                <option key={item} value={item}>
                  {item} questions
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Tailor to Resume (Personalized Session)</FieldLabel>
              <Link
                href="/dashboard/resume"
                className="text-xs text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                + Upload new resume
              </Link>
            </div>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-background/80 px-4">
              <FileText className="size-4 text-primary shrink-0" />
              <select
                value={selectedResumeId}
                onChange={(event) => setSelectedResumeId(event.target.value)}
                className="w-full bg-transparent text-sm outline-none text-foreground"
              >
                {resumes.length > 0 ? (
                  <>
                    {resumes.map((resume, idx) => (
                      <option key={resume.id} value={resume.id} className="bg-background text-foreground">
                        {resume.fileName} {idx === 0 ? "(Latest - Recommended)" : ""}
                      </option>
                    ))}
                    <option value="" className="bg-background text-foreground">
                      None (Generic interview without resume context)
                    </option>
                  </>
                ) : (
                  <option value="" className="bg-background text-foreground">
                    No resume uploaded yet (Standard interview)
                  </option>
                )}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={isGenerating} className="h-12 px-6">
            {isGenerating ? <Loader2 className="animate-spin" /> : <MessageSquareText />}
            {isGenerating ? "Generating interview..." : "Generate interview"}
          </Button>
        </div>

        {selectedResume ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 text-xs leading-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="font-semibold text-foreground">
                  Personalized session active:
                </span>
                <span className="text-primary font-medium">{selectedResume.fileName}</span>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                Tailoring to your skills & projects
              </span>
            </div>
            {selectedResumeSkills.length > 0 ? (
              <p className="mt-2 text-muted-foreground">
                <span className="text-foreground font-medium">Detected skills:</span>{" "}
                {selectedResumeSkills.slice(0, 8).join(", ")}
                {selectedResumeSkills.length > 8 ? ` +${selectedResumeSkills.length - 8} more` : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Tip: Select or upload a resume to have questions directly challenge your actual projects and declared tech stack.</span>
            <Link href="/dashboard/resume" className="font-medium text-primary hover:underline ml-2 whitespace-nowrap">
              Upload PDF
            </Link>
          </div>
        )}
      </form>

      {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="mt-6 space-y-5">
        {interviews.length ? interviews.map((interview) => <InterviewCard key={interview.id} interview={interview} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-10 text-center">
            <Layers3 className="mx-auto size-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No generated interviews yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your newest generated question set will appear here with polished cards and interview-ready guidance.</p>
          </div>
        )}
      </div>

      {loadMoreError ? <p className="mt-4 text-sm text-red-300">{loadMoreError}</p> : null}

      {hasMore ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button type="button" variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <Loader2 className="animate-spin" /> : null}
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Showing {interviews.length} of {total} interview{total === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}
    </section>
  );
}