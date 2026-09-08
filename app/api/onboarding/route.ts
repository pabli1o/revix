import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClasseCycle } from "@/lib/supabase/database.types";

interface OnboardingBody {
  prenom: string;
  classeCycle: ClasseCycle;
  classeNiveau: string;
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
}

const VALID_CYCLES: ClasseCycle[] = ["college", "lycee", "superieur"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<OnboardingBody>;

  if (
    !body.prenom?.trim() ||
    !body.classeCycle ||
    !VALID_CYCLES.includes(body.classeCycle) ||
    !body.classeNiveau?.trim() ||
    !body.revisionJoursSemaine ||
    !body.revisionMinutesJour
  ) {
    return NextResponse.json({ error: "Champs manquants ou invalides" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      prenom: body.prenom.trim(),
      classe_cycle: body.classeCycle,
      classe_niveau: body.classeNiveau.trim(),
      revision_jours_semaine: Math.min(7, Math.max(1, Math.round(body.revisionJoursSemaine))),
      revision_minutes_jour: Math.max(5, Math.round(body.revisionMinutesJour)),
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
