"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, FileText, ArrowRight, Trash2, Clock,
  FolderOpen, Move, X, Check
} from "lucide-react";
import type { Sheet, Folder } from "@/types";
import FolderTree from "@/components/folders/FolderTree";
import toast from "react-hot-toast";

export default function SheetsPage() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [movingSheet, setMovingSheet] = useState<Sheet | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: f }] = await Promise.all([
      supabase.from("sheets").select("*").order("updated_at", { ascending: false }),
      supabase.from("folders").select("*").order("name"),
    ]);
    setSheets((s as Sheet[]) ?? []);
    setFolders((f as Folder[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Compter les fiches par dossier
  const sheetCounts: Record<string, number> = {};
  sheets.forEach(s => {
    if (s.folder_id) {
      sheetCounts[s.folder_id] = (sheetCounts[s.folder_id] ?? 0) + 1;
    }
  });

  // Fiches affichées selon le dossier sélectionné
  const visibleSheets = selectedFolderId === null
    ? sheets
    : sheets.filter(s => s.folder_id === selectedFolderId);

  // --- Handlers dossiers ---
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    const token = await getToken();
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ name, parent_id: parentId }),
    });
    if (res.ok) { toast.success("Dossier créé"); load(); }
    else toast.error("Erreur création dossier");
  };

  const handleRenameFolder = async (id: string, name: string) => {
    const token = await getToken();
    await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ name }),
    });
    load();
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Supprimer ce dossier ? Les fiches seront déplacées à la racine.")) return;
    const token = await getToken();
    const res = await fetch(`/api/folders/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token },
    });
    if (res.ok) { toast.success("Dossier supprimé"); load(); }
    else toast.error("Erreur suppression dossier");
  };

  // --- Handler déplacer une fiche ---
  const handleMoveSheet = async (sheetId: string, folderId: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/sheets/${sheetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token,
      },
      body: JSON.stringify({
        folder_id: folderId,
        // Récupérer les autres champs de la fiche
        title: sheets.find(s => s.id === sheetId)?.title,
        color: sheets.find(s => s.id === sheetId)?.color,
        blocks: sheets.find(s => s.id === sheetId)?.blocks,
      }),
    });
    toast.success("Fiche déplacée");
    setMovingSheet(null);
    load();
  };

  const handleDeleteSheet = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    await supabase.from("sheets").delete().eq("id", id);
    toast.success("Fiche supprimée");
    load();
  };

  // Nom du dossier actuel
  const currentFolderName = selectedFolderId
    ? folders.find(f => f.id === selectedFolderId)?.name ?? "Dossier"
    : "Toutes les fiches";

  return (
    <div className="pb-20 md:pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="section-title">📋 Fiches de révision</h1>
          <p className="text-slate-400 text-sm mt-1">
            {sheets.length} fiche{sheets.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link href="/dashboard/sheets/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouvelle fiche
        </Link>
      </div>

      <div className="flex gap-5">
        {/* Sidebar dossiers */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="card p-3 sticky top-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
              Dossiers
            </p>
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              sheetCounts={sheetCounts}
              onSelect={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>
        </aside>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          {/* Fil d'ariane mobile */}
          <div className="md:hidden flex items-center gap-2 mb-3 overflow-x-auto">
            <button onClick={() => setSelectedFolderId(null)}
              className="text-xs text-slate-400 hover:text-slate-200 whitespace-nowrap">
              Toutes
            </button>
            {selectedFolderId && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-xs text-indigo-300 whitespace-nowrap">{currentFolderName}</span>
              </>
            )}
          </div>

          {/* Titre dossier courant */}
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <h2 className="font-display font-semibold text-slate-200">{currentFolderName}</h2>
            <span className="text-xs text-slate-500">
              ({visibleSheets.length} fiche{visibleSheets.length > 1 ? "s" : ""})
            </span>
          </div>

          {/* Mobile : sélecteur dossier simple */}
          <div className="md:hidden mb-4">
            <select
              value={selectedFolderId ?? ""}
              onChange={e => setSelectedFolderId(e.target.value || null)}
              className="input text-sm"
            >
              <option value="">Toutes les fiches ({sheets.length})</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.parent_id ? "  └ " : ""}{f.name} ({sheetCounts[f.id] ?? 0})
                </option>
              ))}
            </select>
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
          ) : visibleSheets.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="font-display font-semibold text-slate-200 mb-2">
                {selectedFolderId ? "Ce dossier est vide" : "Aucune fiche"}
              </p>
              <p className="text-slate-400 text-sm max-w-xs mb-5">
                {selectedFolderId
                  ? "Déplace des fiches ici via le menu ⋯ sur chaque fiche."
                  : "Crée ta première fiche de révision."}
              </p>
              {!selectedFolderId && (
                <Link href="/dashboard/sheets/new" className="btn-primary">
                  <Plus className="w-4 h-4" /> Créer une fiche
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleSheets.map((sheet) => (
                <SheetCard
                  key={sheet.id}
                  sheet={sheet}
                  folders={folders}
                  onDelete={() => handleDeleteSheet(sheet.id, sheet.title)}
                  onMove={() => setMovingSheet(sheet)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal déplacer une fiche */}
      {movingSheet && (
        <MoveSheetModal
          sheet={movingSheet}
          folders={folders}
          onMove={(folderId) => handleMoveSheet(movingSheet.id, folderId)}
          onClose={() => setMovingSheet(null)}
        />
      )}
    </div>
  );
}

// ---- Carte fiche ----
function SheetCard({
  sheet, folders, onDelete, onMove
}: {
  sheet: Sheet;
  folders: Folder[];
  onDelete: () => void;
  onMove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const folder = folders.find(f => f.id === sheet.folder_id);

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
      <div className="p-5" style={{ backgroundColor: sheet.color }}>
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.3) 23px, rgba(0,0,0,0.3) 24px)",
            backgroundPosition: "0 40px",
          }} />

        <div className="relative">
          <div className="flex items-start justify-between gap-2 mb-3">
            <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }} />

            {/* Menu actions */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 text-slate-700 font-bold text-lg leading-none"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-2xl p-1.5 w-44"
                  style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                  <button onClick={() => { onMove(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-indigo-900/30 text-left">
                    <Move className="w-3.5 h-3.5" /> Déplacer
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 text-left">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          <h3 className="font-display font-bold text-base text-slate-900 leading-tight line-clamp-2 mb-2">
            {sheet.title}
          </h3>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {folder && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.6)" }}>
                📁 {folder.name}
              </span>
            )}
            <span className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>
              {Array.isArray(sheet.blocks) ? sheet.blocks.length : 0} bloc{(Array.isArray(sheet.blocks) ? sheet.blocks.length : 0) > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              <Clock className="w-3 h-3" />
              {new Date(sheet.updated_at).toLocaleDateString("fr-FR")}
            </span>
            <Link href={`/dashboard/sheets/${sheet.id}`}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ backgroundColor: "rgba(0,0,0,0.12)", color: "#1e293b" }}>
              Ouvrir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
      <div className="h-2" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />
    </div>
  );
}

// ---- Modal déplacer ----
function MoveSheetModal({
  sheet, folders, onMove, onClose
}: {
  sheet: Sheet;
  folders: Folder[];
  onMove: (folderId: string | null) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(sheet.folder_id ?? null);

  // Construire la liste plate avec indentation
  const buildList = (parentId: string | null, depth: number): { folder: Folder; depth: number }[] => {
    return folders
      .filter(f => f.parent_id === parentId)
      .flatMap(f => [{ folder: f, depth }, ...buildList(f.id, depth + 1)]);
  };
  const flatList = buildList(null, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl p-5"
        style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-slate-100">Déplacer la fiche</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          <span className="text-slate-200 font-medium">"{sheet.title}"</span>
          {" "}→ choisir la destination
        </p>

        <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
          {/* Racine */}
          <button
            onClick={() => setSelected(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
            style={selected === null
              ? { backgroundColor: "rgba(99,102,241,0.2)", color: "#a5b4fc" }
              : { color: "#94a3b8" }}
          >
            {selected === null && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>📁 Racine (sans dossier)</span>
          </button>

          {flatList.map(({ folder, depth }) => (
            <button
              key={folder.id}
              onClick={() => setSelected(folder.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
              style={{
                paddingLeft: `${12 + depth * 16}px`,
                ...(selected === folder.id
                  ? { backgroundColor: "rgba(99,102,241,0.2)", color: "#a5b4fc" }
                  : { color: "#94a3b8" })
              }}
            >
              {selected === folder.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              <span>📁 {folder.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={() => onMove(selected)} className="btn-primary flex-1">
            Déplacer ici
          </button>
        </div>
      </div>
    </div>
  );
}
