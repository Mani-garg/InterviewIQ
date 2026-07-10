import { currentUser } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
};

export default async function DashboardPage() {
  const user = await currentUser();
  const displayName = user?.firstName ?? user?.username ?? "there";
  const userId = user?.id;

  const [
    recentInterviews,
    totalInterviews,
    completedInterviews,
    resumesCount,
    latestResume,
    goals,
    scheduledInterviews,
    activityEvents
  ] = userId
    ? await Promise.all([
        prisma.interview.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 6
        }),
        prisma.interview.count({ where: { userId } }),
        prisma.interview.findMany({
          where: { userId, status: "completed" },
          orderBy: { completedAt: "asc" },
          take: 12,
          select: { id: true, overallScore: true, completedAt: true, role: true, company: true }
        }),
        prisma.resume.count({ where: { userId } }),
        prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.goal.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 6
        }),
        prisma.scheduledInterview.findMany({
          where: { userId, scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: "asc" },
          take: 5
        }),
        prisma.activityEvent.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 8
        })
      ])
    : [[], 0, [], 0, null, [], [], []];

  const scoredCompleted = completedInterviews.filter(
    (interview): interview is typeof interview & { overallScore: number } => interview.overallScore !== null
  );
  const averageScore = scoredCompleted.length
    ? Math.round(scoredCompleted.reduce((sum, interview) => sum + interview.overallScore, 0) / scoredCompleted.length)
    : null;

  return (
    <DashboardShell
      displayName={displayName}
      initialInterviews={recentInterviews.map((interview) => ({
        id: interview.id,
        company: interview.company,
        role: interview.role,
        difficulty: interview.difficulty,
        questionCount: interview.questionCount,
        questions: interview.questions as unknown as InterviewQuestion[],
        createdAt: interview.createdAt.toISOString(),
        status: interview.status,
        overallScore: interview.overallScore
      }))}
      stats={{
        totalInterviews,
        completedCount: completedInterviews.length,
        averageScore,
        resumesCount
      }}
      chartData={scoredCompleted.map((interview) => ({
        label: interview.completedAt
          ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(interview.completedAt)
          : "",
        score: interview.overallScore
      }))}
      resume={
        latestResume
          ? {
              id: latestResume.id,
              fileName: latestResume.fileName,
              createdAt: latestResume.createdAt.toISOString(),
              sections: latestResume.sections as unknown as Record<string, string[]>
            }
          : null
      }
      initialGoals={goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        targetCount: goal.targetCount,
        currentCount: goal.currentCount
      }))}
      initialScheduledInterviews={scheduledInterviews.map((interview) => ({
        id: interview.id,
        company: interview.company,
        role: interview.role,
        type: interview.type,
        scheduledAt: interview.scheduledAt.toISOString()
      }))}
      initialActivity={activityEvents.map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        createdAt: event.createdAt.toISOString()
      }))}
    />
  );
}