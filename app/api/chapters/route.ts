import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    subjectId?: string;
    nom?: string;
  } | null;
  const nom = body?.nom?.trim();
  const subjectId = body?.subjectId;
  if (!nom || !subjectId) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("chapters")
    .select("id, nom, subject_id")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .ilike("nom", nom)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ chapter: existing });
  }

  const { data, error } = await supabase
    .from("chapters")
    .insert({ user_id: user.id, subject_id: subjectId, nom })
    .select("id, nom, subject_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chapter: data }, { status: 201 });
}
