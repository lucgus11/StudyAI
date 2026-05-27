"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FlashcardDeck from "@/components/revision/FlashcardDeck";
import QuizPanel from "@/components/revision/QuizPanel";
import type { Flashcard, QuizQuestion } from "@/types";

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<{ id: string; title: string; subject: string; flashcards: Flashcard[]; quiz_questions: QuizQuestion[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("courses")
      .select("id, title, subject, flashcards, quiz_questions")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setCourse(data as typeof course);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (!course) return (
    <div className="card text-center py-16">
      <p className="text-slate-400">Cours introuvable.</p>
      <Link href="/dashboard/courses" className="btn-secondary mt-4 inline-flex">Retour</Link>
    </div>
  );

  const flashcards = Array.isArray(course.flashcards) ? course.flashcards as Flashcard[] : [];
  const questions = Array.isArray(course.quiz_questions) ? course.quiz_questions as QuizQuestion[] : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <Link href={`/dashboard/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="section-title leading-tight">Micro-Learning</h1>
            <p className="text-slate-400 text-sm">{course.title}</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-slate-200 mb-4">
          Flashcards <span className="text-slate-500 font-normal text-sm">({flashcards.length})</span>
        </h2>
        {flashcards.length > 0
          ? <FlashcardDeck flashcards={flashcards} courseId={course.id} />
          : <div className="card text-center py-10 text-slate-400">Aucune flashcard générée.</div>}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-slate-200 mb-4">
          Mini-Quiz <span className="text-slate-500 font-normal text-sm">({questions.length} questions)</span>
        </h2>
        {questions.length > 0
          ? <QuizPanel questions={questions} courseId={course.id} />
          : <div className="card text-center py-10 text-slate-400">Aucun quiz généré.</div>}
      </section>
    </div>
  );
}
