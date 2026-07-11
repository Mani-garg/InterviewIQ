import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "interview" | "resume" | "goal";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [interviews, resumes, goals] = await Promise.all([
    prisma.interview.findMany({
      where: {
        userId,
        OR: [
          { company: { contains: query, mode: "insensitive" } },
          { role: { contains: query, mode: "insensitive" } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, company: true, role: true }
    }),
    prisma.resume.findMany({
      where: { userId, fileName: { contains: query, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fileName: true }
    }),
    prisma.goal.findMany({
      where: { userId, title: { contains: query, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, targetCount: true, currentCount: true }
    })
  ]);

  const results: SearchResult[] = [
    ...interviews.map((interview) => ({
      type: "interview" as const,
      id: interview.id,
      title: interview.role,
      subtitle: interview.company,
      href: `/dashboard/interviews/${interview.id}`
    })),
    ...resumes.map((resume) => ({
      type: "resume" as const,
      id: resume.id,
      title: resume.fileName,
      subtitle: "Resume",
      href: "/dashboard/resume"
    })),
    ...goals.map((goal) => ({
      type: "goal" as const,
      id: goal.id,
      title: goal.title,
      subtitle: `${goal.currentCount} of ${goal.targetCount}`,
      href: "/dashboard#goals"
    }))
  ];

  return NextResponse.json({ results });
}