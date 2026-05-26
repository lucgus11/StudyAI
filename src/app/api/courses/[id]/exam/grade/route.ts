import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { gradeExam } from "@/lib/groq/client";
import type { ExamQuestion } from "@/types";

export const maxDuration = 60;

/**
 * POST /api/courses/[id]/exam/grade
 * Body: { questions: ExamQuestion[], answers: Record<string, string> }
 * Grades the exam using Groq AI and persists the score to Supabase.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  try {
    const { questions, answers } = (await req.json()) as {
      questions: ExamQuestion[];
      answers: Record<string, string>;
    };

    if (!questions?.length) {
      return NextResponse.json({ error: "Questions manquantes" }, { status: 400 });
    }

    // Grade with AI
    const feedback = await gradeExam(questions, answers);

    // Persist score to Supabase
    await supabase.from("quiz_scores").insert({
      user_id: user.id,
      course_id: params.id,
      mode: "exam",
      score: feedback.score,
      total: feedback.total,
      feedback: feedback.globalFeedback,
      synced: true,
    });

    return NextResponse.json(feedback);
  } catch (err: unknown) {
    console.error("[POST /api/courses/[id]/exam/grade]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
