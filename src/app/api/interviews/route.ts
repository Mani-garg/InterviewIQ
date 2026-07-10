import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const difficulties = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;

const requestSchema = z.object({
  company: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  difficulty: z.enum(difficulties),
  questionCount: z.coerce.number().int().min(3).max(12),
});

const generatedQuestionSchema = z.object({
  question: z.string(),
  category: z.string(),
  intent: z.string(),
  strongAnswerSignals: z.array(z.string()),
  followUps: z.array(z.string()),
});

const generatedInterviewSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return NextResponse.json({ interviews });
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const { company, role, difficulty, questionCount } = parsed.data;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
Return ONLY valid JSON.

{
  "questions":[
    {
      "question":"...",
      "category":"Technical",
      "intent":"...",
      "strongAnswerSignals":[
        "...",
        "..."
      ],
      "followUps":[
        "...",
        "..."
      ]
    }
  ]
}

Generate exactly ${questionCount} interview questions.

Company: ${company}
Role: ${role}
Difficulty: ${difficulty}

NO markdown.
NO explanation.
NO text before JSON.
NO text after JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text ?? "";

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON." },
        { status: 500 }
      );
    }

    const cleaned = raw.slice(start, end + 1);

    let parsedJson;

    try {
      parsedJson = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON Parse Error");
      console.error(err);

      return NextResponse.json(
        { error: "Gemini JSON parsing failed." },
        { status: 500 }
      );
    }

    const validated =
      generatedInterviewSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.log("\n========== ZOD ERROR ==========");
      console.dir(validated.error.format(), {
        depth: null,
      });

      return NextResponse.json(
        { error: "Gemini returned an unexpected interview format." },
        { status: 502 }
      );
    }

    const questions = validated.data.questions;

    const interview = await prisma.interview.create({
      data: {
        userId,
        company,
        role,
        difficulty,
        questionCount: questions.length,
        questions,
      },
    });

    return NextResponse.json({ interview });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}