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
 * Extrait la lettre de préfixe d'une option : "A) Texte" → "a", "B. Texte" → "b"
 * Retourne null si pas de préfixe lettre
 */
function extractPrefix(str: string): string | null {
  const match = str.trim().match(/^([a-d])[.):\-\s]/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Vérifie si une option correspond à la correct_answer.
 * Gère tous les cas que l'IA peut générer :
 * - correct_answer = texte complet "Avoir un esprit sain..."
 * - correct_answer = lettre seule "B" ou "b"
 * - correct_answer = "B) Avoir un esprit sain..."
 */
function isCorrect(option: string, correctAnswer: string): boolean {
  const optNorm = option.trim().toLowerCase().replace(/[\u00A0\u200B\uFEFF]/g, "");
  const corNorm = correctAnswer.trim().toLowerCase().replace(/[\u00A0\u200B\uFEFF]/g, "");

  // 1. Égalité exacte (normalisée)
  if (optNorm === corNorm) return true;

  // 2. correct_answer est une lettre seule ("b", "B")
  //    → vérifier si l'option commence par cette lettre
  if (/^[a-d]$/i.test(correctAnswer.trim())) {
    const optPrefix = extractPrefix(option);
    if (optPrefix && optPrefix === corNorm) return true;
  }

  // 3. correct_answer commence par une lettre ("B) texte", "B. texte")
  //    → extraire la lettre de correct_answer et comparer avec le préfixe de l'option
  const corPrefix = extractPrefix(correctAnswer);
  if (corPrefix) {
    const optPrefix = extractPrefix(option);
    if (optPrefix && optPrefix === corPrefix) return true;

    // Aussi : comparer le texte sans préfixe
    const corText = corNorm.replace(/^[a-d][.):\-\s]+/i, "").trim();
    const optText = optNorm.replace(/^[a-d][.):\-\s]+/i, "").trim();
    if (corText && optText && corText === optText) return true;
  }

  // 4. Comparer sans les préfixes (texte pur)
  const optText = optNorm.replace(/^[a-d][.):\-\s]+/i, "").trim();
  const corText = corNorm.replace(/^[a-d][.):\-\s]+/i, "").trim();
  if (optText && corText && optText === corText) return true;

  return false;
}

export default function QuizPanel({ questions, courseId }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [userWasCorrect, setUserWasCorrect] = useState(false);
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
    setUserWasCorrect(correct);
    setAnswers((prev) => ({ ...prev, [q.id]: { answer: selected, correct } }));
    setConfirmed(true);
  };

  const next = async () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
      setUserWasCorrect(false);
    } else {
      setFinished(true);
      await saveScore();
    }
  };

  const saveScore = async () => {
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
      await savePendingScore({
        id: `quiz_${courseId}_${Date.now()}`,
        courseId,
        mode: "quiz",
        score,
        total: questions.length,
        feedback: null,
        createdAt: new Date().toISOString(),
      });
      toast("Score sauvegardé hors-ligne", { icon: "📶" });
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setUserWasCorrect(false);
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
              <div key={q.id} className={clsx(
                "flex items-start gap-2 p-3 rounded-xl border text-sm",
                a.correct ? "bg-emerald-900/10 border-emerald-700/30" : "bg-red-900/10 border-red-700/30"
              )}>
                {a.correct
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-slate-200 font-medium leading-snug">{q.question}</p>
                  {!a.correct && <p className="text-xs text-emerald-400 mt-1">✓ {q.correct_answer}</p>}
                  {q.explanation && <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={restart} className="btn-secondary gap-2">
          <RotateCcw className="w-4 h-4" /> Refaire le quiz
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: "#1e293b" }}>
          <div className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(current / questions.length) * 100}%`, background: "linear-gradient(to right, #6366f1, #10b981)" }} />
        </div>
        <span className="text-xs text-slate-400 font-mono">{current + 1}/{questions.length}</span>
      </div>

      {/* Question */}
      <div>
        <span className="badge-brand text-xs mb-3 inline-block">
          {q.type === "mcq" ? "QCM" : "Vrai / Faux"}
        </span>
        <p className="font-display font-semibold text-slate-100 leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected === option;
          const isTheCorrectAnswer = confirmed && optionMatchesCorrect(option, q.correct_answer);
          const isMyWrongAnswer = confirmed && isSelected && !userWasCorrect;

          let bgColor = "transparent";
          let borderColor = "#334155";
          let textColor = "#94a3b8";

          if (!confirmed) {
            if (isSelected) {
              bgColor = "rgba(99,102,241,0.15)";
              borderColor = "#6366f1";
              textColor = "#a5b4fc";
            }
          } else {
            if (isTheCorrectAnswer) {
              bgColor = "rgba(16,185,129,0.15)";
              borderColor = "#10b981";
              textColor = "#6ee7b7";
            } else if (isMyWrongAnswer) {
              bgColor = "rgba(239,68,68,0.15)";
              borderColor = "#ef4444";
              textColor = "#fca5a5";
            } else {
              borderColor = "#1e293b";
              textColor = "#475569";
            }
          }

          const dotColor = isTheCorrectAnswer ? "#10b981"
            : isMyWrongAnswer ? "#ef4444"
            : isSelected && !confirmed ? "#6366f1"
            : "#334155";
          const showDot = isSelected || isTheCorrectAnswer;

          return (
            <button
              key={option}
              onClick={() => !confirmed && setSelected(option)}
              disabled={confirmed}
              className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150"
              style={{ backgroundColor: bgColor, borderColor, color: textColor }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: dotColor, backgroundColor: showDot ? dotColor : "transparent" }}
                >
                  {showDot && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {confirmed && (
        <div className={clsx(
          "flex items-center gap-2 p-3 rounded-xl text-sm font-medium",
          userWasCorrect
            ? "border border-emerald-700/40 text-emerald-300"
            : "border border-red-700/40 text-red-300"
        )}
          style={{ backgroundColor: userWasCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
          {userWasCorrect
            ? <><CheckCircle className="w-4 h-4 flex-shrink-0" /> Bonne réponse !</>
            : <><XCircle className="w-4 h-4 flex-shrink-0" />
              <span>Mauvaise réponse — la bonne était : <strong className="text-emerald-400">{q.correct_answer}</strong></span></>
          }
        </div>
      )}

      {/* Explication */}
      {confirmed && q.explanation && (
        <div className="p-3 rounded-xl border border-surface-700" style={{ backgroundColor: "#1e293b" }}>
          <p className="text-xs text-slate-400">
            <span className="text-indigo-400 font-medium">Explication : </span>{q.explanation}
          </p>
        </div>
      )}

      {/* Bouton */}
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
