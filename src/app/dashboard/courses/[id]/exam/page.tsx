"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ExamPanel from "@/components/revision/ExamPanel";

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<{ id: string; title: string; subject: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("courses")
      .select("id, title, subject")
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

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <Link href={`/dashboard/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>
        <h1 className="section-title">
          🎯 Crash Test — <span className="text-slate-400 font-medium text-xl">{course.title}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Examen blanc chronométré avec correction et feedback détaillé par l&apos;IA.
        </p>
      </div>
      <ExamPanel courseId={course.id} courseTitle={course.title} />
    </div>
  );
}
