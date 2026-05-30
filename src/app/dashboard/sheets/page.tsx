"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SheetEditor from "@/components/sheets/SheetEditor";
import { BlockPreview } from "@/components/sheets/SheetEditor";
import type { Sheet } from "@/types";
import toast from "react-hot-toast";

const defaultSheet = (): Sheet => ({
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
  const [sheet, setSheet] = useState<Sheet>(defaultSheet());
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSave = async () => {
    if (!sheet.title.trim()) { toast.error("Donne un titre à ta fiche"); return; }
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
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      toast.success("Fiche créée !");
      router.push("/dashboard/sheets/" + data.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-20 md:pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sheets"
            className="text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            value={sheet.title}
            onChange={(e) => setSheet({ ...sheet, title: e.target.value })}
            className="font-display text-xl font-bold bg-transparent border-b-2 text-slate-50 focus:outline-none focus:border-indigo-500 transition-colors pb-0.5"
            style={{ borderColor: "#334155", minWidth: "200px" }}
            placeholder="Titre de la fiche"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="btn-secondary gap-2"
          >
            <FileText className="w-4 h-4" />
            {preview ? "Éditer" : "Aperçu"}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Contenu : éditeur ou aperçu */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Éditeur — toujours visible sur desktop, caché en aperçu sur mobile */}
        <div className={preview ? "hidden lg:block" : "block"}>
          <div className="card p-4">
            <h2 className="font-display font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
              ✏️ Éditeur
            </h2>
            <SheetEditor sheet={sheet} onChange={setSheet} />
          </div>
        </div>

        {/* Aperçu */}
        <div className={preview ? "block" : "hidden lg:block"}>
          <h2 className="font-display font-semibold text-slate-200 text-sm mb-3 flex items-center gap-2">
            👁️ Aperçu
          </h2>
          <div className="rounded-xl overflow-hidden shadow-xl">
            <SheetPreview sheet={sheet} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetPreview({ sheet }: { sheet: Sheet }) {
  return (
    <div
      className="p-6 min-h-[400px] relative"
      style={{ backgroundColor: sheet.color }}
    >
      {/* Lignes style carnet */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.4) 27px, rgba(0,0,0,0.4) 28px)",
          backgroundPosition: "0 52px",
        }}
      />
      <div className="relative">
        <h1 className="font-display text-xl font-bold text-slate-900 pb-3 mb-4"
          style={{ borderBottom: "2px solid rgba(0,0,0,0.15)" }}>
          {sheet.title || "Titre de la fiche"}
        </h1>
        {sheet.blocks.length === 0 ? (
          <p className="text-slate-500 text-sm italic">
            Ajoute des blocs dans l&apos;éditeur pour voir l&apos;aperçu…
          </p>
        ) : (
          sheet.blocks.map((block) => (
            <BlockPreview key={block.id} block={block} sheetColor={sheet.color} />
          ))
        )}
      </div>
    </div>
  );
}
