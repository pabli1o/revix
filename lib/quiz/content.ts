import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { FicheContenu } from "@/lib/supabase/database.types";

function ficheContenuToText(titre: string, contenu: FicheContenu): string {
  const lines: string[] = [`# ${titre}`];
  for (const section of contenu.plan) {
    lines.push(`## ${section.numero}. ${section.titre}`);
    for (const sp of section.sousPoints) {
      lines.push(`- ${sp.lettre}. ${sp.texte}`);
    }
  }
  lines.push("### À retenir");
  for (const point of contenu.aRetenir) {
    lines.push(`- ${point}`);
  }
  return lines.join("\n");
}

export interface ChapterContent {
  text: string;
  /** Latest `updated_at` among the chapter's active fiches — used to know
   * when a cached quiz is stale and needs regenerating. */
  latestFicheUpdatedAt: string | null;
}

/**
 * Concatenates every non-deleted fiche in a chapter into plain text, used
 * to ground quiz generation strictly in real fiche content.
 */
export async function getChapterContent(chapterId: string): Promise<ChapterContent> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fiches")
    .select("titre, contenu, updated_at")
    .eq("chapter_id", chapterId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Impossible de charger les fiches du chapitre : ${error.message}`);
  }

  const fiches = data ?? [];
  const text = fiches.map((f) => ficheContenuToText(f.titre, f.contenu)).join("\n\n");
  const latestFicheUpdatedAt =
    fiches.length === 0
      ? null
      : fiches.reduce<string>(
          (latest, f) => (f.updated_at > latest ? f.updated_at : latest),
          fiches[0].updated_at,
        );

  return { text, latestFicheUpdatedAt };
}
