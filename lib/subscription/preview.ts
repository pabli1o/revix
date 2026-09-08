import type { FicheContenu } from "@/lib/supabase/database.types";
import { FREE_PREVIEW_SENTENCES } from "./gate";

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

const SENTENCE_END_RE = /[.!?](?:\s+|$)/g;

/**
 * Walks the fiche content in reading order (section by section, sous-point
 * by sous-point) and returns the cutoff after the first `freeSentences`
 * sentences. Returns null when the whole fiche is shorter than that — in
 * that case there is nothing to blur, everything is shown.
 */
export function computePreviewCutoff(
  contenu: FicheContenu,
  freeSentences: number = FREE_PREVIEW_SENTENCES,
): PreviewCutoff | null {
  let sentencesSeen = 0;

  for (let sectionIndex = 0; sectionIndex < contenu.plan.length; sectionIndex++) {
    const section = contenu.plan[sectionIndex];
    for (let sousPointIndex = 0; sousPointIndex < section.sousPoints.length; sousPointIndex++) {
      const texte = section.sousPoints[sousPointIndex].texte;
      SENTENCE_END_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = SENTENCE_END_RE.exec(texte)) !== null) {
        sentencesSeen++;
        if (sentencesSeen >= freeSentences) {
          return { sectionIndex, sousPointIndex, charIndex: match.index + match[0].length };
        }
      }
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
