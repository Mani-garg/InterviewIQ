export type ResumeSectionKey = "skills" | "education" | "projects" | "experience";

export type ParsedResumeSections = Record<ResumeSectionKey, string[]>;

const SECTION_LABELS: Record<ResumeSectionKey, string[]> = {
  skills: ["skills", "technical skills", "core skills", "competencies"],
  education: ["education", "academic background", "academics"],
  projects: ["projects", "selected projects", "portfolio"],
  experience: ["experience", "work experience", "professional experience", "employment"]
};

const orderedKeys = Object.keys(SECTION_LABELS) as ResumeSectionKey[];

function normalizePdfText(value: string) {
  return value
    .replace(/\\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\(([^)]{2,})\)\s*Tj/g, "$1\n")
    .replace(/\[([^\]]+)\]\s*TJ/g, "$1\n")
    .replace(/<([0-9A-Fa-f]{4,})>\s*Tj/g, " ")
    .replace(/\\([()\\])/g, "$1")
    .replace(/[\u0000-\u001f\u007f]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromPdf(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const binary = buffer.toString("latin1");
  return normalizePdfText(binary);
}

function findSectionStart(lines: string[], labels: string[]) {
  return lines.findIndex((line) => {
    const normalized = line.toLowerCase().replace(/[^a-z ]/g, "").trim();
    return labels.some((label) => normalized === label || normalized.startsWith(`${label} `));
  });
}

export function parseResumeSections(text: string): ParsedResumeSections {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const starts = orderedKeys
    .map((key) => ({ key, index: findSectionStart(lines, SECTION_LABELS[key]) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index);

  return orderedKeys.reduce<ParsedResumeSections>((sections, key) => {
    const current = starts.find((entry) => entry.key === key);
    if (!current) {
      sections[key] = [];
      return sections;
    }

    const next = starts.find((entry) => entry.index > current.index);
    const content = lines.slice(current.index + 1, next?.index ?? current.index + 9).slice(0, 8);
    sections[key] = content.length ? content : ["Section detected. Review extracted PDF text for details."];
    return sections;
  }, { skills: [], education: [], projects: [], experience: [] });
}
