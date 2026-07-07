import { currentUser } from "@clerk/nextjs/server";
import { CalendarCheck2, ClipboardList, UsersRound } from "lucide-react";

const dashboardCards = [
  {
    title: "Interview plans",
    description: "Build structured interview kits that keep every hiring loop consistent.",
    icon: ClipboardList
  },
  {
    title: "Candidate signals",
    description: "Review evidence-backed scorecards and compare role-specific strengths.",
    icon: UsersRound
  },
  {
    title: "Debrief schedule",
    description: "Coordinate upcoming debriefs and keep decisions moving with clear next steps.",
    icon: CalendarCheck2
  }
] as const;

export default async function DashboardPage() {
  const user = await currentUser();
  const displayName = user?.firstName ?? user?.username ?? "there";

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-card/70 p-8 shadow-2xl shadow-black/30 sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Welcome back, {displayName}.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          Your authenticated InterviewIQ workspace is ready for interview planning, candidate evaluation, and team debriefs.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Dashboard tools">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
