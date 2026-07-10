import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { scoreAnswer, scoreOverall } from "@/lib/scoring";

type RouteContext = { params: Promise<{ id: string }> };

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
};

const finishSchema = z.object({
  answers: z
    .array(
      z.object({
        questionIndex: z.coerce.number().int().min(0),
        answerText: z.string().max(20000)
      })
    )
    .optional()
    .default([])
});

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;

  const interview = await prisma.interview.findFirst({ where: { id, userId } });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  if (interview.status === "completed") {
    const answers = await prisma.answer.findMany({
      where: { interviewId: id },
      orderBy: { questionIndex: "asc" }
    });
    return NextResponse.json({ interview, answers });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = finishSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid finish payload." }, { status: 400 });
  }

  const questions = interview.questions as unknown as InterviewQuestion[];

  for (const { questionIndex, answerText } of parsed.data.answers) {
    const question = questions[questionIndex];
    if (!question) continue;

    await prisma.answer.upsert({
      where: { interviewId_questionIndex: { interviewId: id, questionIndex } },
      create: { interviewId: id, questionIndex, question: question.question, answerText },
      update: { answerText }
    });
  }

  const existingAnswers = await prisma.answer.findMany({
    where: { interviewId: id },
    orderBy: { questionIndex: "asc" }
  });
  const answersByIndex = new Map(existingAnswers.map((answer) => [answer.questionIndex, answer]));

  const scoredAnswers = await Promise.all(
    questions.map(async (question, questionIndex) => {
      const existing = answersByIndex.get(questionIndex);
      const answerText = existing?.answerText ?? "";
      const { score, feedback } = scoreAnswer(answerText, question.strongAnswerSignals ?? []);

      return prisma.answer.upsert({
        where: { interviewId_questionIndex: { interviewId: id, questionIndex } },
        create: { interviewId: id, questionIndex, question: question.question, answerText, score, feedback },
        update: { score, feedback }
      });
    })
  );

  const overallScore = scoreOverall(scoredAnswers.map((answer) => answer.score ?? 0));

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      status: "completed",
      overallScore: overallScore ?? undefined,
      completedAt: new Date()
    }
  });

  await logActivity(
    userId,
    "interview_completed",
    overallScore !== null
      ? `Completed the ${interview.role} interview for ${interview.company} — scored ${overallScore}%.`
      : `Completed the ${interview.role} interview for ${interview.company}.`
  );

  return NextResponse.json({
    interview: updatedInterview,
    answers: scoredAnswers.sort((a, b) => a.questionIndex - b.questionIndex)
  });
}