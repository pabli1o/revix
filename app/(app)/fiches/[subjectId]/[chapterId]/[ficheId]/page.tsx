import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { FicheViewer } from "@/components/fiches/fiche-viewer";

export default async function FichePage(
  props: PageProps<"/fiches/[subjectId]/[chapterId]/[ficheId]">,
) {
  const { subjectId, chapterId, ficheId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subject }, { data: fiche }, { data: allSubjects }, subscription] =
    await Promise.all([
      supabase.from("subjects").select("id, nom").eq("id", subjectId).eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("fiches")
        .select("id, titre, contenu")
        .eq("id", ficheId)
        .eq("chapter_id", chapterId)
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase.from("subjects").select("nom").eq("user_id", user!.id),
      getSubscriptionInfo(user!.id),
    ]);

  if (!subject || !fiche) notFound();

  const color = assignSubjectColors((allSubjects ?? []).map((s) => s.nom)).get(subject.nom)!;

  return (
    <FicheViewer
      ficheId={fiche.id}
      titre={fiche.titre}
      contenu={fiche.contenu}
      isSubscribed={subscription.isActive}
      color={color}
      backHref={`/fiches/${subjectId}/${chapterId}`}
    />
  );
}
