"use client";

import type { FicheContenu } from "@/lib/supabase/database.types";
import {
  computePreviewCutoff,
  getSousPointVisibility,
  isARetenirVisible,
} from "@/lib/subscription/preview";
import { RichText } from "@/components/fiches/rich-text";

export function ProposalPreview({
  contenu,
  isSubscribed,
}: {
  contenu: FicheContenu;
  isSubscribed: boolean;
}) {
  const cutoff = isSubscribed ? null : computePreviewCutoff(contenu);

  return (
    <div className="notebook-paper-light mx-auto w-full max-w-md min-h-[70vh] rounded-lg border border-border p-4 text-sm sm:p-6">
      <div className="flex flex-col gap-4">
        {contenu.plan.map((section, sectionIndex) => (
          <div key={section.numero}>
            <p className="mb-1 font-heading font-semibold text-accent">
              {section.numero}. {section.titre}
            </p>
            <ul className="flex flex-col gap-1 pl-1">
              {section.sousPoints.map((sp, sousPointIndex) => {
                const visibility = getSousPointVisibility(cutoff, sectionIndex, sousPointIndex);
                return (
                  <li key={sp.lettre}>
                    <span className="font-mono text-xs text-text-muted">{sp.lettre}. </span>
                    {visibility === "clear" && <RichText text={sp.texte} />}
                    {visibility === "partial" && cutoff && (
                      <>
                        <RichText text={sp.texte.slice(0, cutoff.charIndex)} />
                        <span className="ml-1 select-none blur-[4px]">
                          {sp.texte.slice(cutoff.charIndex) || "texte masqué"}
                        </span>
                      </>
                    )}
                    {visibility === "blurred" && (
                      <span className="select-none blur-[4px]">{sp.texte}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="rounded-lg border border-dashed border-accent/60 bg-accent/10 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            À retenir
          </p>
          {isARetenirVisible(cutoff) ? (
            <ul className="flex flex-col gap-1">
              {contenu.aRetenir.map((point, i) => (
                <li key={i}>
                  • <RichText text={point} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="select-none blur-[4px]">{contenu.aRetenir.join(" · ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
