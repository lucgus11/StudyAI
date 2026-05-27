"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, Zap, Trophy, ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Course { id: string; title: string; subject: string; created_at: string; }
interface Score { score: number; total: number; created_at: string; }

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("courses").select("id, title, subject, created_at")
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setCourses((data as Course[]) ?? []));

    supabase.from("quiz_scores").select("score, total, created_at")
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setScores((data as Score[]) ?? []));
  }, []);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length)
    : null;

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = scores.filter(s => s.created_at?.startsWith(today)).length;

  const quickActions = [
    { href: "/dashboard/courses", label: "Ajouter un cours", description: "Téléverse un PDF et génère tes ressources", icon: Plus, from: "#4f46e5", to: "#4338ca" },
    { href: "/dashboard/planner", label: "Planifier mes révisions", description: "Génère un calendrier personnalisé avec l'IA", icon: Calendar, from: "#059669", to: "#047857" },
  ];

  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-50">Bonjour 👋</h1>
        <p className="text-slate-400 mt-1">Prêt pour ta session de révision ?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Cours chargés", value: courses.length, icon: BookOpen, color: "text-indigo-400" },
          { label: "Score moyen", value: avgScore !== null ? `${avgScore}%` : "—", icon: Trophy, color: "text-amber-400" },
          { label: "Sessions aujourd'hui", value: todaySessions, icon: Zap, color: "text-emerald-400" },
          { label: "Quiz complétés", value: scores.length, icon: Calendar, color: "text-indigo-300" },
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

      <div>
        <h2 className="font-display text-lg font-semibold text-slate-200 mb-3">Actions rapides</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="card-hover group flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${action.from}, ${action.to})` }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-slate-100">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>

      {courses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-slate-200">Cours récents</h2>
            <Link href="/dashboard/courses" className="text-sm" style={{ color: "#818cf8" }}>Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {courses.map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border hover:border-indigo-600 transition-all group"
                style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.subject}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
