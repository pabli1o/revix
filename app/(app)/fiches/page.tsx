import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { AppHeader } from "@/components/layout/app-header";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";
import { Button } from "@/components/ui/button";

export default async function FichesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subjects }, { data: chapters }] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase.from("chapters").select("id, subject_id").eq("user_id", user!.id),
  ]);

  const colors = assignSubjectColors((subjects ?? []).map((s) => s.nom));
  const chapterCountBySubject = new Map<string, number>();
  for (const c of chapters ?? []) {
    chapterCountBySubject.set(c.subject_id, (chapterCountBySubject.get(c.subject_id) ?? 0) + 1);
  }

  const items: TileItem[] = (subjects ?? []).map((s) => {
    const chapterCount = chapterCountBySubject.get(s.id) ?? 0;
    return {
      id: s.id,
      nom: s.nom,
      count: chapterCount,
      countLabel: `${chapterCount} chapitre${chapterCount !== 1 ? "s" : ""}`,
      color: colors.get(s.nom)!,
      href: `/fiches/${s.id}`,
      renameUrl: `/api/subjects/${s.id}`,
    };
  });

  const isEmpty = items.length === 0;

  return (
    <div>
      <AppHeader />
      {!isEmpty && (
        <div className="mb-6 flex items-center justify-end">
          <Link href="/fiches/new">
            <Button>+ Nouvelle fiche</Button>
          </Link>
        </div>
      )}
      <TileGrid
        items={items}
        emptyMessage="Aucune fiche pour l'instant. Appuie sur « + Créer une fiche » pour commencer."
        allowDelete
        deleteWarning="Supprimer la matière « {nom} » ? Tous ses chapitres et toutes ses fiches seront définitivement supprimés (sans passer par la corbeille)."
      />
      {isEmpty && (
        <Link href="/fiches/new" className="mt-6 block">
          <Button className="w-full">+ Créer une fiche</Button>
        </Link>
      )}
    </div>
  );
}
