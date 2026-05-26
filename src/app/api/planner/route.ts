import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";
import { generateStudyPlan } from "@/lib/groq/client";
import type { PlannerFormData } from "@/types";

export const maxDuration = 60;

/**
 * POST /api/planner
 * Body: PlannerFormData
 * Generates a personalised study plan using Groq AI and persists it to Supabase.
 */
export async function POST(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  try {
    const body = (await req.json()) as PlannerFormData;

    if (!body.exams?.length) {
      return NextResponse.json({ error: "Au moins un examen est requis" }, { status: 400 });
    }

    // Generate plan via Groq
    const planDays = await generateStudyPlan(body);

    // Upsert – one plan per user (replace previous)
    const { data: existing } = await supabase
      .from("study_plans")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (existing?.id) {
      await supabase
        .from("study_plans")
        .update({
          plan_data: planDays,
          weeks_count: body.weeksBeforeStart,
          daily_hours: body.dailyHours,
          rest_days: body.restDays,
          generated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("study_plans").insert({
        user_id: user.id,
        plan_data: planDays,
        weeks_count: body.weeksBeforeStart,
        daily_hours: body.dailyHours,
        rest_days: body.restDays,
        generated_at: new Date().toISOString(),
      });
    }

    // Also save exams
    if (body.exams.length) {
      // Delete old exams and re-insert
      await supabase.from("exams").delete().eq("user_id", user.id);
      await supabase.from("exams").insert(
        body.exams.map((e) => ({
          user_id: user.id,
          subject: e.subject,
          exam_date: e.date,
          notes: e.importance,
        }))
      );
    }

    return NextResponse.json({ success: true, days: planDays.length });
  } catch (err: unknown) {
    console.error("[POST /api/planner]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
