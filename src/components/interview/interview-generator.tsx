"use client";

import type * as React from "react";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, CheckCircle2, Layers3, Loader2, MessageSquareText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const questionCounts = [3, 5, 7, 10, 12] as const;

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
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

type InterviewGeneratorProps = {
  initialInterviews: Interview[];
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
          <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
            Ready for practice
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        {interview.questions.map((item, index) => (
          <div key={`${interview.id}-${index}`} className="rounded-2xl border border-white/10 bg-background/45 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</div>
                <div>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-primary">{item.category}</span>
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

export function InterviewGenerator({ initialInterviews }: InterviewGeneratorProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("Intermediate");
  const [questionCount, setQuestionCount] = useState(5);
  const [interviews, setInterviews] = useState(initialInterviews);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setError(null);

    const response = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, difficulty, questionCount })
    });
    const payload = await response.json();
    setIsGenerating(false);

    if (!response.ok) {
      setError(payload.error ?? "Interview generation failed.");
      return;
    }

    setInterviews((current) => [payload.interview, ...current].slice(0, 6));
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

      <form onSubmit={generateInterview} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr_0.7fr_auto] lg:items-end">
        <div className="space-y-2">
          <FieldLabel>Company</FieldLabel>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
            <Building2 className="size-4 text-muted-foreground" />
            <input value={company} onChange={(event) => setCompany(event.target.value)} required minLength={2} maxLength={80} placeholder="Acme AI" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel>Role</FieldLabel>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
            <BriefcaseBusiness className="size-4 text-muted-foreground" />
            <input value={role} onChange={(event) => setRole(event.target.value)} required minLength={2} maxLength={80} placeholder="Product Manager" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel>Difficulty</FieldLabel>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as (typeof difficulties)[number])} className="h-12 w-full rounded-2xl border border-white/10 bg-background/80 px-4 text-sm outline-none">
            {difficulties.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <FieldLabel>Question count</FieldLabel>
          <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="h-12 w-full rounded-2xl border border-white/10 bg-background/80 px-4 text-sm outline-none">
            {questionCounts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={isGenerating} className="h-12">
          {isGenerating ? <Loader2 className="animate-spin" /> : <MessageSquareText />}
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
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
    </section>
  );
}
