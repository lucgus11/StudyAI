import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import QuizPanel from "@/components/revision/QuizPanel";

interface Props {
  params: { id: string };
}

export default async function QuizPage({ params }: Props) {
  const supabase = createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, subject, quiz_questions")
    .eq("id", params.id)
    .single();

  if (error || !course) notFound();

  const questions = Array.isArray(course.quiz_questions) ? course.quiz_questions : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="section-title leading-tight">Mini-Quiz</h1>
            <p className="text-slate-400 text-sm">{course.title}</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-2">
          {questions.length > 0
            ? `${questions.length} questions générées par l'IA — idéal pour tester tes connaissances en quelques minutes.`
            : "Aucune question disponible pour ce cours."}
        </p>
      </div>

      {/* Stats bar */}
      {questions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Questions",
              value: questions.length,
              color: "text-brand-400",
            },
            {
              label: "QCM",
              value: questions.filter((q) => q.type === "mcq").length,
              color: "text-accent-400",
            },
            {
              label: "Vrai / Faux",
              value: questions.filter((q) => q.type === "true_false").length,
              color: "text-warn-400",
            },
          ].map((stat) => (
            <div key={stat.label} className="card py-3 text-center">
              <p className={`font-display text-xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quiz */}
      {questions.length > 0 ? (
        <QuizPanel questions={questions} courseId={course.id} />
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="text-4xl">📭</div>
          <div>
            <p className="font-display font-semibold text-slate-200 mb-1">
              Aucun quiz généré
            </p>
            <p className="text-sm text-slate-400 max-w-xs">
              Le quiz est généré automatiquement lors du téléversement du PDF.
              Essaie de recréer le cours avec un PDF.
            </p>
          </div>
          <Link href="/dashboard/courses" className="btn-secondary">
            Retour aux cours
          </Link>
        </div>
      )}

      {/* Link to flashcards */}
      {questions.length > 0 && (
        <div className="card border-brand-700/30 bg-brand-900/10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-200">
              Envie de réviser avec les flashcards ?
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Alterne quiz et flashcards pour maximiser la rétention.
            </p>
          </div>
          <Link
            href={`/dashboard/courses/${course.id}/flashcards`}
            className="btn-secondary text-xs whitespace-nowrap"
          >
            Flashcards →
          </Link>
        </div>
      )}
    </div>
  );
}
