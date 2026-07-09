import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { InterviewSession } from "@/components/interview/interview-session";
import { prisma } from "@/lib/prisma";

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
};

export default async function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user?.id) notFound();

  const { id } = await params;
  const interview = await prisma.interview.findFirst({ where: { id, userId: user.id } });
  if (!interview) notFound();

  const answers = await prisma.answer.findMany({
    where: { interviewId: id },
    orderBy: { questionIndex: "asc" }
  });

  return (
    <InterviewSession
      interview={{
        id: interview.id,
        company: interview.company,
        role: interview.role,
        difficulty: interview.difficulty,
        questions: interview.questions as unknown as InterviewQuestion[],
        status: interview.status,
        overallScore: interview.overallScore
      }}
      initialAnswers={answers.map((answer) => ({
        questionIndex: answer.questionIndex,
        answerText: answer.answerText,
        score: answer.score,
        feedback: answer.feedback
      }))}
    />
  );
}
