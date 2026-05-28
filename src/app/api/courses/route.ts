import { NextRequest, NextResponse } from "next/server";
import { generateCourseAnalysis, generateFlashcards, generateQuiz } from "@/lib/groq/client";
import { getAuthenticatedUser } from "@/lib/supabase/api";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Nettoie le texte extrait du PDF.
 * Utilise charCodeAt pour éviter les octets nuls dans les regex
 * qui font crasher le compilateur SWC de Next.js.
 */
function sanitizeText(text: string): string {
  // Filtrer les caractères de contrôle via leur code
  const filtered = text
    .split("")
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127);
    })
    .join("");

  return filtered
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\uFFFD/g, "")
    .replace(/\uFFFE/g, "")
    .replace(/\uFFFF/g, "")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError ?? "Non authentifie" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, subject, pdfPath = null, pdfUrl = null, extractedText: clientText = "" } = body;

    if (!title || !subject) {
      return NextResponse.json({ error: "Titre et matiere requis" }, { status: 400 });
    }

    // 1. Creer le cours en base
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

    if (insertError) throw new Error("Erreur BDD: " + insertError.message);

    // 2. Utiliser le texte extrait cote client (fiable) ou le fallback
    let extractedText = "";
    if (clientText && clientText.length > 100) {
      // Texte extrait par PDF.js dans le navigateur - le plus precis
      extractedText = sanitizeText(clientText);
    } else {
      // Pas de PDF ou extraction echouee : fallback sur les connaissances de l'IA
      extractedText = buildFallbackContext(title, subject);
    }

    // 3. Analyse IA en parallele
    const [analysis, flashcards, quizQuestions] = await Promise.all([
      generateCourseAnalysis(extractedText, title, subject),
      generateFlashcards(extractedText, 20, title, subject),
      generateQuiz(extractedText, 10, title, subject),
    ]);

    // 4. Mettre a jour le cours avec le contenu IA
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

    if (updateError) throw new Error("Erreur mise a jour: " + updateError.message);

    return NextResponse.json({ id: course.id, success: true });
  } catch (err: unknown) {
    console.error("[POST /api/courses]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError ?? "Non authentifie" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

function buildFallbackContext(title: string, subject: string): string {
  return (
    "MATIERE : " + subject + "\n" +
    "TITRE DU COURS : " + title + "\n\n" +
    "Ce cours porte sur \"" + title + "\" dans la discipline \"" + subject + "\".\n" +
    "Genere un contenu academique reel et precis sur ce sujet.\n" +
    "Ne parle PAS de pedagogie ou de methodes d'enseignement.\n" +
    "Traite directement du contenu academique de \"" + title + "\" en \"" + subject + "\"."
  );
}

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

    return fullText.trim() || buildFallbackContext("cours", "la matiere");
  } catch (err) {
    console.warn("PDF extraction failed:", err);
    return "";
  }
}
