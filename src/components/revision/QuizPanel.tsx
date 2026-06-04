"use client";

import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import { savePendingScore } from "@/lib/db/indexeddb";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/hooks";
import type { QuizQuestion } from "@/types";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface Props {
  questions: QuizQuestion[];
  courseId: string;
}

/**
 * Normalise une string pour la comparaison stricte :
 * - trim + minuscules
 * - retire UNIQUEMENT le préfixe de lettre isolé "A. " "B) " "a- " etc.
 */
function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    // Retire un préfixe de type "A. " "B) " "c- " SEULEMENT si c'est une lettre seule suivie de ponctuation
    .replace(/^([a-d])[.):\-]\s+/i, "")
    .replace(/\s+/g, " ");
}

/**
 * Comparaison stricte : deux réponses sont égales seulement si
 * leur forme normalisée est IDENTIQUE (pas de includes pour éviter les faux positifs)
 */
function isCorrect(selected: string, correct: string): boolean {
  const sel = normalize(selected);
  const cor = normalize(correct);
  return sel === cor;
}

export default function QuizPanel({ questions, courseId }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean }>>({});
  const isOnline = useOnlineStatus();

  const q = questions[current];
  const options = q.options ?? (q.type === "true_false" ? ["Vrai", "Faux"] : []);

  const confirm = () => {
    if (!selected) return;
    const correct = isCorrect(selected, q.correct_answer);
    if (correct) setScore((s) => s + 1);
    setAnswers((prev) => ({ ...prev, [q.id]: { answer: selected, correct } }));
    setConfirmed(true);
  };

  const next = async () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    } else {
      setFinished(true);
      await saveScore();
    }
  };

  const saveScore = async () => {
    const scoreObj = {
      id: `quiz_${courseId}_${Date.now()}`,
      courseId,
      mode: "quiz" as const,
      score,
      total: questions.length,
      feedback: null,
      createdAt: new Date().toISOString(),
    };

    if (isOnline) {
      const supabase = createClient();
      await supabase.from("quiz_scores").insert({
        course_id: courseId,
        mode: "quiz",
        score,
        total: questions.length,
        synced: true,
      });
    } else {
      await savePendingScore(scoreObj);
      toast("Score sauvegardé hors-ligne", { icon: "📶" });
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setAnswers({});
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="card flex flex-col items-center text-center py-10 gap-4">
        <div className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "📈" : "📖"}</div>
        <div>
          <p className="font-display text-3xl font-bold text-slate-50">{pct}%</p>
          <p className="text-slate-400">{score}/{questions.length} bonnes réponses</p>
        </div>

        <div className="w-full space-y-2 mt-2 text-left">
          {questions.map((q) => {
            const a = answers[q.id];
            if (!a) return null;
            return (
              <div key={q.id}
                className={clsx(
                  "flex items-start gap-2 p-3 rounded-xl border text-sm",
                  a.correct
                    ? "bg-emerald-900/10 border-emerald-700/30"
                    : "bg-red-900/10 border-red-700/30"
                )}>
                {a.correct
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-slate-200 font-medium leading-snug">{q.question}</p>
                  {!a.correct && (
                    <p className="text-xs text-emerald-400 mt-1">✓ {q.correct_answer}</p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={restart} className="btn-secondary gap-2">
          <RotateCcw className="w-4 h-4" />
          Refaire le quiz
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-surface-800 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${(current / questions.length) * 100}%`,
              background: "linear-gradient(to right, #6366f1, #10b981)",
            }}
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {current + 1}/{questions.length}
        </span>
      </div>

      {/* Question */}
      <div>
        <span className="badge-brand text-xs mb-3 inline-block">
          {q.type === "mcq" ? "QCM" : "Vrai / Faux"}
        </span>
        <p className="font-display font-semibold text-slate-100 leading-relaxed">
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected === option;
          // Après confirmation : est-ce que CETTE option est la bonne ?
          const optionIsCorrect = confirmed && isCorrect(option, q.correct_answer);
          // Après confirmation : est-ce que j'ai sélectionné cette option ET elle est fausse ?
          const optionIsWrong = confirmed && isSelected && !isCorrect(option, q.correct_answer);

          let style: React.CSSProperties = {};
          let className = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ";

          if (optionIsCorrect) {
            className += "border-emerald-600/60 text-emerald-300";
            style = { backgroundColor: "rgba(16,185,129,0.15)" };
          } else if (optionIsWrong) {
            className += "border-red-600/60 text-red-300";
            style = { backgroundColor: "rgba(239,68,68,0.15)" };
          } else if (confirmed) {
            className += "border-surface-700 opacity-40";
          } else if (isSelected) {
            className += "border-indigo-500 text-indigo-300";
            style = { backgroundColor: "rgba(99,102,241,0.15)" };
          } else {
            className += "border-surface-700 text-slate-300 hover:border-indigo-600/50 hover:bg-indigo-900/10";
          }

          return (
            <button
              key={option}
              onClick={() => !confirmed && setSelected(option)}
              disabled={confirmed}
              className={className}
              style={style}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: optionIsCorrect ? "#10b981"
                      : optionIsWrong ? "#ef4444"
                      : isSelected && !confirmed ? "#6366f1"
                      : "#475569",
                    backgroundColor: optionIsCorrect ? "#10b981"
                      : optionIsWrong ? "#ef4444"
                      : isSelected && !confirmed ? "#6366f1"
                      : "transparent",
                  }}
                >
                  {(isSelected || optionIsCorrect) && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </span>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explication */}
      {confirmed && q.explanation && (
        <div className="p-3 rounded-xl border border-surface-700" style={{ backgroundColor: "#1e293b" }}>
          <p className="text-xs text-slate-400">
            <span className="text-indigo-400 font-medium">Explication : </span>
            {q.explanation}
          </p>
        </div>
      )}

      {/* Bouton action */}
      {!confirmed ? (
        <button onClick={confirm} disabled={!selected} className="btn-primary w-full">
          Valider ma réponse
        </button>
      ) : (
        <button onClick={next} className="btn-primary w-full gap-2">
          {current < questions.length - 1 ? "Question suivante" : "Voir les résultats"}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
