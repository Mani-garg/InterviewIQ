const pdfParse = require("pdf-parse");

export type ResumeSectionKey =
  | "skills"
  | "education"
  | "projects"
  | "experience";

export type ParsedResumeSections = Record<ResumeSectionKey, string[]>;

/**
 * Extract plain text from PDF
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const data = await pdfParse(buffer);

  return data.text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Fallback parser.
 * Gemini will replace this later,
 * but this keeps the UI working if AI fails.
 */

const HEADINGS = {
  skills: [
    "skills",
    "technical skills",
    "core skills",
    "technologies",
    "competencies",
  ],

  education: [
    "education",
    "academics",
    "academic background",
  ],

  projects: [
    "projects",
    "personal projects",
    "selected projects",
  ],

  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment",
  ],
};

export function parseResumeSections(
  text: string
): ParsedResumeSections {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ParsedResumeSections = {
    skills: [],
    education: [],
    projects: [],
    experience: [],
  };

  const keys = Object.keys(HEADINGS) as ResumeSectionKey[];

  function findHeading(line: string) {
    const cleaned = line.toLowerCase();

    return keys.find((key) =>
      HEADINGS[key].some((heading) =>
        cleaned.startsWith(heading)
      )
    );
  }

  let current: ResumeSectionKey | null = null;

  for (const line of lines) {
    const heading = findHeading(line);

    if (heading) {
      current = heading;
      continue;
    }

    if (!current) continue;

    if (result[current].length < 12) {
      result[current].push(line);
    }
  }

  return result;
}