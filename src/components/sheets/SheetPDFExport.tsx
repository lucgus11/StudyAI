"use client";

import type { Sheet, Block } from "@/types";

/**
 * Génère et télécharge un PDF de la fiche de révision.
 * Utilise l'API print du navigateur avec une feuille de style dédiée.
 * style: "card" = fiche colorée style cartonné, "a4" = document sobre A4
 */
export function exportSheetToPDF(sheet: Sheet, style: "card" | "a4") {
  const html = generateHTML(sheet, style);

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Autorise les pop-ups pour télécharger le PDF.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
}

function renderBlock(block: Block, sheetColor: string, style: "card" | "a4"): string {
  switch (block.type) {
    case "heading1":
      return `<h2 class="h1">${esc(block.content)}</h2>`;
    case "heading2":
      return `<h3 class="h2">${esc(block.content)}</h3>`;
    case "text":
      return `<p class="text">${esc(block.content).replace(/\n/g, "<br>")}</p>`;
    case "definition":
      return `
        <div class="definition">
          <div class="def-term" style="background:${sheetColor}">${esc(block.subtitle ?? "")}</div>
          <div class="def-content">${esc(block.content)}</div>
        </div>`;
    case "keypoint":
      return `
        <div class="keypoint">
          <span class="star">★</span>
          <span>${esc(block.content)}</span>
        </div>`;
    case "table": {
      let headers: string[] = [];
      try { headers = JSON.parse(block.subtitle ?? "[]"); } catch { headers = []; }
      const rows = block.rows ?? [];
      const thead = headers.map(h => `<th style="background:${sheetColor}">${esc(h)}</th>`).join("");
      const tbody = rows.map(r =>
        `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`
      ).join("");
      return `<table class="table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
    }
    case "timeline": {
      const items = (block.items ?? [])
        .map(it => `
          <div class="timeline-item">
            <span class="date" style="background:${sheetColor}">${esc(it.date)}</span>
            <span class="event">${esc(it.event)}</span>
          </div>`)
        .join("");
      return `<div class="timeline">${items}</div>`;
    }
    case "formula":
      return `<div class="formula">${esc(block.content)}</div>`;
    case "divider":
      return `<hr class="divider">`;
    default:
      return "";
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateHTML(sheet: Sheet, style: "card" | "a4"): string {
  const blocksHtml = sheet.blocks.map(b => renderBlock(b, sheet.color, style)).join("\n");
  const isCard = style === "card";

  const cardStyles = isCard ? `
    body {
      background: #e2e8f0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 30px;
    }
    .sheet {
      background: ${sheet.color};
      border-radius: 12px;
      box-shadow: 4px 4px 0 rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.12);
      max-width: 700px;
      width: 100%;
      padding: 32px 36px;
      position: relative;
    }
    .sheet::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 6px;
      background: rgba(0,0,0,0.12);
      border-radius: 12px 12px 0 0;
    }
    /* Lignes horizontales style carnet */
    .sheet::after {
      content: '';
      position: absolute;
      top: 60px; left: 36px; right: 36px; bottom: 32px;
      background-image: repeating-linear-gradient(
        transparent, transparent 27px, rgba(0,0,0,0.08) 27px, rgba(0,0,0,0.08) 28px
      );
      pointer-events: none;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(0,0,0,0.15);
      position: relative;
      z-index: 1;
    }
    .content { position: relative; z-index: 1; }
  ` : `
    body { background: white; padding: 0; }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 48px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 8px;
      padding-bottom: 12px;
      border-bottom: 3px solid ${sheet.color};
    }
    .subtitle-bar {
      width: 60px;
      height: 4px;
      background: ${sheet.color};
      margin-bottom: 24px;
    }
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${esc(sheet.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

    ${cardStyles}

    .h1 {
      font-size: 17px; font-weight: 700; color: #1e293b;
      margin: 16px 0 8px; padding-bottom: 4px;
      border-bottom: 1px solid rgba(0,0,0,0.15);
    }
    .h2 { font-size: 14px; font-weight: 700; color: #334155; margin: 12px 0 6px; }
    .text { font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 8px; }

    .definition {
      margin-bottom: 8px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .def-term {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    .def-content {
      padding: 6px 10px;
      font-size: 12px;
      color: #475569;
      background: white;
    }

    .keypoint {
      display: flex; gap: 8px; align-items: flex-start;
      padding: 8px 10px;
      background: rgba(245,158,11,0.12);
      border-left: 3px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      margin-bottom: 8px;
    }
    .star { color: #f59e0b; font-size: 12px; flex-shrink: 0; margin-top: 1px; }
    .keypoint span:last-child { font-size: 12px; font-weight: 600; color: #1e293b; }

    .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
    .table th {
      padding: 5px 8px; text-align: left; font-size: 11px; font-weight: 700;
      color: #1e293b; border-right: 1px solid rgba(0,0,0,0.1);
    }
    .table td { padding: 4px 8px; color: #475569; border: 1px solid rgba(0,0,0,0.08); }
    .table tbody tr:nth-child(even) { background: rgba(255,255,255,0.5); }

    .timeline { margin-bottom: 8px; }
    .timeline-item { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 4px; }
    .date {
      font-size: 10px; font-weight: 700; font-family: monospace;
      padding: 2px 6px; border-radius: 4px; flex-shrink: 0; color: #1e293b;
    }
    .event { font-size: 12px; color: #475569; padding-top: 2px; }

    .formula {
      font-family: monospace; font-size: 14px; text-align: center;
      padding: 8px 16px; background: rgba(255,255,255,0.7);
      border: 1px solid rgba(0,0,0,0.12); border-radius: 8px;
      margin-bottom: 8px; color: #1e293b;
    }

    .divider { border: none; border-top: 1px solid rgba(0,0,0,0.15); margin: 12px 0; }

    .footer {
      margin-top: 20px;
      font-size: 10px;
      color: rgba(0,0,0,0.3);
      text-align: right;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="title">${esc(sheet.title)}</div>
    ${!isCard ? '<div class="subtitle-bar"></div>' : ""}
    <div class="content">
      ${blocksHtml}
    </div>
    <div class="footer">StudyAI · ${new Date().toLocaleDateString("fr-FR")}</div>
  </div>
</body>
</html>`;
}
