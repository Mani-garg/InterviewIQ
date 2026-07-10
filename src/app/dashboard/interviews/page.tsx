import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

import { InterviewGenerator } from "@/components/interview/interview-generator";
import { InterviewHistoryList } from "@/components/interview/interview-history-list";
import { prisma } from "@/lib/prisma";

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
};

export default async function InterviewsPage() {
  const user = await currentUser();
  const userId = user?.id;

  const interviews = userId
    ? await prisma.interview.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      })
    : [];

  const recentForGenerator = interviews.slice(0, 6).map((interview) => ({
    id: interview.id,
    company: interview.company,
    role: interview.role,
    difficulty: interview.difficulty,
    questionCount: interview.questionCount,
    questions: interview.questions as unknown as InterviewQuestion[],
    createdAt: interview.createdAt.toISOString()
  }));

  const allForHistory = interviews.map((interview) => ({
    id: interview.id,
    company: interview.company,
    role: interview.role,
    difficulty: interview.difficulty,
    questionCount: interview.questionCount,
    createdAt: interview.createdAt.toISOString(),
    status: interview.status,
    overallScore: interview.overallScore
  }));

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Interviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate new AI mock interviews and review, resume, or delete past sessions.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <InterviewGenerator initialInterviews={recentForGenerator} initialTotal={interviews.length} />
          <InterviewHistoryList interviews={allForHistory} />
        </div>
      </div>
    </main>
  );
}