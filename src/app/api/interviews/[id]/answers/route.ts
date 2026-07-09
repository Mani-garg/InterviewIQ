import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const upsertAnswerSchema = z.object({
  questionIndex: z.coerce.number().int().min(0),
  answerText: z.string().max(20000)
});

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;

  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  const answers = await prisma.answer.findMany({
    where: { interviewId: id },
    orderBy: { questionIndex: "asc" }
  });

  return NextResponse.json({ answers });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;

  const interview = await prisma.interview.findFirst({
    where: { id, userId }
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  if (interview.status === "completed") {
    return NextResponse.json(
      { error: "This interview is already completed and can no longer be edited." },
      { status: 409 }
    );
  }

  const body = await request.json();
  const parsed = upsertAnswerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answer payload." }, { status: 400 });
  }

  const { questionIndex, answerText } = parsed.data;
  const questions = interview.questions as unknown as { question: string }[];
  const question = questions[questionIndex];

  if (!question) {
    return NextResponse.json({ error: "That question does not exist on this interview." }, { status: 400 });
  }

  const answer = await prisma.answer.upsert({
    where: {
      interviewId_questionIndex: {
        interviewId: id,
        questionIndex
      }
    },
    create: {
      interviewId: id,
      questionIndex,
      question: question.question,
      answerText
    },
    update: {
      answerText
    }
  });

  if (interview.status === "not_started") {
    await prisma.interview.update({
      where: { id },
      data: { status: "in_progress" }
    });
  }

  return NextResponse.json({ answer });
}