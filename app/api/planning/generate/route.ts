import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPlanningTasks } from "@/lib/planning/build-plan";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const tasks = await buildPlanningTasks(supabase, user.id);

  const today = new Date().toISOString().slice(0, 10);

  // Replace only future, not-yet-completed tasks — history and anything
  // already checked off is left untouched.
  const { error: deleteError } = await supabase
    .from("planning_tasks")
    .delete()
    .eq("user_id", user.id)
    .eq("completed", false)
    .gte("date", today);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (tasks.length > 0) {
    const { error: insertError } = await supabase.from("planning_tasks").insert(
      tasks.map((t) => ({
        user_id: user.id,
        exam_id: t.examId,
        chapter_id: t.chapterId,
        date: t.date,
        type: t.type,
        parties: t.parties,
        duree_minutes: t.dureeMinutes,
      })),
    );
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: tasks.length });
}
