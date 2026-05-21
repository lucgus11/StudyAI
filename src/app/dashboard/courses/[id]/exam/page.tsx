import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ExamPanel from "@/components/revision/ExamPanel";

interface Props {
  params: { id: string };
}

export default async function ExamPage({ params }: Props) {
  const supabase = createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, subject")
    .eq("id", params.id)
    .single();

  if (error || !course) notFound();
  const c = course as { id: string; title: string; subject: string };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/courses/${c.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>
        <h1 className="section-title">
          🎯 Crash Test –{" "}
          <span className="text-slate-400 font-medium text-xl">{c.title}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Examen blanc chronométré avec correction et feedback détaillé par l&apos;IA.
        </p>
      </div>

      <ExamPanel courseId={c.id} courseTitle={c.title} />
    </div>
  );
}
