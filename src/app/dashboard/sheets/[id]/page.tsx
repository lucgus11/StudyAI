"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Download, Loader2, FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BlockPreview } from "@/components/sheets/SheetEditor";
import { exportSheetToPDF } from "@/components/sheets/SheetPDFExport";
import type { Sheet } from "@/types";
import toast from "react-hot-toast";

export default function SheetViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    supabase
      .from("sheets")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setSheet(data as unknown as Sheet);
        else toast.error("Fiche introuvable");
        setLoading(false);
      });
  }, [id]);

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
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sheets"
            className="text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display font-bold text-lg text-slate-50 truncate max-w-xs md:max-w-none">
            {sheet.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Export PDF */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="btn-secondary gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 z-20 rounded-xl shadow-2xl p-2 w-52"
                style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                <button
                  onClick={() => { exportSheetToPDF(sheet, "card"); setShowExport(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-900/30 text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: sheet.color }}>
                    <FileDown className="w-3.5 h-3.5 text-slate-800" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Style fiche</p>
                    <p className="text-xs text-slate-500">Coloré, type cartonné</p>
                  </div>
                </button>
                <button
                  onClick={() => { exportSheetToPDF(sheet, "a4"); setShowExport(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-900/30 text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-200">
                    <FileDown className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Style A4</p>
                    <p className="text-xs text-slate-500">Document sobre</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Éditer */}
          <Link href={`/dashboard/sheets/${id}/edit`} className="btn-primary gap-2">
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Modifier</span>
          </Link>
        </div>
      </div>

      {/* Fiche en lecture — optimisée mobile */}
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ boxShadow: `0 20px 60px -10px ${sheet.color}80` }}
        >
          <div className="p-6 md:p-8 relative" style={{ backgroundColor: sheet.color }}>
            {/* Lignes style carnet */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.4) 27px, rgba(0,0,0,0.4) 28px)",
                backgroundPosition: "0 60px",
              }}
            />

            <div className="relative">
              {/* Titre */}
              <h1
                className="font-display text-2xl font-bold text-slate-900 pb-4 mb-5"
                style={{ borderBottom: "2px solid rgba(0,0,0,0.15)" }}
              >
                {sheet.title}
              </h1>

              {/* Blocs */}
              {sheet.blocks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-600 text-sm">Cette fiche est vide.</p>
                  <Link
                    href={`/dashboard/sheets/${id}/edit`}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Ajouter du contenu
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {sheet.blocks.map((block) => (
                    <BlockPreview key={block.id} block={block} sheetColor={sheet.color} />
                  ))}
                </div>
              )}

              {/* Footer */}
              <p className="text-xs mt-6 pt-3" style={{ color: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                StudyAI · Modifiée le {new Date(sheet.updated_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
          {/* Effet bas de fiche */}
          <div className="h-3" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />
        </div>
      </div>
    </div>
  );
}
