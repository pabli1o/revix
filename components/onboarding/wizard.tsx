"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ClasseCycle } from "@/lib/supabase/database.types";

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const MINUTES_OPTIONS = [15, 20, 30, 45, 60, 75, 90];

const CYCLE_OPTIONS: { value: ClasseCycle; label: string; description: string }[] = [
  { value: "college", label: "Collège", description: "De la 6e à la 3e" },
  { value: "lycee", label: "Lycée", description: "Seconde, Première, Terminale" },
  { value: "superieur", label: "Supérieur", description: "Licence, BTS, prépa…" },
];

const COLLEGE_NIVEAUX = ["6e", "5e", "4e", "3e"];
const LYCEE_NIVEAUX = ["Seconde", "Première", "Terminale"];

type Step = "classe" | "niveau" | "prenom" | "jours" | "minutes";
const STEP_ORDER: Step[] = ["classe", "niveau", "prenom", "jours", "minutes"];

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
        <ProgressBar step={STEP_ORDER.indexOf(step) + 1} total={STEP_ORDER.length} />

        {step === "classe" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Tu es en quelle classe ?</h1>
            <p className="mt-1 text-sm text-text-muted">Pour adapter un peu l&apos;expérience.</p>

            <div className="mt-6 flex flex-col gap-3">
              {CYCLE_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  title={opt.label}
                  description={opt.description}
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
              <div className="mt-6 flex flex-col gap-3">
                {(cycle === "college" ? COLLEGE_NIVEAUX : LYCEE_NIVEAUX).map((value) => (
                  <ChoiceCard key={value} title={value} onClick={() => chooseNiveau(value)} />
                ))}
              </div>
            )}
          </div>
        )}

        {step === "prenom" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("niveau")}
              className="mb-4 rounded-full border border-border bg-white/5 px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← Retour
            </button>
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
            <Button className="mt-6 w-full" disabled={!canFinish} onClick={() => setStep("jours")}>
              Continuer
            </Button>
          </div>
        )}

        {step === "jours" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("prenom")}
              className="mb-4 rounded-full border border-border bg-white/5 px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← Retour
            </button>
            <h1 className="font-heading text-2xl font-semibold">
              Combien de jours par semaine peux-tu réviser ?
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Ça sert à construire ton planning plus tard — modifiable à tout moment.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {DAYS_OPTIONS.map((d) => (
                <ChoiceCard
                  key={d}
                  title={`${d} jour${d > 1 ? "s" : ""} par semaine`}
                  selected={joursSemaine === d}
                  onClick={() => {
                    setJoursSemaine(d);
                    setStep("minutes");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "minutes" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("jours")}
              className="mb-4 rounded-full border border-border bg-white/5 px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← Retour
            </button>
            <h1 className="font-heading text-2xl font-semibold">
              Combien de temps par jour de travail ?
            </h1>
            <p className="mt-2 text-sm text-text-muted">Modifiable à tout moment dans les réglages.</p>
            <div className="mt-6 flex flex-col gap-3">
              {MINUTES_OPTIONS.map((m) => (
                <ChoiceCard
                  key={m}
                  title={`${m} min par jour`}
                  selected={minutesJour === m}
                  onClick={() => setMinutesJour(m)}
                />
              ))}
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
