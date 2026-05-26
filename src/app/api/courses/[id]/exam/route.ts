import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { generateExam } from "@/lib/groq/client";

export const maxDuration = 60;

/**
 * POST /api/courses/[id]/exam
 * Body: { duration: number } (minutes)
 * Generates a timed exam from the course content using Groq AI.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  try {
    const { duration = 60 } = await req.json();

    // Fetch course content
    const { data: course, error } = await supabase
      .from("courses")
      .select("id, user_id, summary, key_concepts, subject, title")
      .eq("id", params.id)
      .single();

    if (error || !course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }
    if (course.user_id !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Build context text from stored AI content
    const context = [
      `Matière: ${course.subject}`,
      `Titre: ${course.title}`,
      course.summary ? `Résumé:\n${course.summary.replace(/<[^>]*>/g, "")}` : "",
      Array.isArray(course.key_concepts)
        ? `Concepts clés: ${(course.key_concepts as string[]).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const questions = await generateExam(context, duration);

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    console.error("[POST /api/courses/[id]/exam]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
