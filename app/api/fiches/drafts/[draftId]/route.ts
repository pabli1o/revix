import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FicheDraftResponse } from "@/lib/fiches/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/fiches/drafts/[draftId]">) {
  const { draftId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: draft } = await supabase
    .from("fiche_drafts")
    .select("id, items, sources")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!draft) {
    return NextResponse.json({ error: "Brouillon introuvable ou expiré" }, { status: 404 });
  }

  const response: FicheDraftResponse = { id: draft.id, items: draft.items, sources: draft.sources };
  return NextResponse.json(response);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/fiches/drafts/[draftId]">,
) {
  const { draftId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await supabase.from("fiche_drafts").delete().eq("id", draftId).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
