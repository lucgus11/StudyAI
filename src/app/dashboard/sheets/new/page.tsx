"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SheetEditor, { BlockPreview } from "@/components/sheets/SheetEditor";
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
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

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
    <div className="pb-24 md:pb-8 animate-fade-in h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/dashboard/sheets"
            className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            type="text"
            value={sheet.title}
            onChange={(e) => setSheet({ ...sheet, title: e.target.value })}
            className="font-display text-xl font-bold bg-transparent border-b-2 pb-1 text-slate-50 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors min-w-0 flex-1"
            style={{ borderColor: "#334155" }}
            placeholder="Titre de la fiche…"
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {/* Tabs mobile */}
      <div className="flex md:hidden gap-1 p-1 rounded-xl mb-4 w-fit"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        {[
          { id: "edit" as const, label: "Éditeur", icon: PenLine },
          { id: "preview" as const, label: "Aperçu", icon: Eye },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={mobileTab === id
              ? { backgroundColor: "#4f46e5", color: "white" }
              : { color: "#94a3b8" }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Split layout desktop / tabs mobile */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Éditeur */}
        <div className={mobileTab === "edit" ? "block" : "hidden md:block"}>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PenLine className="w-3.5 h-3.5" /> Éditeur
            </p>
            <SheetEditor sheet={sheet} onChange={setSheet} />
          </div>
        </div>

        {/* Aperçu en temps réel */}
        <div className={mobileTab === "preview" ? "block" : "hidden md:block"}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Aperçu en temps réel
          </p>
          <div className="rounded-2xl overflow-hidden shadow-xl sticky top-4">
            <div className="p-6 relative min-h-[300px]" style={{ backgroundColor: sheet.color }}>
              {/* Lignes style carnet */}
              <div className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.4) 27px, rgba(0,0,0,0.4) 28px)",
                  backgroundPosition: "0 56px",
                }} />
              <div className="relative">
                <h1
                  className="font-display text-xl font-bold text-slate-900 pb-3 mb-4"
                  style={{ borderBottom: "2px solid rgba(0,0,0,0.15)" }}
                >
                  {sheet.title || "Titre de la fiche"}
                </h1>
                {sheet.blocks.length === 0 ? (
                  <p className="text-sm italic" style={{ color: "rgba(0,0,0,0.35)" }}>
                    Ajoute des blocs dans l&apos;éditeur pour voir l&apos;aperçu ici…
                  </p>
                ) : (
                  <div className="space-y-1">
                    {sheet.blocks.map((block) => (
                      <BlockPreview key={block.id} block={block} sheetColor={sheet.color} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Effet bas de fiche */}
            <div className="h-2.5" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
