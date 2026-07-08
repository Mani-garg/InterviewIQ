import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  extractTextFromPdf,
  parseResumeSections,
} from "@/lib/resume-parser";

const bucketName =
  process.env.SUPABASE_STORAGE_BUCKET ?? "interviewiq";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        error: "You must be signed in to upload a resume.",
      },
      {
        status: 401,
      }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: "Upload a PDF resume.",
      },
      {
        status: 400,
      }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      {
        error: "Only PDF resumes are supported.",
      },
      {
        status: 400,
      }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json(
      {
        error: "Supabase is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRole,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  const storagePath =
    `${userId}/${crypto.randomUUID()}-${file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )}`;

  const upload = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (upload.error) {
    return NextResponse.json(
      {
        error: upload.error.message,
      },
      {
        status: 500,
      }
    );
  }

  //--------------------------------------------------
  // Extract PDF Text
  //--------------------------------------------------

  let extractedText = "";

  try {
    extractedText = await extractTextFromPdf(file);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Failed to read PDF.",
      },
      {
        status: 500,
      }
    );
  }

  //--------------------------------------------------
  // Gemini Extraction
  //--------------------------------------------------

  let sections;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const prompt = `
You are an ATS Resume Parser.

Extract the following sections.

Return ONLY JSON.

{
  "skills": [],
  "education": [],
  "projects": [],
  "experience": []
}

Resume:

${extractedText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const cleaned = response.text
      ?.replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    sections = JSON.parse(cleaned || "{}");
  } catch (error) {
    console.error("Gemini failed.");

    console.error(error);

    //--------------------------------------------------
    // fallback parser
    //--------------------------------------------------

    sections = parseResumeSections(extractedText);
  }

  //--------------------------------------------------
  // Save
  //--------------------------------------------------

  const resume = await prisma.resume.create({
    data: {
      userId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageBucket: bucketName,
      storagePath,
      extractedText,
      sections,
    },
  });

  return NextResponse.json({
    resume,
  });
}