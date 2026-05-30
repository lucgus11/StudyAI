"use client";

import { useState, useCallback } from "react";
import {
  Type, Heading1, Heading2, List, Star, Table2,
  Clock, Divide, Plus, Trash2, GripVertical,
  ChevronUp, ChevronDown, Sigma
} from "lucide-react";
import type { Block, BlockType, Sheet, SHEET_COLORS } from "@/types";
import { SHEET_COLORS as COLORS } from "@/types";
import { clsx } from "clsx";

interface Props {
  sheet: Sheet;
  onChange: (sheet: Sheet) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; description: string }[] = [
  { type: "heading1",   label: "Titre principal",    icon: Heading1,  description: "Grand titre de section" },
  { type: "heading2",   label: "Sous-titre",         icon: Heading2,  description: "Titre de sous-section" },
  { type: "text",       label: "Texte libre",        icon: Type,      description: "Paragraphe de texte" },
  { type: "definition", label: "Définition",         icon: List,      description: "Terme + définition" },
  { type: "keypoint",   label: "Point clé",          icon: Star,      description: "Point important à retenir" },
  { type: "table",      label: "Tableau",            icon: Table2,    description: "Tableau personnalisable" },
  { type: "timeline",   label: "Chronologie",        icon: Clock,     description: "Suite d'événements datés" },
  { type: "formula",    label: "Formule",            icon: Sigma,     description: "Formule ou équation" },
  { type: "divider",    label: "Séparateur",         icon: Divide,    description: "Ligne de séparation" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultBlock(type: BlockType): Block {
  const id = generateId();
  switch (type) {
    case "heading1":   return { id, type, content: "Titre principal" };
    case "heading2":   return { id, type, content: "Sous-titre" };
    case "text":       return { id, type, content: "Écris ton texte ici…" };
    case "definition": return { id, type, content: "Définition du terme", subtitle: "Terme" };
    case "keypoint":   return { id, type, content: "Point important à retenir", color: "#f59e0b" };
    case "table":      return { id, type, content: "", subtitle: JSON.stringify(["Colonne 1", "Colonne 2"]), rows: [["", ""]] };
    case "timeline":   return { id, type, content: "", items: [{ date: "Date", event: "Événement" }] };
    case "formula":    return { id, type, content: "f(x) = …" };
    case "divider":    return { id, type, content: "" };
  }
}

// ---- Rendu d'un bloc en mode lecture ----
export function BlockPreview({ block, sheetColor }: { block: Block; sheetColor: string }) {
  switch (block.type) {
    case "heading1":
      return (
        <h2 className="font-display text-xl font-bold mt-4 mb-2 text-slate-900">
          {block.content}
        </h2>
      );
    case "heading2":
      return (
        <h3 className="font-display text-base font-bold mt-3 mb-1.5 text-slate-800">
          {block.content}
        </h3>
      );
    case "text":
      return <p className="text-sm text-slate-700 leading-relaxed mb-2 whitespace-pre-wrap">{block.content}</p>;
    case "definition":
      return (
        <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
          <div className="px-3 py-1.5 text-xs font-bold text-slate-800"
            style={{ backgroundColor: sheetColor }}>
            {block.subtitle}
          </div>
          <div className="px-3 py-2 text-sm text-slate-700 bg-white">{block.content}</div>
        </div>
      );
    case "keypoint":
      return (
        <div className="flex gap-2 mb-2 p-2.5 rounded-lg"
          style={{ backgroundColor: "rgba(245,158,11,0.1)", borderLeft: "3px solid #f59e0b" }}>
          <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-slate-800">{block.content}</p>
        </div>
      );
    case "table": {
      let headers: string[] = [];
      try { headers = JSON.parse(block.subtitle ?? "[]"); } catch { headers = []; }
      return (
        <div className="mb-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: sheetColor }}>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-1.5 text-left text-xs font-bold text-slate-800 border-r border-slate-200 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.rows ?? []).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-slate-700 border-r border-slate-100 last:border-0">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "timeline":
      return (
        <div className="mb-2 space-y-1.5">
          {(block.items ?? []).map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5"
                style={{ backgroundColor: sheetColor, color: "#1e293b" }}>
                {item.date}
              </span>
              <span className="text-sm text-slate-700">{item.event}</span>
            </div>
          ))}
        </div>
      );
    case "formula":
      return (
        <div className="mb-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-sm text-slate-800 text-center">
          {block.content}
        </div>
      );
    case "divider":
      return <hr className="my-3 border-slate-300" />;
    default:
      return null;
  }
}

// ---- Éditeur d'un bloc ----
function BlockEditor({
  block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300";

  return (
    <div className="group relative border rounded-xl p-3 bg-white"
      style={{ borderColor: "#e2e8f0" }}>
      {/* Actions du bloc */}
      <div className="absolute -right-2 top-2 hidden group-hover:flex flex-col gap-1">
        <button onClick={onMoveUp} disabled={isFirst}
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-500 disabled:opacity-30 shadow-sm">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={onMoveDown} disabled={isLast}
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-500 disabled:opacity-30 shadow-sm">
          <ChevronDown className="w-3 h-3" />
        </button>
        <button onClick={onDelete}
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-red-400 hover:text-red-600 shadow-sm">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-slate-300" />
        <span className="text-xs font-medium text-slate-400">
          {BLOCK_TYPES.find(b => b.type === block.type)?.label}
        </span>
      </div>

      {/* Champs selon le type */}
      {block.type === "heading1" || block.type === "heading2" ? (
        <input value={block.content} onChange={e => onChange({ ...block, content: e.target.value })}
          className={clsx(inputClass, block.type === "heading1" ? "text-base font-bold" : "font-semibold")}
          placeholder="Titre…" />
      ) : block.type === "text" ? (
        <textarea value={block.content} onChange={e => onChange({ ...block, content: e.target.value })}
          className={inputClass} rows={3} placeholder="Texte libre…" />
      ) : block.type === "definition" ? (
        <div className="space-y-2">
          <input value={block.subtitle ?? ""} onChange={e => onChange({ ...block, subtitle: e.target.value })}
            className={inputClass} placeholder="Terme à définir" />
          <textarea value={block.content} onChange={e => onChange({ ...block, content: e.target.value })}
            className={inputClass} rows={2} placeholder="Définition…" />
        </div>
      ) : block.type === "keypoint" ? (
        <textarea value={block.content} onChange={e => onChange({ ...block, content: e.target.value })}
          className={inputClass} rows={2} placeholder="Point important…" />
      ) : block.type === "formula" ? (
        <input value={block.content} onChange={e => onChange({ ...block, content: e.target.value })}
          className={clsx(inputClass, "font-mono")} placeholder="f(x) = …" />
      ) : block.type === "table" ? (
        <TableEditor block={block} onChange={onChange} />
      ) : block.type === "timeline" ? (
        <TimelineEditor block={block} onChange={onChange} />
      ) : block.type === "divider" ? (
        <hr className="border-slate-200" />
      ) : null}
    </div>
  );
}

function TableEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  let headers: string[] = [];
  try { headers = JSON.parse(block.subtitle ?? "[]"); } catch { headers = ["Col 1", "Col 2"]; }
  const rows = block.rows ?? [["", ""]];

  const setHeaders = (h: string[]) => onChange({ ...block, subtitle: JSON.stringify(h) });
  const setRows = (r: string[][]) => onChange({ ...block, rows: r });

  const addCol = () => {
    setHeaders([...headers, `Col ${headers.length + 1}`]);
    setRows(rows.map(r => [...r, ""]));
  };
  const addRow = () => setRows([...rows, new Array(headers.length).fill("")]);
  const removeCol = (ci: number) => {
    setHeaders(headers.filter((_, i) => i !== ci));
    setRows(rows.map(r => r.filter((_, i) => i !== ci)));
  };
  const removeRow = (ri: number) => setRows(rows.filter((_, i) => i !== ri));

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex gap-1">
        {headers.map((h, ci) => (
          <div key={ci} className="flex items-center gap-1 flex-1 min-w-[80px]">
            <input value={h}
              onChange={e => setHeaders(headers.map((hh, i) => i === ci ? e.target.value : hh))}
              className="flex-1 text-xs font-bold border border-slate-200 rounded px-2 py-1 bg-slate-50 min-w-0"
              placeholder={`Col ${ci + 1}`} />
            {headers.length > 1 && (
              <button onClick={() => removeCol(ci)} className="text-red-300 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button onClick={addCol} className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-500 hover:bg-indigo-100">+col</button>
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1 items-center">
          {row.map((cell, ci) => (
            <input key={ci} value={cell}
              onChange={e => setRows(rows.map((r, rri) => rri === ri ? r.map((c, cci) => cci === ci ? e.target.value : c) : r))}
              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 min-w-[80px]"
              placeholder="…" />
          ))}
          <button onClick={() => removeRow(ri)} className="text-red-300 hover:text-red-500">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button onClick={addRow} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">+ ligne</button>
    </div>
  );
}

function TimelineEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const items = block.items ?? [];
  const setItems = (it: typeof items) => onChange({ ...block, items: it });

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={item.date}
            onChange={e => setItems(items.map((it, ii) => ii === i ? { ...it, date: e.target.value } : it))}
            className="w-24 text-xs font-mono border border-slate-200 rounded px-2 py-1 flex-shrink-0"
            placeholder="Date" />
          <input value={item.event}
            onChange={e => setItems(items.map((it, ii) => ii === i ? { ...it, event: e.target.value } : it))}
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1"
            placeholder="Événement" />
          <button onClick={() => setItems(items.filter((_, ii) => ii !== i))}
            className="text-red-300 hover:text-red-500 flex-shrink-0">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button onClick={() => setItems([...items, { date: "", event: "" }])}
        className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
        + événement
      </button>
    </div>
  );
}

// ---- Composant principal ----
export default function SheetEditor({ sheet, onChange }: Props) {
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  const updateBlock = useCallback((index: number, block: Block) => {
    const blocks = [...sheet.blocks];
    blocks[index] = block;
    onChange({ ...sheet, blocks });
  }, [sheet, onChange]);

  const deleteBlock = useCallback((index: number) => {
    onChange({ ...sheet, blocks: sheet.blocks.filter((_, i) => i !== index) });
  }, [sheet, onChange]);

  const moveBlock = useCallback((index: number, dir: -1 | 1) => {
    const blocks = [...sheet.blocks];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    [blocks[index], blocks[newIdx]] = [blocks[newIdx], blocks[index]];
    onChange({ ...sheet, blocks });
  }, [sheet, onChange]);

  const addBlock = (type: BlockType) => {
    onChange({ ...sheet, blocks: [...sheet.blocks, defaultBlock(type)] });
    setShowBlockPicker(false);
  };

  return (
    <div className="space-y-3">
      {/* Sélecteur de couleur */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Couleur :</span>
        {COLORS.map((c) => (
          <button key={c.value} onClick={() => onChange({ ...sheet, color: c.value })}
            className="w-6 h-6 rounded-full border-2 transition-all"
            style={{
              backgroundColor: c.value,
              borderColor: sheet.color === c.value ? "#6366f1" : "transparent",
              transform: sheet.color === c.value ? "scale(1.2)" : "scale(1)",
            }}
            title={c.label} />
        ))}
      </div>

      {/* Blocs existants */}
      <div className="space-y-2">
        {sheet.blocks.map((block, i) => (
          <BlockEditor
            key={block.id}
            block={block}
            onChange={(b) => updateBlock(i, b)}
            onDelete={() => deleteBlock(i)}
            onMoveUp={() => moveBlock(i, -1)}
            onMoveDown={() => moveBlock(i, 1)}
            isFirst={i === 0}
            isLast={i === sheet.blocks.length - 1}
          />
        ))}
      </div>

      {/* Ajouter un bloc */}
      <div className="relative">
        <button
          onClick={() => setShowBlockPicker(!showBlockPicker)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-all"
          style={{ borderColor: "#334155", color: "#64748b" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#818cf8"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#64748b"; }}
        >
          <Plus className="w-4 h-4" />
          Ajouter un bloc
        </button>

        {showBlockPicker && (
          <div className="absolute bottom-full mb-2 left-0 right-0 z-20 rounded-xl shadow-2xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
            style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon;
              return (
                <button key={bt.type} onClick={() => addBlock(bt.type)}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-left transition-all hover:bg-indigo-900/40 group">
                  <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{bt.label}</p>
                    <p className="text-xs text-slate-500 hidden sm:block">{bt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
