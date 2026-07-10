import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
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

  const resume = await prisma.resume.findFirst({
    where: { id, userId },
    select: { id: true, storageBucket: true, storagePath: true }
  });

  if (!resume) {
    return NextResponse.json(
      { error: "Resume not found." },
      { status: 404 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRole) {
    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false }
    });

    const storageDelete = await supabase.storage
      .from(resume.storageBucket)
      .remove([resume.storagePath]);

    // Storage cleanup is best-effort: an orphaned file in Supabase is
    // a lesser problem than blocking the user from deleting their
    // record because of an unrelated storage hiccup. Log and continue.
    if (storageDelete.error) {
      console.error("Failed to delete resume file from storage:", storageDelete.error);
    }
  }

  await prisma.resume.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}