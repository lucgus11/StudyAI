"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QuizPanel from "@/components/revision/QuizPanel";
import type { QuizQuestion } from "@/types";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<{ id: string; title: string; subject: string; quiz_questions: QuizQuestion[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("courses")
      .select("id, title, subject, quiz_questions")
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

  const questions = Array.isArray(course.quiz_questions) ? course.quiz_questions as QuizQuestion[] : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in max-w-2xl mx-auto">
      <div>
        <Link href={`/dashboard/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="section-title leading-tight">Mini-Quiz</h1>
            <p className="text-slate-400 text-sm">{course.title}</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-2">
          {questions.length > 0
            ? `${questions.length} questions — testez vos connaissances en quelques minutes.`
            : "Aucune question disponible pour ce cours."}
        </p>
      </div>

      {questions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Questions", value: questions.length, color: "text-indigo-400" },
            { label: "QCM", value: questions.filter(q => q.type === "mcq").length, color: "text-emerald-400" },
            { label: "Vrai / Faux", value: questions.filter(q => q.type === "true_false").length, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="card py-3 text-center">
              <p className={`font-display text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 ? (
        <>
          <QuizPanel questions={questions} courseId={course.id} />
          <div className="card flex items-center justify-between gap-4"
            style={{ borderColor: "rgba(99,102,241,0.3)", backgroundColor: "rgba(99,102,241,0.05)" }}>
            <div>
              <p className="text-sm font-medium text-slate-200">Réviser avec les flashcards ?</p>
              <p className="text-xs text-slate-400 mt-0.5">Alterne quiz et flashcards pour maximiser la rétention.</p>
            </div>
            <Link href={`/dashboard/courses/${course.id}/flashcards`} className="btn-secondary text-xs whitespace-nowrap">
              Flashcards →
            </Link>
          </div>
        </>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="text-4xl">📭</div>
          <p className="font-display font-semibold text-slate-200">Aucun quiz généré</p>
          <p className="text-sm text-slate-400 max-w-xs">
            Le quiz est généré automatiquement lors du téléversement du PDF.
          </p>
          <Link href="/dashboard/courses" className="btn-secondary">Retour aux cours</Link>
        </div>
      )}
    </div>
  );
}
