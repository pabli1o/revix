import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, ctx: RouteContext<"/api/fiches/[ficheId]">) {
  const { ficheId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { titre?: string } | null;
  const titre = body?.titre?.trim();
  if (!titre) return NextResponse.json({ error: "Titre manquant" }, { status: 400 });

  const { data, error } = await supabase
    .from("fiches")
    .update({ titre })
    .eq("id", ficheId)
    .eq("user_id", user.id)
    .select("id, titre")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fiche: data });
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/fiches/[ficheId]">) {
  const { ficheId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const permanent = request.nextUrl.searchParams.get("permanent") === "1";

  if (permanent) {
    const { error } = await supabase
      .from("fiches")
      .delete()
      .eq("id", ficheId)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("fiches")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", ficheId)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
