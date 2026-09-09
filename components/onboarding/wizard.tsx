"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DurationSelector } from "@/components/ui/duration-selector";
import { DaysPerWeekSelector } from "@/components/ui/days-per-week-selector";
import type { ClasseCycle } from "@/lib/supabase/database.types";

const TUTORIAL_SLIDES = [
  {
    emoji: "📝",
    title: "Crée une fiche",
    text: "Dépose tes notes, photos de cours ou PDF : Revix génère une fiche de révision claire et structurée.",
  },
  {
    emoji: "🗓️",
    title: "Planning généré",
    text: "Ajoute tes examens, Revix te construit un planning de révision selon ton rythme.",
  },
  {
    emoji: "🎯",
    title: "Teste-toi avec un quiz",
    text: "Chaque chapitre a son quiz, prêt en quelques secondes, pour vérifier ce que tu maîtrises.",
  },
];

const COLLEGE_NIVEAUX = ["6e", "5e", "4e", "3e"];
const LYCEE_NIVEAUX = ["2nde", "1ère", "Terminale"];

const CYCLE_OPTIONS: { value: ClasseCycle; label: string }[] = [
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "superieur", label: "Supérieur" },
];

type Step = "tutorial" | "prenom" | "classe" | "rythme";

export function OnboardingWizard() {
  const router = useRouter();
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [step, setStep] = useState<Step>("tutorial");

  const [prenom, setPrenom] = useState("");
  const [cycle, setCycle] = useState<ClasseCycle | null>(null);
  const [niveau, setNiveau] = useState("");
  const [superieurText, setSuperieurText] = useState("");
  const [joursSemaine, setJoursSemaine] = useState(4);
  const [minutesJour, setMinutesJour] = useState(30);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextTutorial() {
    if (tutorialIndex < TUTORIAL_SLIDES.length - 1) {
      setTutorialIndex(tutorialIndex + 1);
    } else {
      setStep("prenom");
    }
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

  const canGoClasse = prenom.trim().length > 0;
  const canGoRythme = cycle !== null && (cycle !== "superieur" ? niveau.length > 0 : superieurText.trim().length > 0);

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
        {step === "tutorial" && (
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl">{TUTORIAL_SLIDES[tutorialIndex].emoji}</div>
            <h1 className="mt-4 font-heading text-2xl font-semibold">
              {TUTORIAL_SLIDES[tutorialIndex].title}
            </h1>
            <p className="mt-3 text-text-muted">{TUTORIAL_SLIDES[tutorialIndex].text}</p>
            <div className="mt-6 flex gap-2">
              {TUTORIAL_SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={clsx(
                    "h-1.5 w-6 rounded-full",
                    i === tutorialIndex ? "bg-accent" : "bg-border",
                  )}
                />
              ))}
            </div>
            <Button onClick={nextTutorial} className="mt-8 w-full">
              {tutorialIndex < TUTORIAL_SLIDES.length - 1 ? "Suivant" : "Commencer"}
            </Button>
          </div>
        )}

        {step === "prenom" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Comment on t&apos;appelle ?</h1>
            <p className="mt-2 text-sm text-text-muted">
              On l&apos;utilisera pour personnaliser tes messages de bienvenue.
            </p>
            <Input
              autoFocus
              className="mt-6"
              placeholder="Ton prénom ou surnom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Button
              className="mt-6 w-full"
              disabled={!canGoClasse}
              onClick={() => setStep("classe")}
            >
              Continuer
            </Button>
          </div>
        )}

        {step === "classe" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Tu es en quelle classe ?</h1>

            {cycle === null ? (
              <div className="mt-6 flex flex-col gap-2">
                {CYCLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCycle(opt.value)}
                    className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-left text-sm font-medium text-text transition-all duration-150 hover:border-accent active:scale-[0.97] active:bg-bg-card"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCycle(null);
                    setNiveau("");
                    setSuperieurText("");
                  }}
                  className="text-sm text-text-muted underline-offset-2 hover:text-accent hover:underline"
                >
                  ← Changer ({CYCLE_OPTIONS.find((o) => o.value === cycle)?.label})
                </button>

                <div className="mt-4">
                  {cycle === "college" && (
                    <TileGroup
                      label="Collège"
                      options={COLLEGE_NIVEAUX}
                      active={niveau}
                      onSelect={setNiveau}
                    />
                  )}
                  {cycle === "lycee" && (
                    <TileGroup
                      label="Lycée"
                      options={LYCEE_NIVEAUX}
                      active={niveau}
                      onSelect={setNiveau}
                    />
                  )}
                  {cycle === "superieur" && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-text-muted">Supérieur</p>
                      <Input
                        autoFocus
                        placeholder="Ex : Licence 2 Économie, BTS, prépa…"
                        value={superieurText}
                        onChange={(e) => setSuperieurText(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep("prenom")}>
                Retour
              </Button>
              <Button
                className="flex-1"
                disabled={!canGoRythme}
                onClick={() => setStep("rythme")}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === "rythme" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ton rythme de révision</h1>
            <p className="mt-2 text-sm text-text-muted">
              Ça pré-remplira les réglages de ton planning (modifiables plus tard).
            </p>
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label className="text-sm font-medium">Jours de révision par semaine</label>
                <DaysPerWeekSelector value={joursSemaine} onChange={setJoursSemaine} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Minutes par jour</label>
                <DurationSelector value={minutesJour} onChange={setMinutesJour} className="mt-2" />
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep("classe")}>
                Retour
              </Button>
              <Button className="flex-1" onClick={handleFinish} disabled={submitting}>
                {submitting ? "Un instant…" : "C'est parti !"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TileGroup({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={clsx(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.94]",
              active === opt
                ? "border-accent bg-accent text-[#191A2E]"
                : "border-border bg-bg-elevated text-text hover:border-accent active:bg-bg-card",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
