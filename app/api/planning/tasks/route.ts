import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    taskId?: string;
    completed?: boolean;
  } | null;

  if (!body?.taskId || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const { error } = await supabase
    .from("planning_tasks")
    .update({ completed: body.completed })
    .eq("id", body.taskId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
