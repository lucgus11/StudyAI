"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SheetEditor from "@/components/sheets/SheetEditor";
import type { Sheet } from "@/types";
import toast from "react-hot-toast";

const emptySheet = (): Sheet => ({
  id: "",
  user_id: "",
  course_id: null,
  title: "Ma fiche de révision",
  color: "#fde68a",
  blocks: [],
  created_at: "",
  updated_at: "",
});

export default function NewSheetPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sheet, setSheet] = useState<Sheet>(emptySheet());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!sheet.title.trim()) { toast.error("Ajoute un titre à ta fiche"); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          title: sheet.title,
          color: sheet.color,
          blocks: sheet.blocks,
          course_id: sheet.course_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Fiche créée !");
      router.push("/dashboard/sheets/" + data.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sheets"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Mes fiches
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-300">Nouvelle fiche</span>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {/* Titre de la fiche */}
      <input
        type="text"
        value={sheet.title}
        onChange={(e) => setSheet({ ...sheet, title: e.target.value })}
        className="w-full font-display text-2xl font-bold bg-transparent border-0 border-b-2 pb-2 text-slate-50 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        style={{ borderColor: "#334155" }}
        placeholder="Titre de la fiche…"
      />

      {/* Éditeur */}
      <SheetEditor sheet={sheet} onChange={setSheet} />
    </div>
  );
}
