import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError }, { status: 401 });

  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await req.json();
  const { title, color, blocks, course_id } = body;

  const { data, error } = await supabase
    .from("sheets")
    .insert({ user_id: user.id, title, color, blocks: blocks ?? [], course_id: course_id ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
