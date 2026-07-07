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
  const interviews = user?.id
    ? await prisma.interview.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6
      })
    : [];

  return (
    <DashboardShell
      displayName={displayName}
      initialInterviews={interviews.map((interview) => ({
        id: interview.id,
        company: interview.company,
        role: interview.role,
        difficulty: interview.difficulty,
        questionCount: interview.questionCount,
        questions: interview.questions as unknown as InterviewQuestion[],
        createdAt: interview.createdAt.toISOString()
      }))}
    />
  );
}
