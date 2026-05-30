"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, FileText, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SheetEditor from "@/components/sheets/SheetEditor";
import { BlockPreview } from "@/components/sheets/SheetEditor";
import type { Sheet } from "@/types";
import toast from "react-hot-toast";

export default function EditSheetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    supabase
      .from("sheets")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setSheet(data as unknown as Sheet);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (updated: Sheet) => {
    setSheet(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const res = await fetch(`/api/sheets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          title: sheet.title,
          color: sheet.color,
          blocks: sheet.blocks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      toast.success("Fiche sauvegardée !");
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (!sheet) return (
    <div className="card text-center py-16">
      <p className="text-slate-400">Fiche introuvable.</p>
      <Link href="/dashboard/sheets" className="btn-secondary mt-4 inline-flex">Retour</Link>
    </div>
  );

  return (
    <div className="pb-20 md:pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href={`/dashboard/sheets/${id}`}
            className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            value={sheet.title}
            onChange={(e) => handleChange({ ...sheet, title: e.target.value })}
            className="font-display text-xl font-bold bg-transparent border-b-2 text-slate-50 focus:outline-none focus:border-indigo-500 transition-colors pb-0.5 min-w-0 flex-1"
            style={{ borderColor: dirty ? "#6366f1" : "#334155" }}
            placeholder="Titre de la fiche"
          />
          {dirty && (
            <span className="text-xs text-amber-400 flex-shrink-0">● Non sauvegardé</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="btn-secondary gap-2"
          >
            {preview ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{preview ? "Éditer" : "Aperçu"}</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Grille éditeur / aperçu */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={preview ? "hidden lg:block" : "block"}>
          <div className="card p-4">
            <h2 className="font-display font-semibold text-slate-200 text-sm mb-4">✏️ Éditeur</h2>
            <SheetEditor sheet={sheet} onChange={handleChange} />
          </div>
        </div>

        <div className={preview ? "block" : "hidden lg:block"}>
          <h2 className="font-display font-semibold text-slate-200 text-sm mb-3">👁️ Aperçu</h2>
          <div className="rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 relative" style={{ backgroundColor: sheet.color }}>
              <div className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.4) 27px, rgba(0,0,0,0.4) 28px)",
                  backgroundPosition: "0 52px",
                }} />
              <div className="relative">
                <h1 className="font-display text-xl font-bold text-slate-900 pb-3 mb-4"
                  style={{ borderBottom: "2px solid rgba(0,0,0,0.15)" }}>
                  {sheet.title || "Titre"}
                </h1>
                {sheet.blocks.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">Ajoute des blocs…</p>
                ) : (
                  sheet.blocks.map((block) => (
                    <BlockPreview key={block.id} block={block} sheetColor={sheet.color} />
                  ))
                )}
              </div>
            </div>
            <div className="h-2" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
