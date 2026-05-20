import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Calendar, Zap, Trophy, ArrowRight, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subject, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: scores } = await supabase
    .from("quiz_scores")
    .select("score, total, mode, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Étudiant";
  const totalCourses = courses?.length ?? 0;
  const avgScore =
    scores && scores.length > 0
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length)
      : null;

  const quickActions = [
    {
      href: "/dashboard/courses",
      label: "Ajouter un cours",
      description: "Téléverse un PDF et génère tes ressources",
      icon: Plus,
      color: "from-brand-600 to-brand-700",
    },
    {
      href: "/dashboard/planner",
      label: "Planifier mes révisions",
      description: "Génère un calendrier personnalisé avec l'IA",
      icon: Calendar,
      color: "from-accent-600 to-accent-700",
    },
  ];

  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-50">
          Bonjour, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">Prêt pour ta session de révision ?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Cours chargés", value: totalCourses, icon: BookOpen, color: "text-brand-400" },
          { label: "Score moyen", value: avgScore !== null ? `${avgScore}%` : "—", icon: Trophy, color: "text-warn-400" },
          { label: "Sessions aujourd'hui", value: scores?.filter(s => s.created_at?.startsWith(new Date().toISOString().split("T")[0])).length ?? 0, icon: Zap, color: "text-accent-400" },
          { label: "Quiz complétés", value: scores?.length ?? 0, icon: Calendar, color: "text-brand-300" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="font-display text-2xl font-bold text-slate-50">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-200 mb-3">Actions rapides</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="card-hover group flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-slate-100">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent courses */}
      {courses && courses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-slate-200">Cours récents</h2>
            <Link href="/dashboard/courses" className="text-sm text-brand-400 hover:text-brand-300">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="flex items-center gap-3 p-3 bg-surface-900 border border-surface-800 rounded-xl hover:border-brand-600/40 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-900/40 border border-brand-700/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.subject}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
