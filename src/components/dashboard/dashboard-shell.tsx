import type * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CheckCircle2,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings,
  Target,
  TrendingUp,
  Upload,
  UsersRound
} from "lucide-react";

import { ActivityFeedPanel, type ActivityEvent } from "@/components/dashboard/activity-feed-panel";
import { GoalsPanel, type Goal } from "@/components/dashboard/goals-panel";
import { RecentInterviews } from "@/components/dashboard/recent-interviews";
import { ResumeStatus } from "@/components/dashboard/resume-status";
import { UpcomingInterviewsPanel, type ScheduledInterview } from "@/components/dashboard/upcoming-interviews-panel";
import { InterviewGenerator } from "@/components/interview/interview-generator";
import { ResumeUpload } from "@/components/resume/resume-upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, kind: "link", href: "/dashboard" },
  { label: "Interviews", icon: MessageSquareText, kind: "link", href: "/dashboard/interviews" },
  { label: "Resume", icon: FileText, kind: "link", href: "/dashboard/resume" },
  { label: "Goals", icon: Target, kind: "anchor", href: "#goals" },
  { label: "Candidates", icon: UsersRound, kind: "soon" },
  { label: "Settings", icon: Settings, kind: "soon" }
] as const;

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
  status: string;
  overallScore: number | null;
};

type DashboardStats = {
  totalInterviews: number;
  completedCount: number;
  averageScore: number | null;
  resumesCount: number;
};

type ChartPoint = { label: string; score: number };

type ResumeSummary = {
  id: string;
  fileName: string;
  createdAt: string;
  sections: Record<string, string[]>;
} | null;

type DashboardShellProps = {
  displayName: string;
  initialInterviews: Interview[];
  stats: DashboardStats;
  chartData: ChartPoint[];
  resume: ResumeSummary;
  initialGoals: Goal[];
  initialScheduledInterviews: ScheduledInterview[];
  initialActivity: ActivityEvent[];
};

function DashboardPanel({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={cn("rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20", className)}>{children}</section>;
}

function SectionHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <button className="text-sm font-medium text-primary transition-colors hover:text-primary/80">{action}</button> : null}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-background/45 px-4 py-6 backdrop-blur xl:block">
      <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Home className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">Career readiness hub</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Track preparation, resumes, and interview momentum in one place.</p>
      </div>
      <nav className="mt-6 space-y-1" aria-label="Dashboard navigation">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === "Overview";

          if (item.kind === "soon") {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground/50"
                aria-disabled="true"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
                <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">Soon</span>
              </span>
            );
          }

          const className = cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
            isActive && "bg-white/[0.08] text-foreground"
          );

          if (item.kind === "link") {
            return (
              <Link href={item.href} key={item.label} className={className}>
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          }

          return (
            <a href={item.href} key={item.label} className={className}>
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

function TopNavbar({ displayName }: Pick<DashboardShellProps, "displayName">) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 bg-background/30 px-4 py-5 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11 min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-muted-foreground sm:w-72">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search interviews, resumes, goals...</span>
        </label>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell className="size-4" aria-hidden="true" />
        </Button>
        <Button asChild>
          <Link href="/dashboard/resume">
            <Upload aria-hidden="true" />
            Upload resume
          </Link>
        </Button>
      </div>
    </header>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <DashboardPanel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </DashboardPanel>
  );
}

function StatsRow({ stats }: { stats: DashboardStats }) {
  const inProgress = stats.totalInterviews - stats.completedCount;
  const items = [
    {
      icon: MessageSquareText,
      label: "Mock interviews",
      value: String(stats.totalInterviews),
      helper: `${stats.completedCount} completed`
    },
    {
      icon: TrendingUp,
      label: "Average score",
      value: stats.averageScore !== null ? `${stats.averageScore}%` : "—",
      helper: stats.averageScore !== null ? "across completed interviews" : "complete an interview to see this"
    },
    {
      icon: CheckCircle2,
      label: "Completed interviews",
      value: String(stats.completedCount),
      helper: inProgress > 0 ? `${inProgress} still in progress` : "all caught up"
    },
    {
      icon: FileText,
      label: "Resumes uploaded",
      value: String(stats.resumesCount),
      helper: stats.resumesCount > 0 ? "most recent shown below" : "no resume yet"
    }
  ] as const;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistics cards">
      {items.map((item) => (
        <StatCard key={item.label} icon={item.icon} label={item.label} value={item.value} helper={item.helper} />
      ))}
    </section>
  );
}

function PerformanceChart({ chartData }: { chartData: ChartPoint[] }) {
  return (
    <DashboardPanel className="lg:col-span-2">
      <SectionHeader title="Performance chart" description="Score for each interview you've completed, most recent last." />
      {chartData.length < 2 ? (
        <div className="mt-8 flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <TrendingUp className="size-6" aria-hidden="true" />
          <p className="text-sm">Complete at least two interviews to see your score trend here.</p>
        </div>
      ) : (
        <div
          className="mt-8 flex h-72 items-end gap-2 sm:gap-4"
          role="img"
          aria-label={`Performance score across ${chartData.length} completed interviews.`}
        >
          {chartData.map((point, index) => (
            <div key={`${point.label}-${index}`} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-56 w-full items-end rounded-full bg-white/[0.04] p-1">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-primary/70 to-cyan-300 shadow-[0_0_24px_-10px_hsl(var(--primary))]"
                  style={{ height: `${Math.max(4, point.score)}%` }}
                />
              </div>
              <span className="text-[0.65rem] text-muted-foreground sm:text-xs">{point.label}</span>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

export function DashboardShell({
  displayName,
  initialInterviews,
  stats,
  chartData,
  resume,
  initialGoals,
  initialScheduledInterviews,
  initialActivity
}: DashboardShellProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <TopNavbar displayName={displayName} />
          <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <StatsRow stats={stats} />

            <InterviewGenerator initialInterviews={initialInterviews} />

            <ResumeUpload />

            <section className="grid gap-6 xl:grid-cols-3">
              <PerformanceChart chartData={chartData} />
              <RecentInterviews interviews={initialInterviews} />
            </section>

            <section id="goals" className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4 scroll-mt-24">
              <ResumeStatus resume={resume} />
              <GoalsPanel initialGoals={initialGoals} />
              <UpcomingInterviewsPanel initialScheduledInterviews={initialScheduledInterviews} />
              <ActivityFeedPanel initialActivity={initialActivity} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}