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

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    prenom: body.prenom.trim(),
    classe_cycle: body.classeCycle,
    classe_niveau: body.classeNiveau.trim(),
    revision_jours_semaine: Math.min(7, Math.max(1, Math.round(body.revisionJoursSemaine))),
    revision_minutes_jour: Math.max(5, Math.round(body.revisionMinutesJour)),
    onboarding_completed: true,
  });

  if (error) {
    // 42P01 = undefined_table: the `profiles` table doesn't exist yet,
    // which means the SQL migrations in supabase/migrations/ were never
    // applied to this Supabase project (see README "Migrations SQL").
    const message =
      error.code === "42P01"
        ? "La base de données n'est pas encore initialisée (migrations SQL manquantes). Contacte l'administrateur du site."
        : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
