import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

const createGoalSchema = z.object({
  title: z.string().trim().min(3).max(120),
  targetCount: z.coerce.number().int().min(1).max(1000)
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ goals });
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
  const parsed = createGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid goal. Provide a title and a target count." },
      { status: 400 }
    );
  }

  const { title, targetCount } = parsed.data;

  const goal = await prisma.goal.create({
    data: { userId, title, targetCount, currentCount: 0 }
  });

  await logActivity(userId, "goal_created", `New goal set: "${title}".`);

  return NextResponse.json({ goal });
}