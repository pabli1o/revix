import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateDraftRequest, CreateDraftResponse } from "@/lib/fiches/types";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Stores the reviewed-but-not-yet-assigned fiches so they survive the full
 * page navigation to Whop Checkout and back (see
 * app/(app)/fiches/new/assign/page.tsx). Deleted once actually saved via
 * DELETE /api/fiches/drafts/[draftId].
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t.errors.common.unauthenticated }, { status: 401 });

  const body = (await request.json().catch(() => null)) as CreateDraftRequest | null;
  const items = body?.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: t.errors.fiches.noFicheToSave }, { status: 400 });
  }
  for (const item of items) {
    if (!item.titre?.trim() || !item.contenu) {
      return NextResponse.json({ error: t.errors.fiches.invalidFiche }, { status: 400 });
    }
  }

  const { data: draft, error } = await supabase
    .from("fiche_drafts")
    .insert({ user_id: user.id, items, sources: body?.sources ?? [] })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response: CreateDraftResponse = { draftId: draft.id };
  return NextResponse.json(response);
}
