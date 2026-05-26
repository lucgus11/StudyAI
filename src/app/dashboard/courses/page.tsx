"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import UploadCourseButton from "@/components/revision/UploadCourseButton";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  flashcards: unknown[] | null;
  quiz_questions: unknown[] | null;
  summary: string | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setCourses((data as Course[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCourses(); }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Mes cours</h1>
          <p className="text-slate-400 text-sm mt-1">{courses.length} cours chargés</p>
        </div>
        <UploadCourseButton onSuccess={loadCourses} />
      </div>

      {error && (
        <div className="card" style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>Erreur : {error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 rounded mb-3" style={{ backgroundColor: "#1e293b", width: "60%" }} />
              <div className="h-3 rounded" style={{ backgroundColor: "#1e293b", width: "40%" }} />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="font-display font-semibold text-lg text-slate-200 mb-2">
            Aucun cours pour l&apos;instant
          </h2>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            Téléverse ton premier PDF pour générer résumés, flashcards et quiz avec l&apos;IA.
          </p>
          <UploadCourseButton onSuccess={loadCourses} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}
              className="card-hover group flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.2))", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <ArrowRight className="w-4 h-4 mt-1 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-100 leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{course.subject}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {Array.isArray(course.flashcards) && course.flashcards.length > 0 && (
                  <span className="badge-brand">{course.flashcards.length} flashcards</span>
                )}
                {Array.isArray(course.quiz_questions) && course.quiz_questions.length > 0 && (
                  <span className="badge-accent">{course.quiz_questions.length} questions</span>
                )}
                {!course.summary && (
                  <span className="badge" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                    En traitement…
                  </span>
                )}
              </div>
              <p className="text-xs mt-auto" style={{ color: "#475569" }}>
                Ajouté le {new Date(course.created_at).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
