"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ClasseCycle } from "@/lib/supabase/database.types";

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const MINUTES_OPTIONS = [15, 20, 30, 45, 60, 75, 90];

// Fixed outline color per choice, per the validated design spec — not the
// per-matière palette used elsewhere in the app (assignSubjectColors).
const OUTLINE_BLUE = "#5B8DEF";
const OUTLINE_GREEN = "#6FA88B";
const OUTLINE_VIOLET = "#8B7FE8";
const OUTLINE_ORANGE = "#E8664D";

const CYCLE_OPTIONS: { value: ClasseCycle; label: string; color: string }[] = [
  { value: "college", label: "Collège", color: OUTLINE_BLUE },
  { value: "lycee", label: "Lycée", color: OUTLINE_GREEN },
  { value: "superieur", label: "Supérieur", color: OUTLINE_VIOLET },
];

const COLLEGE_NIVEAUX = [
  { value: "6e", color: OUTLINE_BLUE },
  { value: "5e", color: OUTLINE_GREEN },
  { value: "4e", color: OUTLINE_ORANGE },
  { value: "3e", color: OUTLINE_VIOLET },
];
const LYCEE_NIVEAUX = [
  { value: "Seconde", color: OUTLINE_BLUE },
  { value: "Première", color: OUTLINE_ORANGE },
  { value: "Terminale", color: OUTLINE_GREEN },
];

type Step = "classe" | "niveau" | "prenom" | "rythme";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("classe");

  const [prenom, setPrenom] = useState("");
  const [cycle, setCycle] = useState<ClasseCycle | null>(null);
  const [niveau, setNiveau] = useState("");
  const [superieurText, setSuperieurText] = useState("");
  const [joursSemaine, setJoursSemaine] = useState(3);
  const [minutesJour, setMinutesJour] = useState(45);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function chooseCycle(value: ClasseCycle) {
    setCycle(value);
    setNiveau("");
    setSuperieurText("");
    setStep("niveau");
  }

  function chooseNiveau(value: string) {
    setNiveau(value);
    setStep("prenom");
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    const finalNiveau = cycle === "superieur" ? superieurText.trim() : niveau;

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom,
        classeCycle: cycle,
        classeNiveau: finalNiveau,
        revisionJoursSemaine: joursSemaine,
        revisionMinutesJour: minutesJour,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    router.replace("/fiches");
    router.refresh();
  }

  const canGoPrenom = cycle !== "superieur" || superieurText.trim().length > 0;
  const canFinish = prenom.trim().length > 0;

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
        {step === "classe" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Tu es en quelle classe ?</h1>
            <p className="mt-1 text-sm text-text-muted">Pour adapter un peu l&apos;expérience.</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {CYCLE_OPTIONS.map((opt, i, arr) => (
                <OutlineChoice
                  key={opt.value}
                  label={opt.label}
                  color={opt.color}
                  className={i === arr.length - 1 && arr.length % 2 === 1 ? "col-span-2" : undefined}
                  onClick={() => chooseCycle(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === "niveau" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("classe")}
              className="mb-4 rounded-full border border-border bg-white/5 px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← Retour
            </button>
            <h1 className="font-heading text-2xl font-semibold">Quel niveau ?</h1>

            {cycle === "superieur" ? (
              <div className="mt-6">
                <Input
                  autoFocus
                  placeholder="Ex : Licence 2 Économie, BTS, prépa…"
                  value={superieurText}
                  onChange={(e) => setSuperieurText(e.target.value)}
                />
                <Button
                  className="mt-6 w-full"
                  disabled={!canGoPrenom}
                  onClick={() => setStep("prenom")}
                >
                  Continuer
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(cycle === "college" ? COLLEGE_NIVEAUX : LYCEE_NIVEAUX).map((opt, i, arr) => (
                  <OutlineChoice
                    key={opt.value}
                    label={opt.value}
                    color={opt.color}
                    className={i === arr.length - 1 && arr.length % 2 === 1 ? "col-span-2" : undefined}
                    onClick={() => chooseNiveau(opt.value)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === "prenom" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Comment on t&apos;appelle ?</h1>
            <p className="mt-2 text-sm text-text-muted">
              Ton prénom ou un pseudo, comme tu préfères.
            </p>
            <Input
              autoFocus
              className="mt-6"
              placeholder="Ex : Léa, ou un pseudo…"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Button
              className="mt-6 w-full"
              disabled={!canFinish}
              onClick={() => setStep("rythme")}
            >
              Continuer
            </Button>
          </div>
        )}

        {step === "rythme" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ton rythme de révision</h1>
            <p className="mt-2 text-sm text-text-muted">
              Ça sert à construire ton planning plus tard — modifiable à tout moment.
            </p>
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label className="text-sm font-medium">
                  Combien de jours par semaine peux-tu réviser ?
                </label>
                <Select
                  className="mt-2"
                  value={joursSemaine}
                  onChange={(e) => setJoursSemaine(Number(e.target.value))}
                >
                  {DAYS_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} jour{d > 1 ? "s" : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Combien de temps par jour de travail ?</label>
                <Select
                  className="mt-2"
                  value={minutesJour}
                  onChange={(e) => setMinutesJour(Number(e.target.value))}
                >
                  {MINUTES_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            <Button className="mt-6 w-full" onClick={handleFinish} disabled={submitting}>
              {submitting ? "Un instant…" : "Terminer"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function OutlineChoice({
  label,
  color,
  onClick,
  className,
}: {
  label: string;
  color: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        {
          borderColor: color,
          "--glow": `${color}55`,
        } as React.CSSProperties
      }
      className={clsx(
        "rounded-full border-2 bg-transparent px-4 py-4 text-center text-sm font-semibold text-text transition-all duration-150 hover:shadow-[0_0_0_4px_var(--glow)] active:scale-[0.96]",
        className,
      )}
    >
      {label}
    </button>
  );
}
