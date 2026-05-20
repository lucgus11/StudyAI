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

export default function QuizPanel({ questions, courseId }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean }>>({});
  const isOnline = useOnlineStatus();

  const q = questions[current];

  const confirm = () => {
    if (!selected) return;
    const isCorrect = selected === q.correct_answer;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { answer: selected, correct: isCorrect },
    }));
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
    const total = questions.length;
    const finalScore = score + (answers[q.id] ? 0 : selected === q.correct_answer ? 1 : 0);

    const scoreObj = {
      id: `quiz_${courseId}_${Date.now()}`,
      courseId,
      mode: "quiz" as const,
      score: finalScore,
      total,
      feedback: null,
      createdAt: new Date().toISOString(),
    };

    if (isOnline) {
      const supabase = createClient();
      await supabase.from("quiz_scores").insert({
        course_id: scoreObj.courseId,
        mode: scoreObj.mode,
        score: finalScore,
        total,
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
          <p className="text-slate-400">
            {score}/{questions.length} bonnes réponses
          </p>
        </div>

        {/* Answer review */}
        <div className="w-full space-y-2 mt-2 text-left">
          {questions.map((q) => {
            const a = answers[q.id];
            if (!a) return null;
            return (
              <div
                key={q.id}
                className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
                  a.correct
                    ? "bg-accent-900/10 border-accent-700/30"
                    : "bg-danger-900/10 border-danger-700/30"
                }`}
              >
                {a.correct ? (
                  <CheckCircle className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-slate-200 font-medium leading-snug">{q.question}</p>
                  {!a.correct && (
                    <p className="text-xs text-accent-400 mt-1">
                      ✓ {q.correct_answer}
                    </p>
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

  const options = q.options ?? ["Vrai", "Faux"];

  return (
    <div className="card space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-surface-800 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-accent-500 to-brand-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((current) / questions.length) * 100}%` }}
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
          const isCorrect = option === q.correct_answer;

          let optionClass = "border-surface-700 hover:border-brand-600/50 hover:bg-brand-900/10";
          if (confirmed) {
            if (isCorrect) optionClass = "border-accent-600/60 bg-accent-900/20 text-accent-300";
            else if (isSelected && !isCorrect) optionClass = "border-danger-600/60 bg-danger-900/20 text-danger-300";
            else optionClass = "border-surface-700 opacity-50";
          } else if (isSelected) {
            optionClass = "border-brand-500 bg-brand-900/20 text-brand-300";
          }

          return (
            <button
              key={option}
              onClick={() => !confirmed && setSelected(option)}
              className={clsx(
                "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150",
                optionClass
              )}
              disabled={confirmed}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isSelected && !confirmed
                      ? "border-brand-400 bg-brand-400"
                      : confirmed && isCorrect
                      ? "border-accent-400 bg-accent-400"
                      : confirmed && isSelected && !isCorrect
                      ? "border-danger-400 bg-danger-400"
                      : "border-surface-600"
                  )}
                >
                  {(isSelected || (confirmed && isCorrect)) && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </span>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation after confirm */}
      {confirmed && q.explanation && (
        <div className="p-3 bg-surface-800 rounded-xl border border-surface-700">
          <p className="text-xs text-slate-400">
            <span className="text-brand-400 font-medium">Explication : </span>
            {q.explanation}
          </p>
        </div>
      )}

      {/* Action button */}
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
