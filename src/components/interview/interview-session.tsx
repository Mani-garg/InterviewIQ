"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Flag,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Radio,
  Save,
  Sparkles,
  Volume2,
  VolumeX,
  Wifi
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InterviewQuestion = {
  question: string;
  category: string;
  intent: string;
  strongAnswerSignals: string[];
  followUps: string[];
  resumeReference?: string;
};

type InitialAnswer = {
  questionIndex: number;
  answerText: string;
  score: number | null;
  feedback: string | null;
};

type InterviewSessionProps = {
  interview: {
    id: string;
    company: string;
    role: string;
    difficulty: string;
    questions: InterviewQuestion[];
    status: string;
    overallScore: number | null;
  };
  initialAnswers: InitialAnswer[];
};

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 55) return "text-primary";
  if (score >= 25) return "text-amber-300";
  return "text-red-300";
}

export function InterviewSession({ interview, initialAnswers }: InterviewSessionProps) {
  const storageKey = `interview-session:${interview.id}`;

  const initialAnswersByIndex = useMemo(() => {
    const map = new Map<number, InitialAnswer>();
    for (const answer of initialAnswers) map.set(answer.questionIndex, answer);
    return map;
  }, [initialAnswers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() =>
    interview.questions.map((_, index) => initialAnswersByIndex.get(index)?.answerText ?? "")
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [isHydrating, setIsHydrating] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoReadQuestions, setAutoReadQuestions] = useState(true);
  const [autoListenAfterQuestion, setAutoListenAfterQuestion] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);

  const autoListenRef = useRef(autoListenAfterQuestion);
  useEffect(() => {
    autoListenRef.current = autoListenAfterQuestion;
  }, [autoListenAfterQuestion]);

  const [isCompleted, setIsCompleted] = useState(interview.status === "completed");
  const [overallScore, setOverallScore] = useState<number | null>(interview.overallScore);
  const [results, setResults] = useState<InitialAnswer[]>(initialAnswers);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const currentQuestion = interview.questions[currentIndex];
  const answeredCount = answers.filter((answer) => answer.trim().length > 0).length;
  const progress = Math.round(((currentIndex + 1) / interview.questions.length) * 100);

  // Check TTS voice support
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTtsSupported(false);
      return;
    }
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Hydrate the timer/current-question position from a local draft (UI
  // convenience only - answer text itself comes from the server via props).
  useEffect(() => {
    if (isCompleted) {
      setIsHydrating(false);
      return;
    }
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { currentIndex?: number; elapsedSeconds?: number };
        setCurrentIndex(Math.min(parsed.currentIndex ?? 0, interview.questions.length - 1));
        setElapsedSeconds(parsed.elapsedSeconds ?? 0);
      } catch {
        // ignore malformed local draft
      }
    }
    setIsHydrating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCompleted) return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isCompleted]);

  useEffect(() => {
    if (isHydrating || isCompleted) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ currentIndex, elapsedSeconds, savedAt: new Date().toISOString() })
    );
  }, [currentIndex, elapsedSeconds, isHydrating, isCompleted, storageKey]);

  const saveAnswer = useCallback(
    async (questionIndex: number, answerText: string) => {
      setAutosaveStatus("saving");
      try {
        const response = await fetch(`/api/interviews/${interview.id}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionIndex, answerText })
        });
        if (!response.ok) throw new Error("save failed");
        setAutosaveStatus("saved");
      } catch {
        setAutosaveStatus("error");
      }
    },
    [interview.id]
  );

  // Debounced autosave of the answer currently being edited, persisted to
  // the server (not just localStorage) so it survives across devices/tabs.
  useEffect(() => {
    if (isHydrating || isCompleted) return;
    const timeout = window.setTimeout(() => {
      saveAnswer(currentIndex, answers[currentIndex] ?? "");
    }, 450);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentIndex, isHydrating, isCompleted]);

  useEffect(() => {
    if (isCompleted) return;
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .join(" ");

      if (!transcript) return;
      setAnswers((current) =>
        current.map((answer, index) =>
          index === currentIndex ? `${answer}${answer ? " " : ""}${transcript}`.trim() : answer
        )
      );
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [currentIndex, isCompleted]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    stopSpeaking();
    setHasUserInteracted(true);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(true);
    }
  }, [stopSpeaking]);

  const speakQuestion = useCallback((indexToSpeak: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const targetQuestion = interview.questions[indexToSpeak];
    if (!targetQuestion) return;

    // Pause mic while agent speaks so it doesn't transcribe itself
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    window.speechSynthesis.cancel();

    const resumeContext = targetQuestion.resumeReference
      ? `Regarding your experience with ${targetQuestion.resumeReference}. `
      : "";
    const speechText = `Question ${indexToSpeak + 1}. ${resumeContext}${targetQuestion.question}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("US") ||
            v.name.includes("English"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-start microphone if enabled
      if (autoListenRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          setIsListening(true);
        }
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [interview.questions]);

  const speakCurrentQuestion = useCallback(() => {
    speakQuestion(currentIndex);
  }, [speakQuestion, currentIndex]);

  // Auto-read question on question transition once user has interacted
  useEffect(() => {
    if (isCompleted || isHydrating) return;
    if (autoReadQuestions && hasUserInteracted) {
      const timer = window.setTimeout(() => {
        speakQuestion(currentIndex);
      }, 350);
      return () => {
        window.clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentIndex, autoReadQuestions, hasUserInteracted, isCompleted, isHydrating, speakQuestion, stopSpeaking]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const autosaveLabel = useMemo(() => {
    if (isHydrating) return "Loading draft...";
    if (autosaveStatus === "saving") return "Autosaving...";
    if (autosaveStatus === "saved") return "Draft saved";
    if (autosaveStatus === "error") return "Save failed - will retry";
    return "Autosave ready";
  }, [autosaveStatus, isHydrating]);

  function updateAnswer(value: string) {
    setAnswers((current) => current.map((answer, index) => (index === currentIndex ? value : answer)));
  }

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  async function finishInterview() {
    stopSpeaking();
    stopListening();
    setIsFinishing(true);
    setFinishError(null);

    try {
      const response = await fetch(`/api/interviews/${interview.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answers.map((answerText, questionIndex) => ({ questionIndex, answerText }))
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setFinishError(payload.error ?? "Could not finish this interview.");
        setIsFinishing(false);
        return;
      }

      type FinishedAnswer = { questionIndex: number; answerText: string; score: number | null; feedback: string | null };
      setResults(
        (payload.answers as FinishedAnswer[]).map((answer) => ({
          questionIndex: answer.questionIndex,
          answerText: answer.answerText,
          score: answer.score,
          feedback: answer.feedback
        }))
      );
      setOverallScore(payload.interview.overallScore ?? null);
      setIsCompleted(true);
      window.localStorage.removeItem(storageKey);
    } catch {
      setFinishError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsFinishing(false);
    }
  }

  if (isCompleted) {
    const resultsByIndex = new Map(results.map((result) => [result.questionIndex, result]));

    return (
      <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-5">
          <Button asChild variant="ghost" className="-ml-3">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" /> Back to dashboard
            </Link>
          </Button>

          <div className="rounded-3xl border border-white/10 bg-card/70 p-6 shadow-2xl shadow-black/20">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Interview complete</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {interview.role} at {interview.company}
            </h1>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
                <span className={cn("text-2xl font-semibold", overallScore !== null ? scoreTone(overallScore) : "text-foreground")}>
                  {overallScore ?? "-"}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">Overall score</p>
                <p className="text-sm text-muted-foreground">Heuristic score based on answer depth and coverage of key signals.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {interview.questions.map((question, index) => {
              const result = resultsByIndex.get(index);
              return (
                <div key={`${question.question}-${index}`} className="rounded-3xl border border-white/10 bg-card/70 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-primary">{question.category}</span>
                        {question.resumeReference ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <FileText className="size-3" />
                            {question.resumeReference}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-lg font-semibold leading-7 text-foreground">{question.question}</p>
                    </div>
                    {result?.score !== null && result?.score !== undefined ? (
                      <span className={cn("shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-sm font-semibold", scoreTone(result.score))}>
                        {result.score}/100
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-white/[0.035] p-4 text-sm leading-6 text-muted-foreground">
                    {result?.answerText?.trim() ? result.answerText : "No answer was recorded."}
                  </p>
                  {result?.feedback ? (
                    <p className="mt-3 flex gap-2 text-sm leading-6 text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {result.feedback}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 -ml-3">
              <Link href="/dashboard"><ArrowLeft className="size-4" /> Back to dashboard</Link>
            </Button>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Interview session</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{interview.role} at {interview.company}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{interview.difficulty} · {answeredCount} of {interview.questions.length} answered</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-96">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Clock3 className="mb-2 size-4 text-primary" /><p className="text-2xl font-semibold">{formatDuration(elapsedSeconds)}</p><p className="text-xs text-muted-foreground">Timer</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Wifi className="mb-2 size-4 text-primary" /><p className="text-sm font-semibold">{autosaveLabel}</p><p className="text-xs text-muted-foreground">Synced to your account</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl font-semibold">{progress}%</p><p className="text-xs text-muted-foreground">Progress</p></div>
          </div>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/10" aria-label={`${progress}% through interview`}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-card/70 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Questions</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {interview.questions.map((question, index) => (
                <button
                  key={`${question.question}-${index}`}
                  onClick={() => {
                    setConfirmingFinish(false);
                    stopSpeaking();
                    setHasUserInteracted(true);
                    setCurrentIndex(index);
                  }}
                  className={cn("rounded-2xl border p-3 text-left text-sm transition", index === currentIndex ? "border-primary/50 bg-primary/10 text-foreground" : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground")}
                >
                  <span className="font-semibold">Question {index + 1}</span>
                  <span className="mt-1 block truncate">{question.category}</span>
                  {answers[index]?.trim() ? <span className="mt-1 flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 className="size-3" /> Answered</span> : null}
                </button>
              ))}
            </div>
            <Button
              type="button"
              className="mt-4 w-full"
              variant={confirmingFinish ? "default" : "outline"}
              disabled={isFinishing}
              onClick={() => {
                if (!confirmingFinish) {
                  setConfirmingFinish(true);
                  return;
                }
                void finishInterview();
              }}
            >
              {isFinishing ? <Loader2 className="animate-spin" /> : <Flag />}
              {isFinishing ? "Scoring..." : confirmingFinish ? "Confirm finish" : "Finish interview"}
            </Button>
            {confirmingFinish && !isFinishing ? (
              <p className="mt-2 text-xs text-muted-foreground">
                This scores your answers and locks the interview. <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => setConfirmingFinish(false)}>Cancel</button>
              </p>
            ) : null}
            {finishError ? <p className="mt-2 text-xs text-red-300">{finishError}</p> : null}
          </aside>

          <article className="rounded-3xl border border-white/10 bg-card/70 p-5 shadow-2xl shadow-black/20">
            {isHydrating ? <div className="flex min-h-96 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Loading session...</div> : (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{currentQuestion.category}</span>
                      {currentQuestion.resumeReference ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                          <FileText className="size-3.5" />
                          {currentQuestion.resumeReference}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold leading-9 text-foreground">{currentQuestion.question}</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">{currentIndex + 1}/{interview.questions.length}</span>
                </div>

                {/* AI Voice Interviewer Agent Bar */}
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                    isSpeaking
                      ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                      : isListening
                        ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                        : "border-white/10 bg-white/[0.03]"
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          "relative flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                          isSpeaking
                            ? "border-primary/60 bg-primary/20 text-primary shadow-md shadow-primary/30"
                            : isListening
                              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/30 animate-pulse"
                              : "border-white/10 bg-white/[0.05] text-primary"
                        )}
                      >
                        {isSpeaking ? (
                          <Volume2 className="size-6 animate-pulse" />
                        ) : isListening ? (
                          <Mic className="size-6 text-emerald-400" />
                        ) : (
                          <Bot className="size-6" />
                        )}
                        {(isSpeaking || isListening) && (
                          <span className="absolute -top-1 -right-1 flex size-3">
                            <span
                              className={cn(
                                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                                isSpeaking ? "bg-primary" : "bg-emerald-400"
                              )}
                            />
                            <span
                              className={cn(
                                "relative inline-flex size-3 rounded-full",
                                isSpeaking ? "bg-primary" : "bg-emerald-400"
                              )}
                            />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">AI Voice Interviewer</p>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
                              isSpeaking
                                ? "bg-primary/20 text-primary"
                                : isListening
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-white/[0.08] text-muted-foreground"
                            )}
                          >
                            {isSpeaking ? "Speaking Question..." : isListening ? "Listening to Answer..." : "Ready"}
                          </span>
                        </div>

                        {isSpeaking ? (
                          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-primary">
                            <div className="flex h-3 items-end gap-1">
                              <span className="h-3 w-1 animate-pulse rounded-full bg-primary" />
                              <span className="h-2 w-1 animate-pulse rounded-full bg-primary" />
                              <span className="h-3.5 w-1 animate-pulse rounded-full bg-primary" />
                              <span className="h-2.5 w-1 animate-pulse rounded-full bg-primary" />
                            </div>
                            <span>Asking question aloud...</span>
                          </div>
                        ) : isListening ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                            <Radio className="size-3.5 animate-pulse" />
                            Listening... Speak clearly to answer. Transcribing in real time below.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Listen to questions spoken aloud and dictate your answers hands-free.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isSpeaking ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                          onClick={stopSpeaking}
                        >
                          <VolumeX className="mr-1.5 size-4" /> Stop Voice
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={!ttsSupported}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => {
                            setHasUserInteracted(true);
                            speakCurrentQuestion();
                          }}
                        >
                          <Volume2 className="mr-1.5 size-4" /> Ask Question Aloud
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "text-xs transition",
                          autoReadQuestions ? "bg-white/[0.08] font-semibold text-foreground" : "text-muted-foreground"
                        )}
                        onClick={() => {
                          setHasUserInteracted(true);
                          setAutoReadQuestions((prev) => !prev);
                        }}
                        title="Automatically read each new question aloud when you navigate"
                      >
                        <Headphones className="mr-1.5 size-3.5 text-primary" />
                        Auto-read: {autoReadQuestions ? "ON" : "OFF"}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "text-xs transition",
                          autoListenAfterQuestion
                            ? "border border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-400"
                            : "text-muted-foreground"
                        )}
                        onClick={() => {
                          setHasUserInteracted(true);
                          setAutoListenAfterQuestion((prev) => !prev);
                        }}
                        title="Automatically start microphone when the interviewer finishes speaking the question"
                      >
                        <Sparkles className="mr-1.5 size-3.5 text-emerald-400" />
                        Auto-mic: {autoListenAfterQuestion ? "ON" : "OFF"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2"><div className="rounded-2xl bg-white/[0.035] p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Intent</p><p className="mt-2 text-sm leading-6">{currentQuestion.intent}</p></div><div className="rounded-2xl bg-white/[0.035] p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Follow-ups</p><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{currentQuestion.followUps.map((followUp) => <li key={followUp}>• {followUp}</li>)}</ul></div></div>

                <label className="block"><span className="text-sm font-semibold text-foreground">Your answer</span><textarea value={answers[currentIndex]} onChange={(event) => updateAnswer(event.target.value)} placeholder="Type your structured answer here. It autosaves as you write." className="mt-3 min-h-64 w-full resize-y rounded-3xl border border-white/10 bg-background/70 p-4 text-sm leading-6 outline-none transition focus:border-primary/60" /></label>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant={isListening ? "default" : "outline"}
                      className={cn(
                        "transition-all",
                        isListening
                          ? "border-emerald-500/60 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500"
                          : ""
                      )}
                      onClick={toggleVoice}
                      disabled={!voiceSupported}
                    >
                      {isListening ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                      {isListening ? "Stop voice dictation" : "Voice answer (Mic)"}
                    </Button>
                    {isListening && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <Radio className="size-3.5 animate-pulse" />
                        Recording answer...
                      </span>
                    )}
                    {!voiceSupported ? (
                      <p className="text-xs text-muted-foreground">Voice dictation is unavailable in this browser.</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={currentIndex === 0}
                      onClick={() => {
                        setConfirmingFinish(false);
                        stopSpeaking();
                        setHasUserInteracted(true);
                        setCurrentIndex((index) => Math.max(0, index - 1));
                      }}
                    >
                      <ChevronLeft /> Previous
                    </Button>
                    <Button
                      type="button"
                      disabled={currentIndex === interview.questions.length - 1}
                      onClick={() => {
                        setConfirmingFinish(false);
                        stopSpeaking();
                        setHasUserInteracted(true);
                        setCurrentIndex((index) => Math.min(interview.questions.length - 1, index + 1));
                      }}
                    >
                      Next <ChevronRight />
                    </Button>
                  </div>
                </div>

                <p className="flex items-center gap-2 text-xs text-muted-foreground"><Save className="size-3.5" /> {autosaveLabel}</p>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}