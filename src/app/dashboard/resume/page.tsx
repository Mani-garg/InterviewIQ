import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

import { ResumeUpload } from "@/components/resume/resume-upload";
import { ResumeHistoryList } from "@/components/resume/resume-history-list";
import { prisma } from "@/lib/prisma";
import type { ParsedResumeSections } from "@/lib/resume-parser";

export default async function ResumePage() {
  const user = await currentUser();
  const userId = user?.id;

  const resumes = userId
    ? await prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          createdAt: true,
          sections: true
        }
      })
    : [];

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a new PDF resume and review, or delete, everything you&apos;ve uploaded before.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <ResumeUpload />
          <ResumeHistoryList
            resumes={resumes.map((resume) => ({
              id: resume.id,
              fileName: resume.fileName,
              fileSize: resume.fileSize,
              createdAt: resume.createdAt.toISOString(),
              sections: resume.sections as unknown as ParsedResumeSections
            }))}
          />
        </div>
      </div>
    </main>
  );
}