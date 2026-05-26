"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { ExamInput, StudyPlan } from "@/types";

const DAY_OPTIONS = [
  { id: "monday", label: "Lun" },
  { id: "tuesday", label: "Mar" },
  { id: "wednesday", label: "Mer" },
  { id: "thursday", label: "Jeu" },
  { id: "friday", label: "Ven" },
  { id: "saturday", label: "Sam" },
  { id: "sunday", label: "Dim" },
];

interface Props {
  existingPlan?: StudyPlan | null;
}

export default function PlannerForm({ existingPlan }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [weeksBeforeStart, setWeeksBeforeStart] = useState(
    existingPlan?.weeks_count ?? 4
  );
  const [dailyHours, setDailyHours] = useState(
    existingPlan?.daily_hours ?? 4
  );
  const [restDays, setRestDays] = useState<string[]>(
    existingPlan?.rest_days ?? ["saturday", "sunday"]
  );
  const [exams, setExams] = useState<ExamInput[]>(
    existingPlan
      ? []
      : [{ subject: "", date: "", importance: "medium" }]
  );

  const addExam = () =>
    setExams((prev) => [...prev, { subject: "", date: "", importance: "medium" }]);

  const removeExam = (i: number) =>
    setExams((prev) => prev.filter((_, idx) => idx !== i));

  const updateExam = (i: number, field: keyof ExamInput, value: string) =>
    setExams((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );

  const toggleRestDay = (day: string) =>
    setRestDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validExams = exams.filter((ex) => ex.subject && ex.date);
    if (validExams.length === 0) {
      toast.error("Ajoute au moins un examen avec une date");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          exams: validExams,
          weeksBeforeStart,
          dailyHours,
          restDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Planning généré avec succès !");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-50 mb-1">
          Paramètres de révision
        </h2>
        <p className="text-slate-400 text-xs">
          L&apos;IA générera un calendrier personnalisé basé sur tes données.
        </p>
      </div>

      {/* Exams list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Mes examens</label>
          <button type="button" onClick={addExam} className="btn-ghost text-xs gap-1 py-1 px-2">
            <Plus className="w-3 h-3" />
            Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {exams.map((exam, i) => (
            <div key={i} className="bg-surface-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-400 font-bold font-mono">#{i + 1}</span>
                {exams.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExam(i)}
                    className="ml-auto text-slate-600 hover:text-danger-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Matière (ex: Droit constitutionnel)"
                value={exam.subject}
                onChange={(e) => updateExam(i, "subject", e.target.value)}
                className="input text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={exam.date}
                  onChange={(e) => updateExam(i, "date", e.target.value)}
                  className="input text-sm flex-1"
                />
                <select
                  value={exam.importance}
                  onChange={(e) => updateExam(i, "importance", e.target.value)}
                  className="input text-sm w-auto"
                >
                  <option value="high">⚡ Important</option>
                  <option value="medium">📘 Moyen</option>
                  <option value="low">📝 Léger</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weeks before */}
      <div>
        <label className="label">
          Semaines de révision disponibles :{" "}
          <span className="text-brand-400 font-bold">{weeksBeforeStart}</span>
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={weeksBeforeStart}
          onChange={(e) => setWeeksBeforeStart(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1 sem.</span>
          <span>12 sem.</span>
        </div>
      </div>

      {/* Daily hours */}
      <div>
        <label className="label">
          Heures de révision par jour :{" "}
          <span className="text-brand-400 font-bold">{dailyHours}h</span>
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={dailyHours}
          onChange={(e) => setDailyHours(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Rest days */}
      <div>
        <label className="label">Jours de repos</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_OPTIONS.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleRestDay(day.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                restDays.includes(day.id)
                  ? "bg-brand-900/40 border-brand-600/60 text-brand-300"
                  : "border-surface-700 text-slate-400 hover:border-surface-600"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading ? "Génération en cours…" : "Générer mon planning"}
      </button>
    </form>
  );
}
