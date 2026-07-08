import type * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flame,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UsersRound
} from "lucide-react";

import { InterviewGenerator } from "@/components/interview/interview-generator";
import { ResumeUpload } from "@/components/resume/resume-upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Interviews", icon: MessageSquareText, active: false },
  { label: "Resume", icon: FileText, active: false },
  { label: "Goals", icon: Target, active: false },
  { label: "Candidates", icon: UsersRound, active: false },
  { label: "Settings", icon: Settings, active: false }
] as const;

const stats = [
  { label: "Mock interviews", value: "24", delta: "+18%", helper: "vs. last month", icon: MessageSquareText },
  { label: "Average score", value: "82%", delta: "+7 pts", helper: "communication + delivery", icon: TrendingUp },
  { label: "Resume match", value: "91%", delta: "+12%", helper: "role alignment", icon: FileText },
  { label: "Offers tracked", value: "3", delta: "+1", helper: "active pipelines", icon: BriefcaseBusiness }
] as const;

const chartBars = [42, 58, 52, 67, 74, 71, 83, 79, 88, 92, 86, 94] as const;
const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const recentInterviews = [
  { role: "Product Manager", company: "Northstar Labs", date: "Today", score: "88%", status: "Completed" },
  { role: "Frontend Engineer", company: "Orbital Systems", date: "Yesterday", score: "81%", status: "Reviewed" },
  { role: "Data Analyst", company: "Metricly", date: "Jun 28", score: "76%", status: "Needs practice" }
] as const;

const resumeSections = [
  { label: "Role keywords", value: 92 },
  { label: "Impact bullets", value: 78 },
  { label: "Formatting", value: 96 }
] as const;

const goals = [
  { label: "Complete 4 mock interviews", value: 75, meta: "3 of 4 done" },
  { label: "Practice behavioral stories", value: 60, meta: "6 of 10 stories" },
  { label: "Apply to target roles", value: 45, meta: "9 of 20 roles" }
] as const;

const upcomingInterviews = [
  { role: "Senior UX Designer", company: "Canvas Cloud", time: "Tomorrow · 10:00 AM", type: "Portfolio review" },
  { role: "Growth Marketer", company: "SignalWorks", time: "Fri · 2:30 PM", type: "Hiring manager" },
  { role: "Software Engineer", company: "Helio Bank", time: "Mon · 9:00 AM", type: "Technical screen" }
] as const;

const activityFeed = [
  { text: "Resume score improved after adding measurable outcomes.", time: "12 min ago", icon: FileText },
  { text: "New practice prompt added for leadership scenarios.", time: "1 hr ago", icon: Sparkles },
  { text: "Interview notes synced for Northstar Labs.", time: "3 hrs ago", icon: CheckCircle2 },
  { text: "Weekly goal streak reached 5 days.", time: "Yesterday", icon: Flame }
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
};

type DashboardShellProps = {
  displayName: string;
  initialInterviews: Interview[];
};

function DashboardPanel({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={cn("rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20", className)}>{children}</section>;
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: string }) {
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-label={`${value}% complete`}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
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
          return (
            <Link
              href="#"
              key={item.label}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
                item.active && "bg-white/[0.08] text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
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
          <a href="#resume-upload">
            <Upload aria-hidden="true" />
            Upload resume
          </a>
        </Button>
      </div>
    </header>
  );
}

function StatCard({ stat }: { stat: (typeof stats)[number] }) {
  const Icon = stat.icon;
  return (
    <DashboardPanel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          {stat.delta}
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{stat.label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
    </DashboardPanel>
  );
}

function PerformanceChart() {
  return (
    <DashboardPanel className="lg:col-span-2">
      <SectionHeader title="Performance chart" description="Monthly interview readiness score across practice sessions." action="View report" />
      <div className="mt-8 flex h-72 items-end gap-2 sm:gap-4" role="img" aria-label="Performance score increased from 42 in January to 94 in December.">
        {chartBars.map((value, index) => (
          <div key={chartLabels[index]} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-56 w-full items-end rounded-full bg-white/[0.04] p-1">
              <div
                className="w-full rounded-full bg-gradient-to-t from-primary/70 to-cyan-300 shadow-[0_0_24px_-10px_hsl(var(--primary))]"
                style={{ height: `${value}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-muted-foreground sm:text-xs">{chartLabels[index]}</span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function RecentInterviews() {
  return (
    <DashboardPanel>
      <SectionHeader title="Recent interviews" description="Practice and live interview snapshots." action="See all" />
      <div className="mt-5 space-y-3">
        {recentInterviews.map((interview) => (
          <div key={`${interview.role}-${interview.company}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{interview.role}</p>
                <p className="mt-1 text-sm text-muted-foreground">{interview.company} · {interview.date}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{interview.score}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{interview.status}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function ResumeStatus() {
  return (
    <DashboardPanel>
      <SectionHeader title="Resume status" description="UI-only readiness indicators." />
      <div className="mt-5 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-400/10 p-5">
        <div className="flex items-center justify-between">
          <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
          <span className="text-3xl font-semibold text-foreground">91%</span>
        </div>
        <p className="mt-4 font-medium text-foreground">Strong match for target roles</p>
        <p className="mt-1 text-sm text-muted-foreground">Add one leadership metric to polish your executive summary.</p>
      </div>
      <div className="mt-5 space-y-4">
        {resumeSections.map((section) => (
          <div key={section.label}>
            <div className="mb-2 flex justify-between text-sm"><span>{section.label}</span><span className="text-muted-foreground">{section.value}%</span></div>
            <ProgressBar value={section.value} />
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function Goals() {
  return (
    <DashboardPanel>
      <SectionHeader title="Goals" description="Keep your preparation on track." />
      <div className="mt-5 space-y-4">
        {goals.map((goal) => (
          <div key={goal.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{goal.label}</span>
              <span className="text-muted-foreground">{goal.meta}</span>
            </div>
            <ProgressBar value={goal.value} />
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function UpcomingInterviews() {
  return (
    <DashboardPanel>
      <SectionHeader title="Upcoming interviews" description="Your next scheduled conversations." action="Manage" />
      <div className="mt-5 space-y-3">
        {upcomingInterviews.map((interview) => (
          <div key={`${interview.role}-${interview.company}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{interview.role}</p>
              <p className="truncate text-sm text-muted-foreground">{interview.company} · {interview.time}</p>
              <p className="mt-1 text-xs text-primary">{interview.type}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function ActivityFeed() {
  return (
    <DashboardPanel>
      <SectionHeader title="Activity feed" description="Recent workspace updates." />
      <div className="mt-5 space-y-5">
        {activityFeed.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.text} className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary"><Icon className="size-4" /></div>
              <div>
                <p className="text-sm leading-6 text-foreground">{activity.text}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

export function DashboardShell({ displayName, initialInterviews }: DashboardShellProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <TopNavbar displayName={displayName} />
          <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistics cards">
              {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
            </section>

            <InterviewGenerator initialInterviews={initialInterviews} />

            <ResumeUpload />

            <section className="grid gap-6 xl:grid-cols-3">
              <PerformanceChart />
              <RecentInterviews />
            </section>

            <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
              <ResumeStatus />
              <Goals />
              <UpcomingInterviews />
              <ActivityFeed />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
