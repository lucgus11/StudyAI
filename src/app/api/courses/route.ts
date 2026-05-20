import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCourseAnalysis, generateFlashcards, generateQuiz } from "@/lib/groq/client";

export const maxDuration = 60; // Vercel function timeout (seconds)

/**
 * POST /api/courses
 * Accepts multipart/form-data with: title, subject, pdf (optional)
 * 1. Uploads the PDF to Supabase Storage
 * 2. Inserts the course record
 * 3. Runs Groq AI analysis (summary, glossary, flashcards, quiz)
 * 4. Updates the course record with generated content
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const pdfFile = formData.get("pdf") as File | null;

    if (!title || !subject) {
      return NextResponse.json({ error: "Titre et matière requis" }, { status: 400 });
    }

    // 1. Upload PDF to Supabase Storage (if provided)
    let pdfPath: string | null = null;
    let pdfUrl: string | null = null;

    if (pdfFile && pdfFile.size > 0) {
      const fileName = `${user.id}/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("course-pdfs")
        .upload(fileName, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw new Error(`Erreur upload: ${uploadError.message}`);
      pdfPath = uploadData.path;

      const { data: urlData } = supabase.storage
        .from("course-pdfs")
        .getPublicUrl(pdfPath);
      pdfUrl = urlData.publicUrl;
    }

    // 2. Create course record immediately
    const { data: course, error: insertError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        title,
        subject,
        pdf_path: pdfPath,
        pdf_url: pdfUrl,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Erreur BDD: ${insertError.message}`);

    // 3. Extract PDF text if available
    let extractedText = "";
    if (pdfFile && pdfFile.size > 0) {
      try {
        // Basic text extraction via PDF.js on server is complex —
        // we use the raw text content approach for server-side.
        // For production, consider a dedicated PDF parsing service.
        // Here we send the PDF as base64 to a text extraction helper.
        const arrayBuffer = await pdfFile.arrayBuffer();
        extractedText = await extractTextFromPDF(arrayBuffer);
      } catch {
        extractedText = `Cours sur le sujet : ${subject}. Titre : ${title}.`;
      }
    } else {
      extractedText = `Cours intitulé "${title}" sur la matière "${subject}". 
      Génère des ressources pédagogiques complètes sur ce sujet.`;
    }

    // 4. Run AI analysis in parallel
    const [analysis, flashcards, quizQuestions] = await Promise.all([
      generateCourseAnalysis(extractedText),
      generateFlashcards(extractedText, 20),
      generateQuiz(extractedText, 10),
    ]);

    // 5. Update course record with AI content
    const { error: updateError } = await supabase
      .from("courses")
      .update({
        summary: analysis.summary,
        glossary: analysis.glossary,
        key_concepts: analysis.key_concepts,
        flashcards: flashcards,
        quiz_questions: quizQuestions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);

    if (updateError) throw new Error(`Erreur mise à jour: ${updateError.message}`);

    return NextResponse.json({ id: course.id, success: true });
  } catch (err: unknown) {
    console.error("[POST /api/courses]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses
 * Returns the authenticated user's courses list.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Basic PDF text extraction using pdfjs-dist in a server context.
 * Falls back gracefully if extraction fails.
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
    const pdfData = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
    const pdf = await loadingTask.promise;

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 20); // Cap at 20 pages for performance

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: { str?: string }) => item.str ?? "")
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim() || "Impossible d'extraire le texte du PDF.";
  } catch (err) {
    console.warn("PDF extraction failed:", err);
    return "Contenu du cours non lisible — génère des ressources pédagogiques générales sur ce sujet.";
  }
}
