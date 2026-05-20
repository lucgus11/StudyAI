"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, Play, Loader2, CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import type { ExamQuestion } from "@/types";

interface Props {
  courseId: string;
  courseTitle: string;
}

type Phase = "setup" | "loading" | "running" | "submitting" | "results";

interface FeedbackItem {
  id: string;
  correct: boolean;
  feedback: string;
}

interface Results {
  score: number;
  total: number;
  percentage: number;
  globalFeedback: string;
  questionFeedbacks: FeedbackItem[];
}

export default function ExamPanel({ courseId, courseTitle }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (phase !== "running") return;
    setTimeLeft(duration * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          submitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const generateExam = async () => {
    setPhase("loading");
    try {
      const res = await fetch(`/api/courses/${courseId}/exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
      setAnswers({});
      setPhase("running");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de génération");
      setPhase("setup");
    }
  };

  const submitExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");
    try {
      const res = await fetch(`/api/courses/${courseId}/exam/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setPhase("results");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la correction");
      setPhase("running");
    }
  }, [courseId, questions, answers]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timeRatio = questions.length > 0 ? timeLeft / (duration * 60) : 1;
  const timerColor = timeRatio > 0.5 ? "text-accent-400" : timeRatio > 0.2 ? "text-warn-400" : "text-danger-400";

  // ---- SETUP PHASE ----
  if (phase === "setup") {
    return (
      <div className="card max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="font-display text-xl font-bold text-slate-50">Prêt pour le Crash Test ?</h2>
          <p className="text-slate-400 text-sm mt-1">
            L&apos;IA va générer un examen blanc basé sur <strong className="text-slate-300">{courseTitle}</strong>.
          </p>
        </div>

        <div>
          <label className="label">Durée de l&apos;examen</label>
          <div className="grid grid-cols-3 gap-2">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={clsx(
                  "py-3 rounded-xl border text-sm font-semibold transition-all",
                  duration === d
                    ? "border-brand-500 bg-brand-900/30 text-brand-300"
                    : "border-surface-700 text-slate-400 hover:border-surface-600"
                )}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-800 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-slate-300">Ce qui vous attend :</p>
          <ul className="space-y-1.5">
            {[
              `~${Math.floor(duration / 6)} questions générées par l'IA`,
              "Mélange de QCM, Vrai/Faux et questions ouvertes",
              "Chronomètre automatique",
              "Correction détaillée et score final",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={generateExam} className="btn-primary w-full gap-2">
          <Play className="w-4 h-4" />
          Générer et démarrer l&apos;examen
        </button>
      </div>
    );
  }

  // ---- LOADING PHASE ----
  if (phase === "loading") {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="font-display text-lg font-semibold text-slate-200">
          L&apos;IA prépare ton examen…
        </p>
        <p className="text-slate-400 text-sm">Génération des questions en cours (30s max)</p>
      </div>
    );
  }

  // ---- SUBMITTING PHASE ----
  if (phase === "submitting") {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-accent-400 animate-spin" />
        <p className="font-display text-lg font-semibold text-slate-200">
          Correction en cours…
        </p>
        <p className="text-slate-400 text-sm">L&apos;IA analyse tes réponses</p>
      </div>
    );
  }

  // ---- RESULTS PHASE ----
  if (phase === "results" && results) {
    return (
      <div className="space-y-6">
        {/* Score card */}
        <div className="card text-center py-8">
          <div className="text-5xl mb-3">
            {results.percentage >= 80 ? "🏆" : results.percentage >= 50 ? "📈" : "📚"}
          </div>
          <p className="font-display text-4xl font-bold text-slate-50">
            {results.score}/{results.total}
          </p>
          <p className="text-slate-400 mt-1">{results.percentage}% de réussite</p>

          <div
            className="mt-5 text-sm text-slate-300 text-left bg-surface-800 rounded-xl p-4 border border-surface-700"
            dangerouslySetInnerHTML={{ __html: results.globalFeedback }}
          />

          <button
            onClick={() => setPhase("setup")}
            className="btn-secondary mt-6 mx-auto gap-2"
          >
            Refaire un examen
          </button>
        </div>

        {/* Per-question feedback */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-slate-200">Correction détaillée</h3>
          {questions.map((q) => {
            const fb = results.questionFeedbacks.find((f) => f.id === q.id);
            return (
              <div
                key={q.id}
                className={clsx(
                  "p-4 rounded-xl border space-y-2",
                  fb?.correct
                    ? "bg-accent-900/10 border-accent-700/30"
                    : "bg-danger-900/10 border-danger-700/30"
                )}
              >
                <div className="flex items-start gap-2">
                  {fb?.correct ? (
                    <CheckCircle className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm font-medium text-slate-100 flex-1">{q.question}</p>
                  <span className="text-xs text-slate-500 flex-shrink-0">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                </div>
                <div className="pl-6 space-y-1">
                  {answers[q.id] && (
                    <p className="text-xs text-slate-400">
                      <span className="text-slate-500">Ta réponse : </span>
                      {answers[q.id]}
                    </p>
                  )}
                  {!fb?.correct && (
                    <p className="text-xs text-accent-400">
                      <span className="text-slate-500">Bonne réponse : </span>
                      {q.correct_answer}
                    </p>
                  )}
                  {fb?.feedback && (
                    <p className="text-xs text-slate-400 italic">{fb.feedback}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- RUNNING PHASE ----
  return (
    <div className="space-y-4">
      {/* Timer bar */}
      <div className="card flex items-center gap-4 py-3">
        <Timer className={clsx("w-5 h-5 flex-shrink-0", timerColor)} />
        <div className="flex-1 bg-surface-800 rounded-full h-2">
          <div
            className={clsx(
              "h-2 rounded-full transition-all duration-1000",
              timeRatio > 0.5 ? "bg-accent-500" : timeRatio > 0.2 ? "bg-warn-500" : "bg-danger-500"
            )}
            style={{ width: `${timeRatio * 100}%` }}
          />
        </div>
        <span className={clsx("font-mono font-bold text-lg flex-shrink-0", timerColor)}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const options = q.options ?? (q.type === "true_false" ? ["Vrai", "Faux"] : []);
          return (
            <div key={q.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="bg-brand-900/50 text-brand-300 border border-brand-700/50 text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
                    Q{idx + 1}
                  </span>
                  <p className="font-medium text-slate-100 text-sm leading-relaxed">{q.question}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{q.points}pt</span>
              </div>

              {options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 pl-8">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className={clsx(
                        "text-left px-3 py-2.5 rounded-xl border text-sm transition-all",
                        answers[q.id] === opt
                          ? "border-brand-500 bg-brand-900/30 text-brand-300"
                          : "border-surface-700 text-slate-400 hover:border-surface-600 hover:text-slate-200"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Rédigez votre réponse…"
                  rows={3}
                  className="input ml-8 resize-none text-sm"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      <button
        onClick={submitExam}
        className="btn-primary w-full gap-2 py-3"
      >
        <CheckCircle className="w-4 h-4" />
        Rendre ma copie ({Object.keys(answers).length}/{questions.length} réponses)
      </button>
    </div>
  );
}
