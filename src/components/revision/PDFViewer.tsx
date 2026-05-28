"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, FileText } from "lucide-react";

interface Props {
  pdfUrl: string;
  title: string;
}

export default function PDFViewer({ pdfUrl, title }: Props) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  // On utilise l'iframe avec le viewer natif du navigateur
  // C'est la solution la plus universelle et fiable sans dépendances
  const pdfWithParams = `${pdfUrl}#page=${page}&zoom=${zoom}`;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "600px" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-t-xl flex-wrap"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
      >
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom */}
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-400 w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            title="Zoom avant"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: "#334155" }} />

          {/* Pages */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            disabled={page <= 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-400 w-8 text-center">p.{page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: "#334155" }} />

          {/* Ouvrir dans un nouvel onglet */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 rounded-b-xl overflow-hidden" style={{ border: "1px solid #334155", borderTop: "none" }}>
        <iframe
          src={pdfWithParams}
          className="w-full h-full"
          style={{ minHeight: "580px", backgroundColor: "#f8fafc" }}
          title={title}
        />
      </div>
    </div>
  );
}
