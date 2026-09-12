"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { FicheContenu } from "@/lib/supabase/database.types";
import type { SubjectColor } from "@/lib/theme/subject-colors";
import { computePreviewCutoff, getSousPointVisibility, isARetenirVisible } from "@/lib/subscription/preview";
import { RichText } from "./rich-text";
import { Button } from "@/components/ui/button";
import { PlanningTaskTimerBar } from "./planning-task-timer-bar";

export function FicheViewer({
  ficheId,
  titre,
  contenu,
  isSubscribed,
  color,
  backHref,
}: {
  ficheId: string;
  titre: string;
  contenu: FicheContenu;
  isSubscribed: boolean;
  color: SubjectColor;
  backHref: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cutoff = isSubscribed ? null : computePreviewCutoff(contenu);
  const isBlurred = cutoff !== null;
  // Blur increases the further past the cutoff a sous-point is, so the
  // paywall reads as a gradual fade into illegibility rather than a flat
  // on/off cut. Plain running counter (not state) — safe here since it's
  // only ever read/written synchronously during this single render pass.
  let blurStep = 0;
  const BLUR_CLASSES = ["blur-[2px]", "blur-[4px]", "blur-[6px]", "blur-[8px]", "blur-[10px]"];
  function nextBlurClass(): string {
    const cls = BLUR_CLASSES[Math.min(blurStep, BLUR_CLASSES.length - 1)];
    blurStep++;
    return cls;
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const node = containerRef.current;
      if (!node) return;
      const canvas = await html2canvas(node, { backgroundColor: "#FFFDF6", scale: 2 });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        setExportError("Impossible de générer l'image de cette fiche.");
        return;
      }

      const file = new File([blob], `${titre.replace(/[^a-z0-9]+/gi, "-")}.png`, {
        type: "image/png",
      });

      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string }) => Promise<void>;
      };

      // Mobile-first: the share sheet is the one path that reliably lets
      // someone save straight to their phone's Photos/Fichiers app —
      // covers iOS Safari and Android Chrome, the two browsers actually
      // used to open this app on a phone.
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: titre });
        return;
      }

      // Fallback (desktop browsers, or a mobile browser without file
      // sharing): trigger a normal download AND open the image in a new
      // tab. The `download` attribute reliably saves on desktop; some
      // mobile browsers silently ignore it instead, so opening the image
      // too means there's always a long-press-to-save option available.
      // The object URL is revoked after a delay rather than immediately —
      // revoking it right after .click() can race with the download
      // actually starting on some mobile browsers.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      // AbortError: the user closed the native share sheet without
      // picking anything — not a real failure, nothing to show.
      if (err instanceof Error && err.name === "AbortError") return;
      setExportError(
        "Le téléchargement a échoué. Fais une capture d'écran en attendant, ou réessaie.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/fiches/${ficheId}`, { method: "DELETE" });
    router.push(backHref);
    router.refresh();
  }

  return (
    <div>
      <PlanningTaskTimerBar />
      {/* No inline "back" link here: the floating back button (rendered
         globally in app/(app)/layout.tsx) already covers it, and respects
         wherever the user actually came from — e.g. back to /planning for a
         fiche opened from a planning task — instead of always landing on
         this chapter's fiche list the way a hardcoded link would. */}
      <div className="mb-4 flex flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end gap-2">
          {/* Hidden rather than disabled while blurred: html2canvas doesn't
             render CSS filters, so an export of a paywalled fiche would
             come out fully legible — a silent way around the paywall. */}
          {!isBlurred && (
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? "Préparation…" : "📥 Télécharger en image"}
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            🗑️ Corbeille
          </Button>
        </div>
        {exportError && <p className="text-sm text-danger">{exportError}</p>}
      </div>

      <div
        ref={containerRef}
        className="notebook-paper-light mx-auto min-h-[75vh] max-w-2xl rounded-2xl border border-border p-6 md:p-10"
      >
        <div
          className="mb-6 inline-block rounded-lg px-3 py-1 font-mono text-xs uppercase tracking-wide"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          Fiche de révision
        </div>
        <h1 className="mb-8 font-heading text-3xl font-semibold">{titre}</h1>

        <div className="flex flex-col gap-8">
          {contenu.plan.map((section, sectionIndex) => (
            <section key={section.numero}>
              {/* decoration-[#2D4A8A66] (alpha baked into the hex), not
                 decoration-[#2D4A8A]/40: Tailwind v4 rewrites the "/40"
                 opacity modifier into a lab() color, which html2canvas
                 can't parse either — same trap as the highlighter and "À
                 retenir" box, just easier to miss since it's on every
                 section heading rather than a themed block. */}
              <h2 className="mb-3 font-heading text-xl font-semibold text-[#2D4A8A] underline decoration-[#2D4A8A66] underline-offset-4">
                {section.numero}. {section.titre}
              </h2>
              <ul className="flex flex-col gap-2 pl-1">
                {section.sousPoints.map((sp, sousPointIndex) => {
                  const visibility = getSousPointVisibility(cutoff, sectionIndex, sousPointIndex);
                  return (
                    <li key={sp.lettre} className="leading-relaxed">
                      <span className="font-mono text-sm text-text-muted">{sp.lettre}. </span>
                      {visibility === "clear" && <RichText text={sp.texte} />}
                      {visibility === "partial" && cutoff && (
                        <>
                          <RichText text={sp.texte.slice(0, cutoff.charIndex)} />
                          <span className={clsx("ml-1 select-none", nextBlurClass())}>
                            {sp.texte.slice(cutoff.charIndex) || "texte masqué texte masqué"}
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
            </section>
          ))}
        </div>

        {/* Literal hex-with-alpha, not border-accent/60 bg-accent/10: Tailwind
           v4 rewrites opacity-modified named-token colors into
           color-mix(in oklab, ...) for browsers that support it (all real
           ones), which html2canvas's computed-style parser (used by the
           "Télécharger en image" export below) cannot parse — the exact
           bug that made every fiche export silently fail (see also the
           highlighter color in rich-text.tsx for the other half of this
           fix). */}
        <div
          className="mt-10 rounded-xl border-2 border-dashed p-5"
          style={{ borderColor: "#e8a33d99", backgroundColor: "#e8a33d1a" }}
        >
          <h3 className="mb-2 font-heading text-lg font-semibold text-accent">📌 À retenir</h3>
          {isARetenirVisible(cutoff) ? (
            <ul className="flex flex-col gap-1.5">
              {contenu.aRetenir.map((point, i) => (
                <li key={i} className="leading-relaxed">
                  • <RichText text={point} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={clsx("select-none", nextBlurClass())}>
              {contenu.aRetenir.join(" · ") || "Résumé masqué jusqu'à l'abonnement."}
            </p>
          )}
        </div>
      </div>

      {isBlurred && (
        <div className="sticky bottom-4 mt-6 flex flex-col items-center gap-2 rounded-2xl border border-accent bg-bg-card p-5 text-center shadow-xl">
          <p className="font-medium">
            Abonne-toi pour lire cette fiche en entier et débloquer tout Revix.
          </p>
          <Link href="/abonnement">
            <Button>Voir l&apos;abonnement — 9,99 €/mois</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
