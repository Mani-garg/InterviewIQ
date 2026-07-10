import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

const createScheduledInterviewSchema = z.object({
  company: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  type: z.string().trim().min(2).max(60),
  scheduledAt: z.coerce.date()
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const scheduledInterviews = await prisma.scheduledInterview.findMany({
    where: { userId, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 5
  });

  return NextResponse.json({ scheduledInterviews });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = createScheduledInterviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scheduled interview details." },
      { status: 400 }
    );
  }

  const { company, role, type, scheduledAt } = parsed.data;

  const scheduledInterview = await prisma.scheduledInterview.create({
    data: { userId, company, role, type, scheduledAt }
  });

  await logActivity(
    userId,
    "interview_scheduled",
    `Scheduled a ${type.toLowerCase()} with ${company} for the ${role} role.`
  );

  return NextResponse.json({ scheduledInterview });
}