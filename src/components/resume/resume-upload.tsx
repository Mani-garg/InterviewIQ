"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ParsedResumeSections, ResumeSectionKey } from "@/lib/resume-parser";

type UploadedResume = {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  sections: ParsedResumeSections;
};

const sectionLabels: Record<ResumeSectionKey, string> = {
  skills: "Skills",
  education: "Education",
  projects: "Projects",
  experience: "Experience"
};

function formatSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<UploadedResume | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseFile = useCallback((nextFile: File | undefined) => {
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf") {
      setError("Please choose a PDF resume.");
      return;
    }
    setError(null);
    setResume(null);
    setFile(nextFile);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(nextFile);
    });
  }, []);

  const sectionEntries = useMemo(() => Object.entries(resume?.sections ?? {}) as [ResumeSectionKey, string[]][], [resume]);

  async function uploadResume() {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/resumes", { method: "POST", body: formData });
    const payload = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(payload.error ?? "Resume upload failed.");
      return;
    }

    setResume(payload.resume);
  }

  return (
    <section id="resume-upload" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Resume upload</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Add your PDF resume</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Drag and drop a PDF, preview it, upload it to Supabase Storage, and review extracted resume sections.</p>
          </div>
          {file ? <Button variant="outline" onClick={() => inputRef.current?.click()}>Replace</Button> : null}
        </div>

        <div
          className={cn(
            "mt-6 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed p-6 text-center transition",
            isDragging ? "border-primary bg-primary/10" : "border-white/15 bg-white/[0.035] hover:border-primary/60 hover:bg-white/[0.055]"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary"><UploadCloud className="size-8" /></div>
          <p className="mt-5 text-lg font-semibold text-foreground">Drop your resume here</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">PDF files only. We store the document securely and save metadata plus extracted sections to PostgreSQL.</p>
          {file ? <p className="mt-4 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-foreground">{file.name} · {formatSize(file.size)}</p> : null}
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button disabled={!file || isUploading} onClick={uploadResume} className="sm:flex-1">
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {isUploading ? "Uploading and parsing..." : "Upload to Supabase"}
          </Button>
          {file ? <Button variant="outline" onClick={() => { setFile(null); setResume(null); setError(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}><X /> Clear</Button> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3"><FileText className="size-5 text-primary" /><h2 className="text-lg font-semibold">PDF preview</h2></div>
          <div className="mt-5 h-96 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            {previewUrl ? <iframe title="Resume PDF preview" src={previewUrl} className="h-full w-full" /> : <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">Choose a PDF to preview it here.</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
          <h2 className="text-lg font-semibold">Extracted sections</h2>
          <p className="mt-1 text-sm text-muted-foreground">Skills, education, projects, and experience appear after upload.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(sectionEntries.length ? sectionEntries : (Object.keys(sectionLabels) as ResumeSectionKey[]).map((key) => [key, []] as [ResumeSectionKey, string[]])).map(([key, items]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="font-semibold text-foreground">{sectionLabels[key]}</h3>
                {items.length ? <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{items.map((item, index) => <li key={`${key}-${index}`}>• {typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Waiting for extraction.</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}