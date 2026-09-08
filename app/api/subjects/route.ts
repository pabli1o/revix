import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { nom?: string } | null;
  const nom = body?.nom?.trim();
  if (!nom) return NextResponse.json({ error: "Nom de matière manquant" }, { status: 400 });

  const { data: existing } = await supabase
    .from("subjects")
    .select("id, nom")
    .eq("user_id", user.id)
    .ilike("nom", nom)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ subject: existing });
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, nom })
    .select("id, nom")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subject: data }, { status: 201 });
}
