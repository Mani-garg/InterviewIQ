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

  const interview = await prisma.interview.findFirst({
    where: { id, userId },
    select: { id: true }
  });

  if (!interview) {
    return NextResponse.json(
      { error: "Interview not found." },
      { status: 404 }
    );
  }

  // Answer rows cascade-delete automatically (see onDelete: Cascade
  // on Answer.interview in schema.prisma), so no manual cleanup needed.
  await prisma.interview.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}