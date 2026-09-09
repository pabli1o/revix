"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [deleting, setDeleting] = useState(false);

  const cutoff = isSubscribed ? null : computePreviewCutoff(contenu);
  const isBlurred = cutoff !== null;

  async function handleExport() {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const node = containerRef.current;
      if (!node) return;
      const canvas = await html2canvas(node, { backgroundColor: "#FFFDF6", scale: 2 });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const file = new File([blob], `${titre.replace(/[^a-z0-9]+/gi, "-")}.png`, {
        type: "image/png",
      });

      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string }) => Promise<void>;
      };

      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: titre });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-text-muted hover:text-accent">
          ← Retour au chapitre
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? "Export…" : "📤 Exporter en image"}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            🗑️ Corbeille
          </Button>
        </div>
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
              <h2 className="mb-3 font-heading text-xl font-semibold text-accent">
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
                          <span className="ml-1 select-none blur-[5px]">
                            {sp.texte.slice(cutoff.charIndex) || "texte masqué texte masqué"}
                          </span>
                        </>
                      )}
                      {visibility === "blurred" && (
                        <span className="select-none blur-[5px]">{sp.texte}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border-2 border-dashed border-accent/60 bg-accent/10 p-5">
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
            <p className="select-none blur-[5px]">
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
