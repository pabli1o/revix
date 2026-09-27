"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FicheContenu, FicheSousPoint, FichePlanSection } from "@/lib/supabase/database.types";
import type { SubjectColor } from "@/lib/theme/subject-colors";
import { computePreviewCutoff, isARetenirVisible } from "@/lib/subscription/preview";
import { FREE_PREVIEW_FRACTION } from "@/lib/subscription/constants";
import { RichText } from "./rich-text";
import { Button } from "@/components/ui/button";
import { PlanningTaskTimerBar } from "./planning-task-timer-bar";
import { PricingModal } from "@/components/abonnement/pricing-modal";

/** The fiche's paper background is a fixed cream (#FFFDF6, see
 * .notebook-paper-light in app/globals.css) rather than a theme token, so
 * the blur overlay's scrim is hardcoded to match it exactly instead of
 * fighting a mismatched fade. */
const PAPER_BG = "#FFFDF6";

function renderSousPointItem(sp: FicheSousPoint, texte: string, key: string) {
  if (!texte) return null;
  return (
    <li key={key} className="leading-relaxed">
      <span className="font-mono text-sm text-text-muted">{sp.lettre}. </span>
      <RichText text={texte} />
    </li>
  );
}

function renderSection(section: FichePlanSection, items: { sp: FicheSousPoint; texte: string }[], key: string) {
  const rendered = items.map((it, i) => renderSousPointItem(it.sp, it.texte, `${key}-${i}`)).filter(Boolean);
  if (rendered.length === 0) return null;
  return (
    <section key={key}>
      {/* decoration-[#2D4A8A66] (alpha baked into the hex), not
         decoration-[#2D4A8A]/40: Tailwind v4 rewrites the "/40"
         opacity modifier into a lab() color, which html2canvas
         can't parse either — same trap as the highlighter and "À
         retenir" box, just easier to miss since it's on every
         section heading rather than a themed block. */}
      <h2 className="mb-3 font-heading text-xl font-semibold text-[#2D4A8A] underline decoration-[#2D4A8A66] underline-offset-4">
        {section.numero}. {section.titre}
      </h2>
      <ul className="flex flex-col gap-2 pl-1">{rendered}</ul>
    </section>
  );
}

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
  const [pricingOpen, setPricingOpen] = useState(false);

  const cutoff = isSubscribed ? null : computePreviewCutoff(contenu);
  const isBlurred = cutoff !== null;

  // Splits the fiche into a fully-visible portion and a locked portion —
  // the locked one is rendered as one continuous blurred block (real,
  // legible-but-blurred fiche content, not blank space) with the unlock
  // call to action layered on top of it, rather than blurring each
  // sous-point in isolation.
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

    // The section straddling the cutoff: its own sous-points split in two.
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
    <div
      className="mt-10 rounded-xl border-2 border-dashed p-5"
      style={{ borderColor: "#e8a33d99", backgroundColor: "#e8a33d1a" }}
    >
      <h3 className="mb-2 font-heading text-lg font-semibold text-accent">📌 À retenir</h3>
      <ul className="flex flex-col gap-1.5">
        {contenu.aRetenir.map((point, i) => (
          <li key={i} className="leading-relaxed">
            • <RichText text={point} />
          </li>
        ))}
      </ul>
    </div>
  );

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

        <div className="flex flex-col gap-8">{clearSections}</div>

        {isBlurred ? (
          <div className="relative mt-8 max-h-[420px] overflow-hidden rounded-xl">
            <div aria-hidden className="pointer-events-none flex select-none flex-col gap-8 blur-sm">
              {lockedSections}
              {!aRetenirVisible && aRetenirBox}
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: `linear-gradient(to bottom, transparent, ${PAPER_BG}cc 35%, ${PAPER_BG} 65%)` }}
            >
              <p className="font-heading text-lg font-semibold">
                Tu n&apos;as accès qu&apos;à {Math.round(FREE_PREVIEW_FRACTION * 100)}% de la fiche.
              </p>
              <Button size="lg" onClick={() => setPricingOpen(true)}>
                Débloquer la fiche complète
              </Button>
            </div>
          </div>
        ) : (
          aRetenirBox
        )}
      </div>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}
