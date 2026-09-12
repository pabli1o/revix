import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { PROFILE_CACHE_TAG } from "@/lib/supabase/profile";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [{ data: profile }, subscription] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getSubscriptionInfo(user.id),
  ]);

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile,
    subscription,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { prenom?: string; nom?: string } | null;
  if (!body || (body.prenom === undefined && body.nom === undefined)) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const fields: { prenom?: string; nom?: string | null } = {};
  if (body.prenom !== undefined) {
    const trimmed = body.prenom.trim();
    if (!trimmed) return NextResponse.json({ error: "Le prénom ne peut pas être vide" }, { status: 400 });
    fields.prenom = trimmed;
  }
  if (body.nom !== undefined) {
    fields.nom = body.nom.trim() || null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", user.id)
    .select("prenom, nom")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // { expire: 0 }, not the recommended "max" profile — see the comment in
  // app/api/onboarding/route.ts: "max" would let the very next read (e.g.
  // <AppHeader />'s greeting right after this save) still show the old
  // name while revalidating in the background.
  revalidateTag(PROFILE_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ profile });
}
