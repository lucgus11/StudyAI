import { NextRequest, NextResponse } from "next/server";
import { generateCourseAnalysis, generateFlashcards, generateQuiz } from "@/lib/groq/client";
import { getAuthenticatedUser } from "@/lib/supabase/api";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Config pour augmenter la limite de taille du body (PDFs jusqu'à 25 Mo)
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  try {
    // Recevoir JSON (le PDF a déjà été uploadé côté client vers Supabase Storage)
    const body = await req.json();
    const { title, subject, pdfPath = null, pdfUrl = null } = body;

    if (!title || !subject) {
      return NextResponse.json({ error: "Titre et matière requis" }, { status: 400 });
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

    // 3. Extraire le texte du PDF depuis Supabase Storage (si disponible)
    let extractedText = "";
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        const arrayBuffer = await pdfResponse.arrayBuffer();
        extractedText = await extractTextFromPDF(arrayBuffer);
      } catch {
        extractedText = `Cours intitulé "${title}" sur la matière "${subject}".`;
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
export async function GET(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.js");
    const pdfData = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 20);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as Array<{ str?: string }>)
        .map((item) => item.str ?? "")
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim() || "Impossible d'extraire le texte du PDF.";
  } catch (err) {
    console.warn("PDF extraction failed:", err);
    return "Contenu du cours non lisible — génère des ressources pédagogiques générales sur ce sujet.";
  }
}
