"use client";

/**
 * Extrait le texte d'un fichier PDF cote navigateur via PDF.js.
 * Plus fiable que l'extraction serveur car PDF.js est concu pour le browser.
 */
export async function extractTextFromPDFClient(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");

    // Worker via CDN pour eviter les problemes de bundle Webpack
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" +
      pdfjsLib.version +
      "/pdf.worker.min.js";

    const pdfData = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 30);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    // Nettoyer les caracteres de controle
    return fullText
      .split("")
      .filter((ch) => {
        const c = ch.charCodeAt(0);
        return c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127);
      })
      .join("")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{4,}/g, "\n\n")
      .trim();
  } catch (err) {
    console.warn("Extraction PDF echouee:", err);
    return "";
  }
}
