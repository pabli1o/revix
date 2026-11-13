import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { AppHeader } from "@/components/layout/app-header";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";
import { Button } from "@/components/ui/button";
import { FloatingBottomBar } from "@/components/layout/floating-bottom-bar";
import { FicheSavedToast } from "@/components/fiches/fiche-saved-toast";
import { getDictionary } from "@/lib/i18n/server";

export default async function FichesPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const profile = await getProfile();
  const t = await getDictionary();

  const [{ data: subjects }, { data: chapters }] = user
    ? await Promise.all([
        supabase.from("subjects").select("id, nom").eq("user_id", user.id).order("nom"),
        supabase.from("chapters").select("id, subject_id").eq("user_id", user.id),
      ])
    : [{ data: [] }, { data: [] }];

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
      countLabel: t.fiches.chapterCount(chapterCount),
      color: colors.get(s.nom)!,
      href: `/fiches/${s.id}`,
      renameUrl: `/api/subjects/${s.id}`,
    };
  });

  const isEmpty = items.length === 0;

  return (
    <div className="pb-24">
      <FicheSavedToast />
      <AppHeader variant="hero" />
      {isEmpty ? (
        // One centered card (title + one sentence + the CTA, all inside
        // it) instead of the generic TileGrid empty state plus a separate
        // welcome banner — see lib/i18n/dictionaries/*\/fiches.ts's
        // emptyStateTitle/emptyStateBody/createFicheCta. The sticky
        // bottom bar is for once fiches exist (below); here the button
        // lives in the card itself.
        <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-bg-card px-6 py-10 text-center">
          <h2 className="font-heading text-xl font-semibold">{t.fiches.emptyStateTitle}</h2>
          <p className="text-sm text-text-muted">{t.fiches.emptyStateBody(profile?.prenom ?? null)}</p>
          <Link href="/fiches/new" prefetch={true} className="w-full">
            <Button size="lg" className="w-full">
              {t.fiches.createFicheCta}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-text-muted">{t.fiches.clickSubjectHint}</p>
          <TileGrid
            items={items}
            emptyMessage={t.fiches.emptySubjects}
            allowDelete
            deleteWarning={t.fiches.deleteSubjectWarning}
          />
          <FloatingBottomBar>
            <Link href="/fiches/new" prefetch={true} className="block">
              <Button size="lg" className="w-full">
                {t.fiches.createFiche}
              </Button>
            </Link>
          </FloatingBottomBar>
        </>
      )}
    </div>
  );
}
