/**
 * Heuristic answer scoring.
 *
 * This is intentionally not AI-based yet (see roadmap P1 -> P3). It gives a
 * defensible 0-100 score from two signals that don't require another network
 * call: how developed the answer is (length, as a proxy for depth) and how
 * much it overlaps with the "strong answer signal" keywords the question was
 * generated with. Swap this out for an LLM-graded rubric later without
 * touching any callers - they only depend on { score, feedback }.
 */

export type AnswerScore = {
  score: number;
  feedback: string;
};

const STOPWORD_MIN_LENGTH = 5;

function extractKeywords(signal: string): string[] {
  return signal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= STOPWORD_MIN_LENGTH);
}

export function scoreAnswer(answerText: string, strongAnswerSignals: string[]): AnswerScore {
  const trimmed = answerText.trim();

  if (!trimmed) {
    return { score: 0, feedback: "No answer was recorded for this question." };
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const depthScore = Math.min(40, Math.round((wordCount / 120) * 40));

  const lowerAnswer = trimmed.toLowerCase();
  const matchedSignals = strongAnswerSignals.filter((signal) => {
    const keywords = extractKeywords(signal);
    return keywords.length > 0 && keywords.some((word) => lowerAnswer.includes(word));
  });

  const coverageScore = strongAnswerSignals.length
    ? Math.round((matchedSignals.length / strongAnswerSignals.length) * 60)
    : 30;

  const score = Math.max(0, Math.min(100, depthScore + coverageScore));

  let feedback: string;
  if (score >= 80) {
    feedback = "Strong, well-developed answer that hits several of the key signals interviewers look for.";
  } else if (score >= 55) {
    feedback = "Solid start. Add more specifics or a concrete example to make this land harder.";
  } else if (score >= 25) {
    feedback = "This answer is thin. Try structuring it around a clear situation, action, and result.";
  } else {
    feedback = "This answer needs significant expansion before it would hold up in a real interview.";
  }

  return { score, feedback };
}

export function scoreOverall(scores: number[]): number | null {
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}