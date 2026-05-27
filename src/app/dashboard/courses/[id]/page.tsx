"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Monitor, Zap, Target, MessageSquare, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DownloadOfflineButton from "@/components/pwa/DownloadOfflineButton";
import GrandEcranPanel from "@/components/revision/GrandEcranPanel";
import type { Course } from "@/types";
import { Loader2 } from "lucide-react";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
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
      id: "grand-ecran",
      label: "Grand Écran",
      description: "Résumé structuré, glossaire et concepts clés",
      icon: Monitor,
      color: "linear-gradient(135deg, #4f46e5, #4338ca)",
      badge: "Passif enrichi",
      href: null,
    },
    {
      id: "flashcards",
      label: "Flashcards",
      description: "Cartes recto/verso pour mémoriser les notions clés",
      icon: Zap,
      color: "linear-gradient(135deg, #059669, #047857)",
      badge: "Actif rapide",
      href: `/dashboard/courses/${course.id}/flashcards`,
    },
    {
      id: "quiz",
      label: "Mini-Quiz",
      description: "QCM & Vrai/Faux générés par l'IA",
      icon: MessageSquare,
      color: "linear-gradient(135deg, #6366f1, #4f46e5)",
      badge: "Actif rapide",
      href: `/dashboard/courses/${course.id}/quiz`,
    },
    {
      id: "crash-test",
      label: "Crash Test",
      description: "Examen blanc chronométré avec correction IA",
      icon: Target,
      color: "linear-gradient(135deg, #f59e0b, #d97706)",
      badge: "Actif intense",
      href: `/dashboard/courses/${course.id}/exam`,
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <Link href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux cours
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="section-title">{course.title}</h1>
            <p className="text-slate-400 mt-1">{course.subject}</p>
          </div>
          <DownloadOfflineButton course={course} />
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const card = (
            <div className="card-hover group flex flex-col gap-3 cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: mode.color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="badge-brand text-xs">{mode.badge}</span>
              </div>
              <div>
                <p className="font-display font-semibold text-slate-100">{mode.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{mode.description}</p>
              </div>
            </div>
          );
          if (mode.href) {
            return <Link key={mode.id} href={mode.href}>{card}</Link>;
          }
          return <div key={mode.id}>{card}</div>;
        })}
      </div>

      {/* Grand Écran panel */}
      <GrandEcranPanel course={course} />
    </div>
  );
}
