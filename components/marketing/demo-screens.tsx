import clsx from "clsx";
import { RichText } from "@/components/fiches/rich-text";
import { IconCheck } from "@/components/ui/icons";
import type { FicheContenu } from "@/lib/supabase/database.types";

/**
 * Illustrative content only — a stand-in for a real fiche/planning/quiz
 * screenshot until real ones are dropped in (see the landing page's own
 * comment). Ordinary textbook-level anatomy facts, not a claim about the
 * product itself.
 */
export const DEMO_FICHE_TITRE = "Le cœur et la circulation sanguine";

export const DEMO_FICHE_CONTENU: FicheContenu = {
  plan: [
    {
      numero: 1,
      titre: "Anatomie du cœur",
      sousPoints: [
        {
          lettre: "a",
          texte:
            "Le cœur est un muscle creux, le **myocarde**, divisé en 4 cavités : 2 oreillettes et 2 ventricules.",
        },
        {
          lettre: "b",
          texte: "Les **valves cardiaques** empêchent le sang de revenir en arrière entre deux battements.",
        },
      ],
    },
    {
      numero: 2,
      titre: "La circulation sanguine",
      sousPoints: [
        {
          lettre: "a",
          texte: "La **grande circulation** envoie le sang oxygéné du cœur vers tous les organes.",
        },
        {
          lettre: "b",
          texte: "La **petite circulation** envoie le sang vers les poumons pour s'oxygéner.",
        },
      ],
    },
  ],
  aRetenir: ["**Systole** = contraction du cœur, **diastole** = relâchement."],
};

function DemoFicheSection({ numero, titre, sousPoints }: FicheContenu["plan"][number]) {
  return (
    <section className="mb-4">
      <h3 className="mb-1.5 text-[13px] font-semibold text-[#2D4A8A] underline decoration-[#2D4A8A66] underline-offset-2">
        {numero}. {titre}
      </h3>
      <ul className="flex flex-col gap-1 pl-0.5">
        {sousPoints.map((sp) => (
          <li key={sp.lettre} className="text-[11px] leading-snug">
            <span className="text-text-muted">{sp.lettre}. </span>
            <RichText text={sp.texte} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The phone-sized version of a real fiche — same visual language as
 * components/fiches/fiche-viewer.tsx (paper texture, highlighter marks,
 * dashed "À retenir" box), just smaller type and no interactive chrome. */
export function DemoFicheScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className={clsx("notebook-paper-light h-full overflow-hidden px-4 pb-4", compact ? "pt-2" : "pt-1")}>
      <div className="mb-2 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
        Fiche de révision
      </div>
      <h2 className="mb-3 text-[15px] font-semibold leading-snug">{DEMO_FICHE_TITRE}</h2>
      {DEMO_FICHE_CONTENU.plan.map((section) => (
        <DemoFicheSection key={section.numero} {...section} />
      ))}
      <div className="mt-2 rounded-lg border-2 border-dashed p-2.5" style={{ borderColor: "#1e3a5f99", backgroundColor: "#1e3a5f1a" }}>
        <p className="mb-1 text-[11px] font-semibold text-accent">À retenir</p>
        <ul>
          {DEMO_FICHE_CONTENU.aRetenir.map((point, i) => (
            <li key={i} className="text-[11px] leading-snug">
              • <RichText text={point} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DemoExamenScreen() {
  return (
    <div className="flex h-full flex-col gap-3 bg-bg-elevated p-4 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Tes examens</p>
      <div className="rounded-2xl border border-border bg-bg-card p-3">
        <p className="text-[13px] font-semibold">SVT — Anatomie</p>
        <p className="mt-1 text-[11px] text-text-muted">Dans 12 jours</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-border">
          <div className="h-1.5 w-2/3 rounded-full bg-accent" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-bg-card p-3 opacity-70">
        <p className="text-[13px] font-semibold">Histoire</p>
        <p className="mt-1 text-[11px] text-text-muted">Dans 25 jours</p>
      </div>
    </div>
  );
}

export function DemoPlanningScreen() {
  const tasks = [
    { label: "Le cœur et la circulation", done: true },
    { label: "Révolution française — partie 2", done: false },
    { label: "Vocabulaire espagnol", done: false },
  ];
  return (
    <div className="flex h-full flex-col gap-2.5 bg-bg-elevated p-4 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Aujourd&apos;hui</p>
      {tasks.map((task) => (
        <div key={task.label} className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card p-3">
          <span
            className={clsx(
              "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
              task.done ? "border-accent bg-accent" : "border-border",
            )}
          >
            {task.done && <IconCheck className="size-2.5 text-white" />}
          </span>
          <span className={clsx("text-[11px] font-medium", task.done && "text-text-muted line-through")}>
            {task.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DemoQuizScreen() {
  return (
    <div className="flex h-full flex-col gap-3 bg-bg-elevated p-4 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Quiz — Anatomie</p>
      <div className="rounded-2xl border border-border bg-bg-card p-3">
        <p className="text-[12px] font-medium">Quel rôle a la petite circulation ?</p>
        <div className="mt-3 flex flex-col gap-2">
          <div className="rounded-xl border-2 border-accent bg-accent/10 px-3 py-2 text-[11px] font-medium">
            Oxygéner le sang dans les poumons
          </div>
          <div className="rounded-xl border border-border px-3 py-2 text-[11px] text-text-muted">
            Transporter le sang vers les muscles
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
