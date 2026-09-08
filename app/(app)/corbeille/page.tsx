import { createClient } from "@/lib/supabase/server";
import { TrashList, type TrashedFiche } from "@/components/corbeille/trash-list";

export default async function CorbeillePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: fiches } = await supabase
    .from("fiches")
    .select("id, titre, chapter_id, deleted_at")
    .eq("user_id", user!.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const chapterIds = [...new Set((fiches ?? []).map((f) => f.chapter_id))];
  const { data: chapters } =
    chapterIds.length > 0
      ? await supabase.from("chapters").select("id, nom, subject_id").in("id", chapterIds)
      : { data: [] };

  const subjectIds = [...new Set((chapters ?? []).map((c) => c.subject_id))];
  const { data: subjects } =
    subjectIds.length > 0
      ? await supabase.from("subjects").select("id, nom").in("id", subjectIds)
      : { data: [] };

  const chapterById = new Map((chapters ?? []).map((c) => [c.id, c]));
  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));

  const items: TrashedFiche[] = (fiches ?? []).map((f) => {
    const chapter = chapterById.get(f.chapter_id);
    const subject = chapter ? subjectById.get(chapter.subject_id) : undefined;
    return {
      id: f.id,
      titre: f.titre,
      subjectNom: subject?.nom ?? "?",
      chapterNom: chapter?.nom ?? "?",
      deletedAt: f.deleted_at!,
    };
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold">Corbeille</h1>
      <TrashList items={items} />
    </div>
  );
}
