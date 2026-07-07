import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

const requestSchema = z.object({
  company: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  difficulty: z.enum(difficulties),
  questionCount: z.coerce.number().int().min(3).max(12)
});

const generatedQuestionSchema = z.object({
  question: z.string().min(10),
  category: z.string().min(2),
  intent: z.string().min(10),
  strongAnswerSignals: z.array(z.string().min(3)).min(2).max(5),
  followUps: z.array(z.string().min(5)).min(1).max(3)
});

const generatedInterviewSchema = z.object({
  questions: z.array(generatedQuestionSchema)
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to view interviews." }, { status: 401 });
  }

  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 6
  });

  return NextResponse.json({ interviews });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to generate an interview." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a company, role, difficulty, and 3-12 questions." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI is not configured. Add OPENAI_API_KEY to your environment." }, { status: 500 });
  }

  const { company, role, difficulty, questionCount } = parsed.data;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_INTERVIEW_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You create practical, fair, role-specific interview question sets. Return only valid JSON with a questions array. Do not include protected-class or discriminatory questions."
      },
      {
        role: "user",
        content: `Generate ${questionCount} ${difficulty} interview questions for a ${role} candidate interviewing at ${company}. Include a mix of technical/role craft, behavioral, collaboration, and company-context questions. Each question needs: question, category, intent, strongAnswerSignals array, and followUps array.`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    return NextResponse.json({ error: "OpenAI did not return interview questions." }, { status: 502 });
  }

  const generated = generatedInterviewSchema.safeParse(JSON.parse(content));

  if (!generated.success) {
    return NextResponse.json({ error: "OpenAI returned an unexpected interview format." }, { status: 502 });
  }

  const questions = generated.data.questions.slice(0, questionCount);
  const interview = await prisma.interview.create({
    data: {
      userId,
      company,
      role,
      difficulty,
      questionCount: questions.length,
      questions
    }
  });

  return NextResponse.json({ interview });
}
