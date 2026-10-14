import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { checkInterviewGenerationRateLimit } from "@/lib/rate-limit";

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
  resumeId: z.string().trim().optional().nullable(),
});

const generatedQuestionSchema = z.object({
  question: z.string(),
  category: z.string(),
  intent: z.string(),
  strongAnswerSignals: z.array(z.string()),
  followUps: z.array(z.string()),
  resumeReference: z.string().optional().nullable(),
});

const generatedInterviewSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 50;

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  const rawTake = Number(searchParams.get("take"));
  const rawSkip = Number(searchParams.get("skip"));

  const take =
    Number.isFinite(rawTake) && rawTake > 0
      ? Math.min(Math.trunc(rawTake), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const skip = Number.isFinite(rawSkip) && rawSkip > 0 ? Math.trunc(rawSkip) : 0;

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.interview.count({ where: { userId } }),
  ]);

  return NextResponse.json({ interviews, total, skip, take });
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

    const rateLimit = await checkInterviewGenerationRateLimit(userId);

    if (rateLimit.limited) {
      const message =
        rateLimit.reason === "cooldown"
          ? "You're generating interviews too quickly. Please wait a moment and try again."
          : "You've reached the hourly limit for interview generation. Please try again later.";

      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
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

    const { company, role, difficulty, questionCount, resumeId } = parsed.data;

    let resumeContextPrompt = "";
    let resumeLogDetails = "";

    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (resume) {
        const sections = (resume.sections ?? {}) as {
          skills?: string[];
          projects?: string[];
          experience?: string[];
          education?: string[];
        };

        const skillsStr = Array.isArray(sections.skills) && sections.skills.length > 0
          ? sections.skills.join(", ")
          : "Not specified";

        const projectsStr = Array.isArray(sections.projects) && sections.projects.length > 0
          ? sections.projects.map((p) => `- ${typeof p === "string" ? p : JSON.stringify(p)}`).join("\n")
          : "Not specified";

        const experienceStr = Array.isArray(sections.experience) && sections.experience.length > 0
          ? sections.experience.map((e) => `- ${typeof e === "string" ? e : JSON.stringify(e)}`).join("\n")
          : "Not specified";

        const educationStr = Array.isArray(sections.education) && sections.education.length > 0
          ? sections.education.map((e) => (typeof e === "string" ? e : JSON.stringify(e))).join(", ")
          : "Not specified";

        const rawExcerpt = resume.extractedText
          ? resume.extractedText.slice(0, 1500).replace(/\s+/g, " ").trim()
          : "";

        resumeLogDetails = ` with resume "${resume.fileName}"`;

        resumeContextPrompt = `
CANDIDATE'S RESUME & BACKGROUND:
Resume File: ${resume.fileName}
Skills: ${skillsStr}
Projects:
${projectsStr}
Experience:
${experienceStr}
Education: ${educationStr}
${rawExcerpt ? `Resume Excerpt:\n${rawExcerpt}\n` : ""}

CRITICAL INSTRUCTIONS FOR RESUME INTEGRATION:
You MUST heavily personalize this interview based on the candidate's actual resume data above, while evaluating them for the role of ${role} at ${company} (${difficulty} level).
1. Formulate questions that directly probe their listed projects, technologies, and claimed accomplishments (e.g. asking how they built a specific feature, solved architecture bottlenecks, or handled real-world constraints in their previous work).
2. Connect their past experience with ${company}'s domain and the expectations for a ${role}.
3. Test their depth on their declared core skills and technical stack.
4. For every question that relates to their resume, set "resumeReference" to a short, informative label (e.g. "Referencing: Next.js & GraphQL in E-commerce project" or "Based on your 2 years backend experience"). If a question is a general role inquiry, "resumeReference" can be null.
5. In question "category", clearly indicate relevance (e.g., "Resume Deep-Dive", "Technical (Resume-Aligned)", "Architecture & Projects", "Behavioral (Experience-Based)").
`;
      }
    }

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
      ],
      "resumeReference":"Referencing: ..."
    }
  ]
}

Generate exactly ${questionCount} interview questions.

Target Company: ${company}
Target Role: ${role}
Difficulty Level: ${difficulty}
${resumeContextPrompt}

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
      console.error(
        "Gemini response failed schema validation:",
        validated.error.flatten()
      );

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

    await logActivity(
      userId,
      "interview_generated",
      `Generated a ${difficulty.toLowerCase()} ${role} interview for ${company}${resumeLogDetails}.`
    );

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