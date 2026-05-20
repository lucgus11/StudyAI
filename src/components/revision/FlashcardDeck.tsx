"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Check, X } from "lucide-react";
import { savePendingScore } from "@/lib/db/indexeddb";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/hooks";
import type { Flashcard } from "@/types";
import toast from "react-hot-toast";

interface Props {
  flashcards: Flashcard[];
  courseId: string;
}

export default function FlashcardDeck({ flashcards, courseId }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, "known" | "unknown">>({});
  const [finished, setFinished] = useState(false);
  const isOnline = useOnlineStatus();

  const current = flashcards[index];
  const progress = ((index) / flashcards.length) * 100;

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const next = useCallback(
    (result?: "known" | "unknown") => {
      if (result && current) {
        setResults((prev) => ({ ...prev, [current.id]: result }));
      }
      setFlipped(false);
      setTimeout(() => {
        if (index < flashcards.length - 1) {
          setIndex((i) => i + 1);
        } else {
          setFinished(true);
          saveResults({ ...(result ? { [current.id]: result } : {}), ...results });
        }
      }, 150);
    },
    [index, flashcards.length, current, results]
  );

  const prev = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => Math.max(0, i - 1)), 150);
  }, []);

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setResults({});
    setFinished(false);
  };

  const saveResults = async (finalResults: Record<string, "known" | "unknown">) => {
    const known = Object.values(finalResults).filter((v) => v === "known").length;
    const total = flashcards.length;
    const scoreObj = {
      id: `fc_${courseId}_${Date.now()}`,
      courseId,
      mode: "flashcard" as const,
      score: known,
      total,
      feedback: null,
      createdAt: new Date().toISOString(),
    };

    if (isOnline) {
      const supabase = createClient();
      await supabase.from("quiz_scores").insert({
        course_id: scoreObj.courseId,
        mode: scoreObj.mode,
        score: scoreObj.score,
        total: scoreObj.total,
        synced: true,
      });
    } else {
      await savePendingScore(scoreObj);
      toast("Score sauvegardé — sera synchronisé à la reconnexion", { icon: "📶" });
    }
  };

  if (finished) {
    const known = Object.values(results).filter((v) => v === "known").length;
    const pct = Math.round((known / flashcards.length) * 100);

    return (
      <div className="card flex flex-col items-center text-center py-10 gap-4">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
        <div>
          <p className="font-display text-2xl font-bold text-slate-50">{pct}%</p>
          <p className="text-slate-400 text-sm">
            {known}/{flashcards.length} cartes maîtrisées
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={restart} className="btn-secondary gap-2">
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-surface-800 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-brand-500 to-accent-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {index + 1}/{flashcards.length}
        </span>
      </div>

      {/* Card */}
      <div className="perspective min-h-[240px] cursor-pointer" onClick={flip}>
        <div
          className={`preserve-3d relative w-full min-h-[240px] transition-transform duration-500 ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="backface-hidden absolute inset-0 card flex flex-col items-center justify-center p-8 text-center">
            <span className="badge-brand mb-4 text-xs">Question</span>
            <p className="font-display text-lg font-semibold text-slate-100 leading-relaxed">
              {current?.front}
            </p>
            <p className="text-xs text-slate-500 mt-6">Appuie pour révéler la réponse</p>
          </div>

          {/* Back */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 card bg-brand-950/50 border-brand-700/40 flex flex-col items-center justify-center p-8 text-center">
            <span className="badge-accent mb-4 text-xs">Réponse</span>
            <p className="text-slate-100 leading-relaxed">{current?.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={prev} disabled={index === 0} className="btn-ghost p-2.5">
          <ChevronLeft className="w-5 h-5" />
        </button>

        {flipped ? (
          <div className="flex gap-3 flex-1 justify-center">
            <button
              onClick={() => next("unknown")}
              className="btn-danger flex-1 max-w-[140px] gap-2"
            >
              <X className="w-4 h-4" />
              À revoir
            </button>
            <button
              onClick={() => next("known")}
              className="btn bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 text-sm flex-1 max-w-[140px] gap-2"
            >
              <Check className="w-4 h-4" />
              Connu
            </button>
          </div>
        ) : (
          <button onClick={() => next()} className="btn-secondary flex-1 max-w-[200px]">
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => next()}
          disabled={index >= flashcards.length - 1}
          className="btn-ghost p-2.5"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
