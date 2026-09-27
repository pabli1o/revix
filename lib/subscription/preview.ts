import type { FicheContenu } from "@/lib/supabase/database.types";
import { FREE_PREVIEW_FRACTION } from "./constants";

/**
 * Points at the exact position, inside a fiche's structured content, where
 * the free preview should stop and the progressive blur should begin.
 * Deliberately just a pointer (section/sous-point/char offset) rather than
 * a copy of the truncated text — the renderer walks the real `contenu` and
 * decides per sous-point whether to show it fully, partially (slicing at
 * `charIndex`), or blurred, so the un-blurred text is never duplicated
 * anywhere a subscription check could be bypassed.
 */
export interface PreviewCutoff {
  sectionIndex: number;
  sousPointIndex: number;
  charIndex: number;
}

/**
 * Walks the fiche content in reading order (section by section, sous-point
 * by sous-point) and returns the cutoff once `freeFraction` of the fiche's
 * total character count has been shown. Returns null when the fiche has no
 * content at all — in that case there is nothing to blur, everything is
 * shown (this never triggers for a real fiche with content, since the
 * target is always strictly less than the total).
 */
export function computePreviewCutoff(
  contenu: FicheContenu,
  freeFraction: number = FREE_PREVIEW_FRACTION,
): PreviewCutoff | null {
  let totalChars = 0;
  for (const section of contenu.plan) {
    for (const sp of section.sousPoints) totalChars += sp.texte.length;
  }
  if (totalChars === 0) return null;

  const target = totalChars * freeFraction;
  let seen = 0;

  for (let sectionIndex = 0; sectionIndex < contenu.plan.length; sectionIndex++) {
    const section = contenu.plan[sectionIndex];
    for (let sousPointIndex = 0; sousPointIndex < section.sousPoints.length; sousPointIndex++) {
      const texte = section.sousPoints[sousPointIndex].texte;
      if (seen + texte.length >= target) {
        return { sectionIndex, sousPointIndex, charIndex: Math.max(0, Math.round(target - seen)) };
      }
      seen += texte.length;
    }
  }

  return null;
}

export type SousPointVisibility = "clear" | "partial" | "blurred";

/** Visibility state for one sous-point, given a (possibly null) cutoff. */
export function getSousPointVisibility(
  cutoff: PreviewCutoff | null,
  sectionIndex: number,
  sousPointIndex: number,
): SousPointVisibility {
  if (!cutoff) return "clear";
  if (
    sectionIndex < cutoff.sectionIndex ||
    (sectionIndex === cutoff.sectionIndex && sousPointIndex < cutoff.sousPointIndex)
  ) {
    return "clear";
  }
  if (sectionIndex === cutoff.sectionIndex && sousPointIndex === cutoff.sousPointIndex) {
    return "partial";
  }
  return "blurred";
}

/** The "À retenir" block always comes after the whole plan in reading order. */
export function isARetenirVisible(cutoff: PreviewCutoff | null): boolean {
  return cutoff === null;
}
