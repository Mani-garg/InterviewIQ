import { extractText, getDocumentProxy } from "unpdf";

export type ResumeSectionKey =
  | "skills"
  | "education"
  | "projects"
  | "experience";

export type ParsedResumeSections = Record<ResumeSectionKey, string[]>;

const SECTION_KEYS: ResumeSectionKey[] = [
  "skills",
  "education",
  "projects",
  "experience",
];

/**
 * Turn a single arbitrary item (string, number, or object, as returned
 * by an LLM that wasn't given a strict schema) into a readable one-line
 * string. Objects are flattened into "key: value" pairs joined by " · ".
 */
function stringifySectionItem(item: unknown): string | null {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed.length ? trimmed : null;
  }

  if (typeof item === "number" || typeof item === "boolean") {
    return String(item);
  }

  if (item && typeof item === "object") {
    const parts = Object.values(item as Record<string, unknown>)
      .filter((value) => typeof value === "string" || typeof value === "number")
      .map((value) => String(value).trim())
      .filter(Boolean);

    return parts.length ? parts.join(" · ") : null;
  }

  return null;
}

/**
 * Guarantees the Record<ResumeSectionKey, string[]> shape regardless of
 * what an upstream source (e.g. an LLM with no enforced schema) actually
 * returned. Without this, rendering can crash or produce duplicate React
 * keys when a section item turns out to be an object instead of a string.
 */
export function normalizeSections(raw: unknown): ParsedResumeSections {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const result = {} as ParsedResumeSections;

  for (const key of SECTION_KEYS) {
    const value = source[key];
    const list = Array.isArray(value) ? value : [];

    result[key] = list
      .map(stringifySectionItem)
      .filter((item): item is string => item !== null)
      .slice(0, 12);
  }

  return result;
}

/**
 * Extract plain text from PDF
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());

  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });

  return text
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