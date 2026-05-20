import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FlashcardDeck from "@/components/revision/FlashcardDeck";
import QuizPanel from "@/components/revision/QuizPanel";

interface Props {
  params: { id: string };
}

export default async function FlashcardsPage({ params }: Props) {
  const supabase = createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, subject, flashcards, quiz_questions")
    .eq("id", params.id)
    .single();

  if (error || !course) notFound();

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>
        <h1 className="section-title">
          ⚡ Micro-Learning –{" "}
          <span className="text-slate-400 font-medium text-xl">{course.title}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sessions courtes pour réviser efficacement en mobilité.
        </p>
      </div>

      {/* Flashcards */}
      <section>
        <h2 className="font-display text-lg font-semibold text-slate-200 mb-4">
          Flashcards{" "}
          <span className="text-slate-500 font-normal text-sm">
            ({Array.isArray(course.flashcards) ? course.flashcards.length : 0})
          </span>
        </h2>
        {Array.isArray(course.flashcards) && course.flashcards.length > 0 ? (
          <FlashcardDeck flashcards={course.flashcards} courseId={course.id} />
        ) : (
          <div className="card text-center py-10 text-slate-400">
            Aucune flashcard générée pour ce cours.
          </div>
        )}
      </section>

      {/* Mini quiz */}
      <section>
        <h2 className="font-display text-lg font-semibold text-slate-200 mb-4">
          Mini-Quiz{" "}
          <span className="text-slate-500 font-normal text-sm">
            ({Array.isArray(course.quiz_questions) ? course.quiz_questions.length : 0} questions)
          </span>
        </h2>
        {Array.isArray(course.quiz_questions) && course.quiz_questions.length > 0 ? (
          <QuizPanel questions={course.quiz_questions} courseId={course.id} />
        ) : (
          <div className="card text-center py-10 text-slate-400">
            Aucun quiz généré pour ce cours.
          </div>
        )}
      </section>
    </div>
  );
}
