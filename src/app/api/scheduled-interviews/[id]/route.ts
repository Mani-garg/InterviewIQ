import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const existing = await prisma.scheduledInterview.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Scheduled interview not found." },
      { status: 404 }
    );
  }

  await prisma.scheduledInterview.delete({ where: { id } });

  return NextResponse.json({ success: true });
}