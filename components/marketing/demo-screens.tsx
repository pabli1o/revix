"use client";

import clsx from "clsx";
import { RichText } from "@/components/fiches/rich-text";
import { IconCheck } from "@/components/ui/icons";
import { useLocale } from "@/components/i18n/locale-provider";

/** The phone-sized version of a real fiche — same visual language as
 * components/fiches/fiche-viewer.tsx (paper texture, highlighter marks,
 * dashed "À retenir" box), just smaller type and no interactive chrome.
 * Illustrative content only (see lib/i18n/dictionaries/*\/landing.ts's
 * `demo` entries) — a stand-in for a real fiche/planning/quiz screenshot
 * until real ones are dropped in. */
export function DemoFicheScreen({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const demo = t.landing.demo;

  return (
    <div className={clsx("notebook-paper-light h-full overflow-hidden px-4 pb-4", compact ? "pt-2" : "pt-1")}>
      <div className="mb-2 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
        {demo.ficheLabel}
      </div>
      <h2 className="mb-3 text-[15px] font-semibold leading-snug">{demo.ficheTitre}</h2>
      {demo.sections.map((section, sectionIndex) => (
        <section key={section.titre} className="mb-4">
          <h3 className="mb-1.5 text-[13px] font-semibold text-[#2D4A8A] underline decoration-[#2D4A8A66] underline-offset-2">
            {sectionIndex + 1}. {section.titre}
          </h3>
          <ul className="flex flex-col gap-1 pl-0.5">
            {section.sousPoints.map((texte, i) => (
              <li key={i} className="text-[11px] leading-snug">
                <span className="text-text-muted">{String.fromCharCode(97 + i)}. </span>
                <RichText text={texte} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div
        className="mt-2 rounded-lg border-2 border-dashed p-2.5"
        style={{ borderColor: "#1e3a5f99", backgroundColor: "#1e3a5f1a" }}
      >
        <p className="mb-1 text-[11px] font-semibold text-accent">{demo.aRetenirLabel}</p>
        <ul>
          <li className="text-[11px] leading-snug">
            • <RichText text={demo.aRetenirPoint} />
          </li>
        </ul>
      </div>
    </div>
  );
}

export function DemoExamenScreen() {
  const { t } = useLocale();
  const demo = t.landing.demo;

  return (
    <div className="flex h-full flex-col gap-3 bg-bg-elevated p-4 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{demo.examenLabel}</p>
      <div className="rounded-2xl border border-border bg-bg-card p-3">
        <p className="text-[13px] font-semibold">{demo.examenSubject1}</p>
        <p className="mt-1 text-[11px] text-text-muted">{demo.examenIn1}</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-border">
          <div className="h-1.5 w-2/3 rounded-full bg-accent" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-bg-card p-3 opacity-70">
        <p className="text-[13px] font-semibold">{demo.examenSubject2}</p>
        <p className="mt-1 text-[11px] text-text-muted">{demo.examenIn2}</p>
      </div>
    </div>
  );
}

export function DemoPlanningScreen() {
  const { t } = useLocale();
  const demo = t.landing.demo;

  return (
    <div className="flex h-full flex-col gap-2.5 bg-bg-elevated p-4 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{demo.planningLabel}</p>
      {demo.planningTasks.map((label, i) => {
        const done = i === 0;
        return (
          <div key={label} className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card p-3">
            <span
              className={clsx(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                done ? "border-accent bg-accent" : "border-border",
              )}
            >
              {done && <IconCheck className="size-2.5 text-white" />}
            </span>
            <span className={clsx("text-[11px] font-medium", done && "text-text-muted line-through")}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DemoQuizScreen() {
  const { t } = useLocale();
  const demo = t.landing.demo;

  return (
    <div className="flex h-full flex-col gap-3 bg-bg-elevated p-4 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{demo.quizLabel}</p>
      <div className="rounded-2xl border border-border bg-bg-card p-3">
        <p className="text-[12px] font-medium">{demo.quizQuestion}</p>
        <div className="mt-3 flex flex-col gap-2">
          <div className="rounded-xl border-2 border-accent bg-accent/10 px-3 py-2 text-[11px] font-medium">
            {demo.quizOptionCorrect}
          </div>
          <div className="rounded-xl border border-border px-3 py-2 text-[11px] text-text-muted">
            {demo.quizOptionWrong}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small cards floating around the hero phone — decorative only. Hidden
 * below `sm` so a narrow phone screen keeps the real phone mockup as the
 * only thing in view. */
export function FloatingCard({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "absolute hidden w-36 rounded-2xl border border-border bg-bg-card p-3 shadow-lg sm:block",
        className,
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
