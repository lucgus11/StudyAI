import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, ArrowRight, Plus } from "lucide-react";
import UploadCourseButton from "@/components/revision/UploadCourseButton";

export default async function CoursesPage() {
  const supabase = createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Mes cours</h1>
          <p className="text-slate-400 text-sm mt-1">
            {courses?.length ?? 0} cours chargés
          </p>
        </div>
        <UploadCourseButton />
      </div>

      {error && (
        <div className="card border-danger-500/30 bg-danger-900/10">
          <p className="text-danger-400 text-sm">Erreur lors du chargement : {error.message}</p>
        </div>
      )}

      {!courses || courses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-900/30 border border-brand-700/30 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="font-display font-semibold text-lg text-slate-200 mb-2">
            Aucun cours pour l&apos;instant
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            Téléverse ton premier PDF pour générer automatiquement résumés, flashcards et quiz avec l&apos;IA.
          </p>
          <UploadCourseButton />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="card-hover group flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600/30 to-accent-600/20 border border-brand-600/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-brand-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all mt-1" />
              </div>

              <div>
                <h3 className="font-display font-semibold text-slate-100 leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{course.subject}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {course.flashcards && (
                  <span className="badge-brand">
                    {Array.isArray(course.flashcards) ? course.flashcards.length : 0} flashcards
                  </span>
                )}
                {course.quiz_questions && (
                  <span className="badge-accent">
                    {Array.isArray(course.quiz_questions) ? course.quiz_questions.length : 0} questions
                  </span>
                )}
                {!course.summary && (
                  <span className="badge bg-warn-900/30 text-warn-400 border border-warn-600/30">
                    En traitement…
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-auto">
                Ajouté le {new Date(course.created_at).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
