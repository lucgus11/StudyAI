import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError }, { status: 401 });

  const { name, parent_id } = await req.json();

  const { data, error } = await supabase
    .from("folders")
    .update({ name: name?.trim(), parent_id: parent_id ?? null })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) return NextResponse.json({ error: authError }, { status: 401 });

  // Remettre les fiches du dossier à la racine
  await supabase.from("sheets").update({ folder_id: null })
    .eq("folder_id", params.id).eq("user_id", user.id);

  const { error } = await supabase.from("folders")
    .delete().eq("id", params.id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
