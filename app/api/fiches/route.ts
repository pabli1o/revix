import { NextResponse } from "next/server";
import { scheduleQuizPreparation } from "@/lib/quiz/schedule";
import { checkAndIncrementFicheQuota, FicheQuotaExceededError, getSubscriptionInfo } from "@/lib/subscription/gate";
import type { SaveFichesRequest, SaveFichesResponse } from "@/lib/fiches/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const subscription = await getSubscriptionInfo(user.id);
  if (!subscription.isActive) {
    return NextResponse.json(
      { error: "Un abonnement actif est nécessaire pour enregistrer une fiche." },
      { status: 402 },
    );
  }

  const body = (await request.json().catch(() => null)) as SaveFichesRequest | null;
  const items = body?.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Aucune fiche à enregistrer" }, { status: 400 });
  }

  const touchedChapterIds = new Set<string>();
  let saved = 0;
  let stopError: string | null = null;

  for (const item of items) {
    if (!item.titre?.trim() || !item.contenu) {
      stopError = "Fiche invalide (titre ou contenu manquant)";
      break;
    }

    try {
      // Resolve subject.
      let subjectId = item.subjectId;
      if (!subjectId && item.newSubjectNom?.trim()) {
        const nom = item.newSubjectNom.trim();
        const { data: existing } = await supabase
          .from("subjects")
          .select("id")
          .eq("user_id", user.id)
          .ilike("nom", nom)
          .maybeSingle();
        if (existing) {
          subjectId = existing.id;
        } else {
          const { data: created, error } = await supabase
            .from("subjects")
            .insert({ user_id: user.id, nom })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          subjectId = created.id;
        }
      }
      if (!subjectId) {
        stopError = "Matière manquante pour une fiche";
        break;
      }

      // Resolve chapter.
      let chapterId = item.chapterId;
      if (!chapterId && item.newChapterNom?.trim()) {
        const nom = item.newChapterNom.trim();
        const { data: existing } = await supabase
          .from("chapters")
          .select("id")
          .eq("user_id", user.id)
          .eq("subject_id", subjectId)
          .ilike("nom", nom)
          .maybeSingle();
        if (existing) {
          chapterId = existing.id;
        } else {
          const { data: created, error } = await supabase
            .from("chapters")
            .insert({ user_id: user.id, subject_id: subjectId, nom })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          chapterId = created.id;
        }
      }
      if (!chapterId) {
        stopError = "Chapitre manquant pour une fiche";
        break;
      }

      // Cap only applies to active subscribers, decremented at save time.
      await checkAndIncrementFicheQuota(user.id);

      const { error: insertError } = await supabase.from("fiches").insert({
        user_id: user.id,
        chapter_id: chapterId,
        titre: item.titre.trim(),
        contenu: item.contenu,
        sources: item.sources ?? [],
      });
      if (insertError) throw new Error(insertError.message);

      touchedChapterIds.add(chapterId);
      saved++;
    } catch (err) {
      if (err instanceof FicheQuotaExceededError) {
        stopError = err.message;
      } else {
        stopError = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      }
      break;
    }
  }

  for (const chapterId of touchedChapterIds) {
    await scheduleQuizPreparation(user.id, chapterId);
  }

  const response: SaveFichesResponse = {
    saved,
    total: items.length,
    error: stopError ?? undefined,
  };
  return NextResponse.json(response, { status: stopError && saved === 0 ? 400 : 200 });
}
