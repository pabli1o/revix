import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, ctx: RouteContext<"/api/subjects/[subjectId]">) {
  const { subjectId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { nom?: string } | null;
  const nom = body?.nom?.trim();
  if (!nom) return NextResponse.json({ error: "Nom manquant" }, { status: 400 });

  const { data, error } = await supabase
    .from("subjects")
    .update({ nom })
    .eq("id", subjectId)
    .eq("user_id", user.id)
    .select("id, nom")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subject: data });
}

/** Deleting a subject cascades (see supabase/migrations/0001_init.sql) to
 * its chapters and, through those, their fiches — a hard delete, not the
 * app's soft-delete corbeille. The client confirms this with the user
 * before calling here. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/subjects/[subjectId]">) {
  const { subjectId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
