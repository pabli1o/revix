import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    revisionJoursSemaine?: number;
    revisionMinutesJour?: number;
  } | null;

  if (!body?.revisionJoursSemaine || !body.revisionMinutesJour) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      revision_jours_semaine: Math.min(7, Math.max(1, Math.round(body.revisionJoursSemaine))),
      revision_minutes_jour: Math.max(5, Math.round(body.revisionMinutesJour)),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
