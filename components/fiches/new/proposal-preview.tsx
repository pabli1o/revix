"use client";

import type { FicheContenu, FicheSousPoint, FichePlanSection } from "@/lib/supabase/database.types";
import { computePreviewCutoff, isARetenirVisible } from "@/lib/subscription/preview";
import { FREE_PREVIEW_FRACTION } from "@/lib/subscription/constants";
import { RichText } from "@/components/fiches/rich-text";
import { Button } from "@/components/ui/button";

/** Matches .notebook-paper-light's fixed cream background (see
 * fiche-viewer.tsx for the same constant) — this card uses a plain
 * border/background instead, but the blur overlay's scrim still needs to
 * fade into whatever the card itself sits on to look like a real fade
 * rather than a flat box, so it's kept equally light here. */
const CARD_BG = "#FFFDF6";

function renderSousPointItem(sp: FicheSousPoint, texte: string, key: string) {
  if (!texte) return null;
  return (
    <li key={key}>
      <span className="font-mono text-xs text-text-muted">{sp.lettre}. </span>
      <RichText text={texte} />
    </li>
  );
}

function renderSection(section: FichePlanSection, items: { sp: FicheSousPoint; texte: string }[], key: string) {
  const rendered = items.map((it, i) => renderSousPointItem(it.sp, it.texte, `${key}-${i}`)).filter(Boolean);
  if (rendered.length === 0) return null;
  return (
    <div key={key}>
      <p className="mb-1 font-heading font-semibold text-[#2D4A8A] underline decoration-[#2D4A8A]/40 underline-offset-4">
        {section.numero}. {section.titre}
      </p>
      <ul className="flex flex-col gap-1 pl-1">{rendered}</ul>
    </div>
  );
}

export function ProposalPreview({
  contenu,
  isSubscribed,
  onUnlock,
  unlocking,
}: {
  contenu: FicheContenu;
  isSubscribed: boolean;
  /** Opens the pricing popup — omitted where this preview is only ever
   * shown to an already-subscribed user (e.g. assign-flow's "reviewing"
   * phase), since the unlock CTA never renders there. */
  onUnlock?: () => void;
  unlocking?: boolean;
}) {
  const cutoff = isSubscribed ? null : computePreviewCutoff(contenu);
  const isBlurred = cutoff !== null;

  // Same split-into-one-continuous-blurred-block approach as
  // components/fiches/fiche-viewer.tsx — see there for the reasoning.
  const clearSections: React.ReactNode[] = [];
  const lockedSections: React.ReactNode[] = [];
  contenu.plan.forEach((section, sectionIndex) => {
    if (!cutoff || sectionIndex < cutoff.sectionIndex) {
      clearSections.push(
        renderSection(
          section,
          section.sousPoints.map((sp) => ({ sp, texte: sp.texte })),
          `clear-${section.numero}`,
        ),
      );
      return;
    }
    if (sectionIndex > cutoff.sectionIndex) {
      lockedSections.push(
        renderSection(
          section,
          section.sousPoints.map((sp) => ({ sp, texte: sp.texte })),
          `locked-${section.numero}`,
        ),
      );
      return;
    }

    const clearItems = section.sousPoints.slice(0, cutoff.sousPointIndex).map((sp) => ({ sp, texte: sp.texte }));
    const partialSp = section.sousPoints[cutoff.sousPointIndex];
    clearItems.push({ sp: partialSp, texte: partialSp.texte.slice(0, cutoff.charIndex) });
    clearSections.push(renderSection(section, clearItems, `clear-${section.numero}`));

    const lockedItems = [
      { sp: partialSp, texte: partialSp.texte.slice(cutoff.charIndex) },
      ...section.sousPoints.slice(cutoff.sousPointIndex + 1).map((sp) => ({ sp, texte: sp.texte })),
    ];
    lockedSections.push(renderSection(section, lockedItems, `locked-${section.numero}`));
  });

  const aRetenirVisible = isARetenirVisible(cutoff);
  const aRetenirBox = (
    <div className="rounded-lg border border-dashed border-accent/60 bg-accent/10 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">À retenir</p>
      <ul className="flex flex-col gap-1">
        {contenu.aRetenir.map((point, i) => (
          <li key={i}>
            • <RichText text={point} />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="notebook-paper-light mx-auto w-full max-w-xl min-h-[70vh] rounded-lg border border-border p-4 text-sm sm:p-6">
      <div className="flex flex-col gap-4">{clearSections}</div>

      {isBlurred ? (
        // Full real content, unclipped — see fiche-viewer.tsx's identical
        // approach: the CTA only covers the first ~280px, fading to fully
        // transparent, so the rest of the actual blurred content keeps
        // showing through beneath it for the fiche's real full length.
        <div className="relative mt-4">
          <div aria-hidden className="pointer-events-none flex select-none flex-col gap-4 blur-sm">
            {lockedSections}
            {!aRetenirVisible && aRetenirBox}
          </div>
          <div
            className="absolute inset-x-0 top-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
            style={{
              // min(280px, 100%): never taller than the real blurred
              // content behind it (a very short fiche's locked portion).
              height: "min(280px, 100%)",
              background: `linear-gradient(to bottom, ${CARD_BG}f5 0%, ${CARD_BG}f5 55%, transparent 100%)`,
            }}
          >
            <p className="font-medium">
              Tu n&apos;as accès qu&apos;à {Math.round(FREE_PREVIEW_FRACTION * 100)}% de la fiche.
            </p>
            {onUnlock && (
              <Button onClick={onUnlock} disabled={unlocking}>
                {unlocking ? "Préparation…" : "Débloquer la fiche complète"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">{aRetenirBox}</div>
      )}
    </div>
  );
}
