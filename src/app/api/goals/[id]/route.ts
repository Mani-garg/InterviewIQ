import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const updateGoalSchema = z.object({
  currentCount: z.coerce.number().int().min(0).max(1000)
});

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = updateGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update. Provide a currentCount." },
      { status: 400 }
    );
  }

  const existing = await prisma.goal.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const currentCount = Math.min(parsed.data.currentCount, existing.targetCount);

  const goal = await prisma.goal.update({
    where: { id },
    data: { currentCount }
  });

  if (currentCount >= existing.targetCount && existing.currentCount < existing.targetCount) {
    await logActivity(userId, "goal_updated", `Goal completed: "${existing.title}".`);
  }

  return NextResponse.json({ goal });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const existing = await prisma.goal.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}