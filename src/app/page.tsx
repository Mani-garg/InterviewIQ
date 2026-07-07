import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const metrics = [
  { label: "Interview signal captured", value: "94%" },
  { label: "Faster debrief cycles", value: "3.2x" },
  { label: "Structured scorecards", value: "100%" }
] as const;

const capabilities = [
  "AI-assisted question plans",
  "Realtime scorecard synthesis",
  "Candidate evidence timelines"
] as const;

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-x-8 top-12 -z-10 h-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-muted-foreground shadow-2xl shadow-black/20">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Built for high-signal hiring teams
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
              AI interview intelligence that turns conversations into confident hiring decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              InterviewIQ gives modern recruiting teams a premium workspace for structured interviews, evidence-backed feedback, and decision-ready candidate insights.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create workspace
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#platform">Explore platform</Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <dt className="text-sm text-muted-foreground">{metric.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative" id="platform">
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[2rem] border border-white/10 bg-card/80 p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-background/80 p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Senior Product Designer</p>
                    <h2 className="mt-1 text-xl font-semibold">Candidate intelligence brief</h2>
                  </div>
                  <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">92 fit score</div>
                </div>
                <div className="mt-6 space-y-3">
                  {capabilities.map((capability) => (
                    <div key={capability} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
                      <span className="text-sm text-foreground">{capability}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="size-5 text-primary" aria-hidden="true" />
                    <p className="text-sm font-medium">Decision signals</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {[88, 76, 94].map((value, index) => (
                      <div key={value} className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{["Role mastery", "Communication", "Team impact"][index]}</span>
                          <span>{value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
