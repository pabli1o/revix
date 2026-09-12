import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { AppHeader } from "@/components/layout/app-header";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";
import { Button } from "@/components/ui/button";
import { FloatingBottomBar } from "@/components/layout/floating-bottom-bar";

export default async function FichesPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const profile = await getProfile();

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
    <div className="pb-24">
      <AppHeader />
      {!isEmpty && (
        <p className="mb-6 text-sm text-text-muted">
          📚 Clique sur une matière pour voir ses chapitres.
        </p>
      )}
      <TileGrid
        items={items}
        emptyMessage="Aucune fiche pour l'instant. Appuie sur « + Créer une fiche » pour commencer."
        allowDelete
        deleteWarning="Supprimer la matière « {nom} » ? Tous ses chapitres et toutes ses fiches seront définitivement supprimés (sans passer par la corbeille)."
      />
      {isEmpty && profile?.prenom && (
        <p className="mt-6 rounded-2xl border border-success bg-[#123424] px-4 py-3 text-center text-sm text-success">
          Bienvenue, {profile.prenom} ! Crée ta première fiche pour commencer.
        </p>
      )}

      <FloatingBottomBar>
        <Link href="/fiches/new" className="block">
          <Button size="lg" className="w-full">
            + Créer une fiche
          </Button>
        </Link>
      </FloatingBottomBar>
    </div>
  );
}
