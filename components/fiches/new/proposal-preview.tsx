"use client";

import clsx from "clsx";
import type { FicheContenu } from "@/lib/supabase/database.types";
import {
  computePreviewCutoff,
  getSousPointVisibility,
  isARetenirVisible,
} from "@/lib/subscription/preview";
import { RichText } from "@/components/fiches/rich-text";

const BLUR_CLASSES = ["blur-[2px]", "blur-[4px]", "blur-[6px]", "blur-[8px]", "blur-[10px]"];

export function ProposalPreview({
  contenu,
  isSubscribed,
}: {
  contenu: FicheContenu;
  isSubscribed: boolean;
}) {
  const cutoff = isSubscribed ? null : computePreviewCutoff(contenu);
  // Blur increases the further past the cutoff a sous-point is, so the
  // paywall reads as a gradual fade into illegibility rather than a flat
  // on/off cut. Plain running counter (not state) — safe here since it's
  // only ever read/written synchronously during this single render pass.
  let blurStep = 0;
  function nextBlurClass(): string {
    const cls = BLUR_CLASSES[Math.min(blurStep, BLUR_CLASSES.length - 1)];
    blurStep++;
    return cls;
  }

  return (
    <div className="notebook-paper-light mx-auto w-full max-w-xl min-h-[70vh] rounded-lg border border-border p-4 text-sm sm:p-6">
      <div className="flex flex-col gap-4">
        {contenu.plan.map((section, sectionIndex) => (
          <div key={section.numero}>
            <p className="mb-1 font-heading font-semibold text-[#2D4A8A] underline decoration-[#2D4A8A]/40 underline-offset-4">
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
                        <span className={clsx("ml-1 select-none", nextBlurClass())}>
                          {sp.texte.slice(cutoff.charIndex) || "texte masqué"}
                        </span>
                      </>
                    )}
                    {visibility === "blurred" && (
                      <span className={clsx("select-none", nextBlurClass())}>{sp.texte}</span>
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
            <p className={clsx("select-none", nextBlurClass())}>{contenu.aRetenir.join(" · ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
