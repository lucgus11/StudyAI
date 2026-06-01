"use client";

import { useState } from "react";
import {
  Folder as FolderIcon, FolderOpen as FolderOpenIcon, ChevronRight, ChevronDown,
  Plus, Pencil, Trash2, Check, X
} from "lucide-react";
import type { Folder as FolderType } from "@/types";
import { clsx } from "clsx";

interface Props {
  folders: FolderType[];
  selectedFolderId: string | null;
  sheetCounts: Record<string, number>;
  onSelect: (id: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

interface FolderNodeProps {
  folder: FolderType;
  allFolders: FolderType[];
  selectedId: string | null;
  sheetCounts: Record<string, number>;
  depth: number;
  onSelect: (id: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

function FolderNode({
  folder, allFolders, selectedId, sheetCounts, depth,
  onSelect, onCreateFolder, onRenameFolder, onDeleteFolder
}: FolderNodeProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");

  const children = allFolders.filter(f => f.parent_id === folder.id);
  const isSelected = selectedId === folder.id;
  const count = sheetCounts[folder.id] ?? 0;

  const handleRename = async () => {
    if (editName.trim() && editName !== folder.name) {
      await onRenameFolder(folder.id, editName.trim());
    }
    setEditing(false);
  };

  const handleAddChild = async () => {
    if (newChildName.trim()) {
      await onCreateFolder(newChildName.trim(), folder.id);
      setNewChildName("");
      setOpen(true);
    }
    setAddingChild(false);
  };

  return (
    <div>
      <div
        className={clsx(
          "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-all",
          isSelected
            ? "bg-indigo-900/40 text-indigo-300"
            : "text-slate-400 hover:text-slate-200 hover:bg-surface-800"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => { onSelect(folder.id); setOpen(!open); }}
      >
        {/* Chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className="w-4 h-4 flex-shrink-0 flex items-center justify-center"
        >
          {children.length > 0
            ? open
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
            : <span className="w-3" />}
        </button>

        {/* Icône */}
        {open
          ? <FolderOpenIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />
          : <FolderIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />}

        {/* Nom (éditable) */}
        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-surface-800 text-slate-100 text-xs px-1.5 py-0.5 rounded border border-indigo-500 focus:outline-none min-w-0"
          />
        ) : (
          <span className="flex-1 text-sm truncate min-w-0">{folder.name}</span>
        )}

        {/* Compteur */}
        {count > 0 && !editing && (
          <span className="text-xs px-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
            {count}
          </span>
        )}

        {/* Actions */}
        {editing ? (
          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={handleRename} className="text-emerald-400 hover:text-emerald-300">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setEditing(false); setEditName(folder.name); }} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="hidden group-hover:flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setAddingChild(true)}
              className="p-0.5 rounded hover:text-indigo-400"
              title="Ajouter un sous-dossier"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => { setEditing(true); setEditName(folder.name); }}
              className="p-0.5 rounded hover:text-amber-400"
              title="Renommer"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteFolder(folder.id)}
              className="p-0.5 rounded hover:text-red-400"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Nouveau sous-dossier */}
      {addingChild && (
        <div className="flex items-center gap-1 py-1" style={{ paddingLeft: `${24 + (depth + 1) * 16}px` }}>
          <FolderIcon className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
          <input
            autoFocus
            value={newChildName}
            onChange={e => setNewChildName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddChild(); if (e.key === "Escape") setAddingChild(false); }}
            placeholder="Nom du sous-dossier"
            className="flex-1 bg-surface-800 text-slate-100 text-xs px-2 py-1 rounded border border-indigo-500 focus:outline-none"
          />
          <button onClick={handleAddChild} className="text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => setAddingChild(false)} className="text-slate-500"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Enfants */}
      {open && children.map(child => (
        <FolderNode
          key={child.id}
          folder={child}
          allFolders={allFolders}
          selectedId={selectedId}
          sheetCounts={sheetCounts}
          depth={depth + 1}
          onSelect={onSelect}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}

export default function FolderTree({
  folders, selectedFolderId, sheetCounts,
  onSelect, onCreateFolder, onRenameFolder, onDeleteFolder
}: Props) {
  const [addingRoot, setAddingRoot] = useState(false);
  const [rootName, setRootName] = useState("");

  const rootFolders = folders.filter(f => f.parent_id === null);

  const handleAddRoot = async () => {
    if (rootName.trim()) {
      await onCreateFolder(rootName.trim(), null);
      setRootName("");
    }
    setAddingRoot(false);
  };

  return (
    <div className="space-y-0.5">
      {/* Toutes les fiches */}
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all",
          selectedFolderId === null
            ? "bg-indigo-900/40 text-indigo-300"
            : "text-slate-400 hover:text-slate-200 hover:bg-surface-800"
        )}
      >
        <FolderIcon className="w-4 h-4 text-slate-400" />
        <span className="flex-1 text-left">Toutes les fiches</span>
        {Object.values(sheetCounts).reduce((a, b) => a + b, 0) > 0 && (
          <span className="text-xs px-1.5 rounded-full"
            style={{ backgroundColor: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
            {Object.values(sheetCounts).reduce((a, b) => a + b, 0)}
          </span>
        )}
      </button>

      {/* Dossiers */}
      {rootFolders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          allFolders={folders}
          selectedId={selectedFolderId}
          sheetCounts={sheetCounts}
          depth={0}
          onSelect={onSelect}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}

      {/* Nouveau dossier racine */}
      {addingRoot ? (
        <div className="flex items-center gap-1.5 px-2 py-1">
          <FolderIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <input
            autoFocus
            value={rootName}
            onChange={e => setRootName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddRoot(); if (e.key === "Escape") setAddingRoot(false); }}
            placeholder="Nom du dossier"
            className="flex-1 bg-surface-800 text-slate-100 text-sm px-2 py-1 rounded border border-indigo-500 focus:outline-none"
          />
          <button onClick={handleAddRoot} className="text-emerald-400"><Check className="w-4 h-4" /></button>
          <button onClick={() => setAddingRoot(false)} className="text-slate-500"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button
          onClick={() => setAddingRoot(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-indigo-400 hover:bg-surface-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau dossier
        </button>
      )}
    </div>
  );
}
