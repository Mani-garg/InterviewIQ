import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { extractTextFromPdf, parseResumeSections } from "@/lib/resume-parser";

const bucketName = process.env.SUPABASE_RESUME_BUCKET ?? "resumes";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to upload a resume." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a PDF resume file." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF resumes are supported." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
  const storagePath = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const upload = await supabase.storage.from(bucketName).upload(storagePath, file, {
    contentType: file.type,
    upsert: false
  });

  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const extractedText = await extractTextFromPdf(file);
  const sections = parseResumeSections(extractedText);

  const resume = await prisma.resume.create({
    data: {
      userId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageBucket: bucketName,
      storagePath,
      extractedText,
      sections
    }
  });

  return NextResponse.json({ resume });
}
