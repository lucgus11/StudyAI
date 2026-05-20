import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Monitor, Zap, Target, MessageSquare, ArrowLeft } from "lucide-react";
import DownloadOfflineButton from "@/components/pwa/DownloadOfflineButton";
import GrandEcranPanel from "@/components/revision/GrandEcranPanel";

interface Props {
  params: { id: string };
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !course) notFound();

  const modes = [
    {
      id: "grand-ecran",
      label: "Grand Écran",
      description: "Résumé structuré, glossaire et concepts clés",
      icon: Monitor,
      color: "from-brand-600 to-brand-700",
      badge: "Passif enrichi",
      href: null, // inline panel below
    },
    {
      id: "flashcards",
      label: "Flashcards",
      description: "Cartes recto/verso pour mémoriser les notions clés",
      icon: Zap,
      color: "from-accent-600 to-accent-700",
      badge: "Actif rapide",
      href: `/dashboard/courses/${course.id}/flashcards`,
    },
    {
      id: "quiz",
      label: "Mini-Quiz",
      description: "QCM & Vrai/Faux générés par l'IA pour tester tes connaissances",
      icon: MessageSquare,
      color: "from-brand-500 to-brand-700",
      badge: "Actif rapide",
      href: `/dashboard/courses/${course.id}/quiz`,
    },
    {
      id: "crash-test",
      label: "Crash Test",
      description: "Examen blanc chronométré avec correction IA",
      icon: Target,
      color: "from-warn-500 to-orange-600",
      badge: "Actif intense",
      href: `/dashboard/courses/${course.id}/exam`,
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
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

      {/* Mode selector cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const card = (
            <div className="card-hover group flex flex-col gap-3 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-lg`}>
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
            return (
              <Link key={mode.id} href={mode.href}>
                {card}
              </Link>
            );
          }
          return <div key={mode.id}>{card}</div>;
        })}
      </div>

      {/* Grand Écran – inline split panel */}
      <GrandEcranPanel course={course} />
    </div>
  );
}
