"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Monitor, Zap, Target, MessageSquare, ArrowLeft, FileText, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DownloadOfflineButton from "@/components/pwa/DownloadOfflineButton";
import GrandEcranPanel from "@/components/revision/GrandEcranPanel";
import PDFViewer from "@/components/revision/PDFViewer";
import type { Course } from "@/types";
import { Loader2 } from "lucide-react";

type View = "split" | "pdf" | "analysis";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("split");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setCourse(data as unknown as Course);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card text-center py-16">
        <p className="text-slate-400">Cours introuvable.</p>
        <Link href="/dashboard/courses" className="btn-secondary mt-4 inline-flex">
          Retour aux cours
        </Link>
      </div>
    );
  }

  const modes = [
    {
      id: "flashcards",
      label: "Flashcards",
      description: "Cartes recto/verso pour mémoriser",
      icon: Zap,
      color: "linear-gradient(135deg, #059669, #047857)",
      href: `/dashboard/courses/${course.id}/flashcards`,
    },
    {
      id: "quiz",
      label: "Mini-Quiz",
      description: "QCM & Vrai/Faux générés par l'IA",
      icon: MessageSquare,
      color: "linear-gradient(135deg, #6366f1, #4f46e5)",
      href: `/dashboard/courses/${course.id}/quiz`,
    },
    {
      id: "crash-test",
      label: "Crash Test",
      description: "Examen blanc chronométré",
      icon: Target,
      color: "linear-gradient(135deg, #f59e0b, #d97706)",
      href: `/dashboard/courses/${course.id}/exam`,
    },
  ];

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux cours
          </Link>
          <h1 className="section-title">{course.title}</h1>
          <p className="text-slate-400 mt-0.5">{course.subject}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DownloadOfflineButton course={course} />
        </div>
      </div>

      {/* Mode rapide cards */}
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.id} href={mode.href}>
              <div className="card-hover group flex flex-col gap-2 cursor-pointer h-full p-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: mode.color }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-display font-semibold text-slate-100 text-sm">{mode.label}</p>
                <p className="text-xs text-slate-400 hidden md:block">{mode.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View switcher — seulement si PDF disponible */}
      {course.pdf_url && (
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          {[
            { id: "split" as View, label: "Split", icon: Monitor },
            { id: "pdf" as View, label: "PDF seul", icon: FileText },
            { id: "analysis" as View, label: "Analyse IA", icon: BookOpen },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  view === v.id
                    ? { backgroundColor: "#4f46e5", color: "white" }
                    : { color: "#94a3b8" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenu principal */}
      {course.pdf_url ? (
        <>
          {/* Split screen */}
          {view === "split" && (
            <div className="grid lg:grid-cols-2 gap-4">
              <PDFViewer pdfUrl={course.pdf_url} title={course.title} />
              <GrandEcranPanel course={course} />
            </div>
          )}

          {/* PDF seul */}
          {view === "pdf" && (
            <PDFViewer pdfUrl={course.pdf_url} title={course.title} />
          )}

          {/* Analyse IA seule */}
          {view === "analysis" && (
            <GrandEcranPanel course={course} />
          )}
        </>
      ) : (
        /* Pas de PDF : afficher uniquement l'analyse IA */
        <GrandEcranPanel course={course} />
      )}
    </div>
  );
}
