"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, FileText, ArrowRight, Trash2, Clock } from "lucide-react";
import type { Sheet } from "@/types";
import toast from "react-hot-toast";

export default function SheetsPage() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sheets")
      .select("*")
      .order("updated_at", { ascending: false });
    setSheets((data as Sheet[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    await supabase.from("sheets").delete().eq("id", id);
    toast.success("Fiche supprimée");
    load();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">📋 Fiches de révision</h1>
          <p className="text-slate-400 text-sm mt-1">
            {sheets.length} fiche{sheets.length > 1 ? "s" : ""} créée{sheets.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/sheets/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouvelle fiche
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-36">
              <div className="h-4 rounded mb-3" style={{ backgroundColor: "#1e293b", width: "60%" }} />
              <div className="h-3 rounded" style={{ backgroundColor: "#1e293b", width: "40%" }} />
            </div>
          ))}
        </div>
      ) : sheets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="font-display font-semibold text-lg text-slate-200 mb-2">
            Aucune fiche pour l&apos;instant
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Crée ta première fiche de révision avec titres, définitions, tableaux et plus encore.
          </p>
          <Link href="/dashboard/sheets/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Créer une fiche
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sheets.map((sheet) => (
            <div key={sheet.id} className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
              {/* Couleur de fond */}
              <div className="p-5" style={{ backgroundColor: sheet.color }}>
                {/* Lignes style carnet */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.3) 23px, rgba(0,0,0,0.3) 24px)",
                    backgroundPosition: "0 40px",
                  }} />

                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }} />
                    <button
                      onClick={() => handleDelete(sheet.id, sheet.title)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.5)" }} />
                    </button>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 leading-tight line-clamp-2 mb-2">
                    {sheet.title}
                  </h3>

                  <p className="text-xs mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {Array.isArray(sheet.blocks) ? sheet.blocks.length : 0} bloc{(Array.isArray(sheet.blocks) ? sheet.blocks.length : 0) > 1 ? "s" : ""}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                      <Clock className="w-3 h-3" />
                      {new Date(sheet.updated_at).toLocaleDateString("fr-FR")}
                    </span>
                    <Link
                      href={`/dashboard/sheets/${sheet.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ backgroundColor: "rgba(0,0,0,0.12)", color: "#1e293b" }}
                    >
                      Ouvrir <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Effet bord bas type fiche cartonnée */}
              <div className="h-2" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
