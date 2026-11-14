"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useCountUp } from "@/components/ui/use-count-up";
import { GradeSlider } from "@/components/examen/grade-slider";
import { consumeResumeFicheCreation } from "@/components/fiches/new/resume-flag";
import { saveLocalOnboarding, loadLocalOnboarding } from "./local-onboarding";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";
import type { ClasseCycle } from "@/lib/supabase/database.types";
import {
  computeGeneralStudyPlan,
  clampGrade,
  roundToGradeStep,
  DEFAULT_REVISION_JOURS_SEMAINE,
  type GeneralGoalCalcResult,
} from "@/lib/examen/goal-calc";

const CYCLE_VALUES: ClasseCycle[] = ["college", "lycee", "superieur"];

/** A bit above the starting average, so the goal slider never starts at
 * "no improvement" by default — same idea as the exam wizard's own
 * DEFAULT_GOAL_OFFSET (components/examen/goal-wizard.tsx), duplicated
 * rather than shared since the two flows have no other state in common. */
const DEFAULT_GOAL_OFFSET = 2;
const DEFAULT_STARTING_AVERAGE = 10;

/** Same narrative-animation timing as the exam wizard's analysis step. */
const ANALYZING_STEP_DELAY_MS = 1100;
const ANALYZING_STEP_COUNT = 3;
const ANALYZING_HOLD_MS = 900;

type Step =
  | "classe"
  | "niveau"
  | "prenom"
  | "moyenneActuelle"
  | "moyenneObjectif"
  | "analyzing"
  | "result"
  | "jours"
  | "minutes";
const STEP_ORDER: Step[] = [
  "classe",
  "niveau",
  "prenom",
  "moyenneActuelle",
  "moyenneObjectif",
  "jours",
  "minutes",
];

function nearestOption(value: number, options: number[]): number {
  return options.reduce((best, opt) => (Math.abs(opt - value) < Math.abs(best - value) ? opt : best));
}

export function OnboardingWizard({ mode }: { mode: "anonymous" | "authenticated" }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, null);
  const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
  const MINUTES_OPTIONS = [15, 20, 30, 45, 60, 75, 90];
  const [step, setStep] = useState<Step>("classe");

  const [prenom, setPrenom] = useState("");
  const [cycle, setCycle] = useState<ClasseCycle | null>(null);
  const [niveau, setNiveau] = useState("");
  const [superieurText, setSuperieurText] = useState("");
  const [joursSemaine, setJoursSemaine] = useState(3);
  const [minutesJour, setMinutesJour] = useState(45);

  const [moyenneActuelle, setMoyenneActuelle] = useState(DEFAULT_STARTING_AVERAGE);
  const [moyenneObjectif, setMoyenneObjectif] = useState(DEFAULT_STARTING_AVERAGE + DEFAULT_GOAL_OFFSET);
  const [calcResult, setCalcResult] = useState<GeneralGoalCalcResult | null>(null);
  const [visibleAnalyzingSteps, setVisibleAnalyzingSteps] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anonymous only: a visitor who already answered these (e.g. came back
  // to "/" after already doing this once) doesn't need to redo it —
  // skip straight to the app instead of re-asking.
  useEffect(() => {
    if (mode === "anonymous" && loadLocalOnboarding()) {
      router.replace("/fiches");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function goToMoyenneObjectif() {
    setMoyenneObjectif(roundToGradeStep(clampGrade(moyenneActuelle + DEFAULT_GOAL_OFFSET)));
    setStep("moyenneObjectif");
  }

  function validateObjectif() {
    if (!cycle) return;
    const result = computeGeneralStudyPlan({
      currentAverage20: moyenneActuelle,
      goal20: moyenneObjectif,
      classeCycle: cycle,
      revisionJoursSemaine: DEFAULT_REVISION_JOURS_SEMAINE,
    });
    setCalcResult(result);
    setVisibleAnalyzingSteps(0);
    setStep("analyzing");
  }

  // Same narrative reveal as the exam wizard's analysis step — the
  // computation above already ran synchronously, this is purely timing.
  useEffect(() => {
    if (step !== "analyzing") return;
    const timers: number[] = [];
    for (let i = 1; i <= ANALYZING_STEP_COUNT; i++) {
      timers.push(window.setTimeout(() => setVisibleAnalyzingSteps(i), i * ANALYZING_STEP_DELAY_MS));
    }
    timers.push(
      window.setTimeout(
        () => setStep("result"),
        ANALYZING_STEP_COUNT * ANALYZING_STEP_DELAY_MS + ANALYZING_HOLD_MS,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Pre-fills the still-to-come rhythm screens with this estimate's own
  // assumption (DEFAULT_REVISION_JOURS_SEMAINE days/week) and the closest
  // matching minutes-a-day option, instead of the plain hardcoded
  // defaults — the student still picks on those screens same as before,
  // so anything they then choose there simply takes over, never
  // overwritten back by this estimate.
  function goToRhythmSteps() {
    if (calcResult) {
      setJoursSemaine(DEFAULT_REVISION_JOURS_SEMAINE);
      setMinutesJour(nearestOption(calcResult.minutesPerDay, MINUTES_OPTIONS));
    }
    setStep("jours");
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    const finalNiveau = cycle === "superieur" ? superieurText.trim() : niveau;

    const moyenneFields = {
      moyenneGeneraleDepart: moyenneActuelle,
      objectifMoyenne: moyenneObjectif,
    };

    if (mode === "anonymous") {
      // No account yet — nothing to save server-side. Kept in the
      // browser; applied to the real profile at signup/login (see
      // components/auth/*-form.tsx), or re-asked here, authenticated,
      // if those answers ever go missing (a different device, cleared
      // storage — see local-onboarding.ts).
      saveLocalOnboarding({
        prenom,
        classeCycle: cycle!,
        classeNiveau: finalNiveau,
        revisionJoursSemaine: joursSemaine,
        revisionMinutesJour: minutesJour,
        ...moyenneFields,
      });
      router.replace("/fiches");
      router.refresh();
      return;
    }

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom,
        classeCycle: cycle,
        classeNiveau: finalNiveau,
        revisionJoursSemaine: joursSemaine,
        revisionMinutesJour: minutesJour,
        ...moyenneFields,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.onboarding.genericError);
      setSubmitting(false);
      return;
    }

    // Resumes the anonymous "Nouvelle fiche" draft (see creation-flow.tsx)
    // if this is a brand-new account that came from the public creation
    // screen — otherwise the normal destination.
    const resume = consumeResumeFicheCreation();
    router.replace(resume ? "/fiches/new?resume=1" : "/fiches");
    router.refresh();
  }

  const canGoPrenom = cycle !== "superieur" || superieurText.trim().length > 0;
  const canFinish = prenom.trim().length > 0;

  const animatedHoursPerWeek = useCountUp(calcResult?.hoursPerWeek ?? 0);
  const animatedMinutesPerDay = useCountUp(calcResult?.minutesPerDay ?? 0);

  const formStepIndex = STEP_ORDER.indexOf(step);
  const showProgressBar = formStepIndex >= 0;

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        {showProgressBar && <ProgressBar step={formStepIndex + 1} total={STEP_ORDER.length} />}

        {step === "classe" && (
          <div>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.classe.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.onboarding.classe.subtitle}</p>

            <div className="mt-6 flex flex-col gap-3">
              {CYCLE_VALUES.map((value) => (
                <ChoiceCard
                  key={value}
                  title={t.onboarding.classe.options[value].label}
                  description={t.onboarding.classe.options[value].description}
                  onClick={() => chooseCycle(value)}
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
              className="mb-4 rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.common.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.niveau.title}</h1>

            {cycle === "superieur" ? (
              <div className="mt-6">
                <Input
                  autoFocus
                  placeholder={t.onboarding.niveau.superieurPlaceholder}
                  value={superieurText}
                  onChange={(e) => setSuperieurText(e.target.value)}
                />
                <Button
                  className="mt-6 w-full"
                  disabled={!canGoPrenom}
                  onClick={() => setStep("prenom")}
                >
                  {t.onboarding.niveau.continuer}
                </Button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {(cycle === "college" ? t.onboarding.niveau.collegeNiveaux : t.onboarding.niveau.lyceeNiveaux).map(
                  (value) => (
                    <ChoiceCard key={value} title={value} onClick={() => chooseNiveau(value)} />
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {step === "prenom" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("niveau")}
              className="mb-4 rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.common.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.prenom.title}</h1>
            <p className="mt-2 text-sm text-text-muted">{t.onboarding.prenom.subtitle}</p>
            <Input
              autoFocus
              className="mt-6"
              placeholder={t.onboarding.prenom.placeholder}
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Button className="mt-6 w-full" disabled={!canFinish} onClick={() => setStep("moyenneActuelle")}>
              {t.onboarding.prenom.continuer}
            </Button>
          </div>
        )}

        {step === "moyenneActuelle" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("prenom")}
              className="mb-4 rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.common.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.moyenne.actuelle.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.onboarding.moyenne.actuelle.subtitle}</p>
            <div className="mt-8">
              <GradeSlider
                value={moyenneActuelle}
                onChange={setMoyenneActuelle}
                scale={scale}
                locale={locale}
                ariaLabel={t.onboarding.moyenne.actuelle.title}
              />
            </div>
            <Button className="mt-8 w-full" onClick={goToMoyenneObjectif}>
              {t.onboarding.moyenne.actuelle.continuer}
            </Button>
          </div>
        )}

        {step === "moyenneObjectif" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("moyenneActuelle")}
              className="mb-4 rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.common.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.moyenne.objectif.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.onboarding.moyenne.objectif.subtitle}</p>
            <div className="mt-8">
              <GradeSlider
                value={moyenneObjectif}
                onChange={setMoyenneObjectif}
                scale={scale}
                locale={locale}
                markers={[10, 14, 16]}
                ariaLabel={t.onboarding.moyenne.objectif.title}
              />
            </div>
            <Button className="mt-8 w-full" onClick={validateObjectif}>
              {t.onboarding.moyenne.objectif.valider}
            </Button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex min-h-[20rem] flex-col items-center justify-center">
            <h1 className="mb-8 font-heading text-xl font-semibold">{t.onboarding.moyenne.analyzing.title}</h1>
            <div className="flex w-full flex-col gap-4">
              {[
                t.onboarding.moyenne.analyzing.step1,
                t.onboarding.moyenne.analyzing.step2,
                t.onboarding.moyenne.analyzing.step3,
              ].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 transition-opacity duration-500"
                  style={{ opacity: visibleAnalyzingSteps > i ? 1 : 0 }}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "result" && calcResult && (
          <div>
            <div className="rounded-2xl border border-border bg-bg-elevated p-6">
              <p className="text-center font-heading text-xl font-semibold text-text">
                {calcResult.kind === "already-there" &&
                  t.examen.wizard.result.alreadyThere(
                    t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                  )}
                {calcResult.kind === "normal" &&
                  t.onboarding.moyenne.result.headline(
                    formatGrade(moyenneActuelle, scale, locale),
                    formatGrade(moyenneObjectif, scale, locale),
                    t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                    t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                  )}
                {calcResult.kind === "very-ambitious" &&
                  t.examen.wizard.result.veryAmbitious(
                    formatGrade(moyenneObjectif, scale, locale),
                    t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                    formatGrade(calcResult.suggestedGoal20!, scale, locale),
                  )}
                {calcResult.kind === "excessive-load" &&
                  t.examen.wizard.result.excessiveLoad(
                    formatGrade(moyenneObjectif, scale, locale),
                    t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                    formatGrade(calcResult.suggestedGoal20!, scale, locale),
                  )}
              </p>
              <p className="mt-4 text-center text-xs text-text-muted">{t.onboarding.moyenne.result.disclaimer}</p>
            </div>
            <Button className="mt-6 w-full" onClick={goToRhythmSteps}>
              {t.onboarding.moyenne.result.continuer}
            </Button>
          </div>
        )}

        {step === "jours" && (
          <div>
            <button
              type="button"
              onClick={() => setStep("result")}
              className="mb-4 rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.common.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.jours.title}</h1>
            <p className="mt-2 text-sm text-text-muted">{t.onboarding.jours.subtitle}</p>
            <div className="mt-6 flex flex-col gap-3">
              {DAYS_OPTIONS.map((d) => (
                <ChoiceCard
                  key={d}
                  title={t.onboarding.jours.optionLabel(d)}
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
              className="mb-4 rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.common.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.onboarding.minutes.title}</h1>
            <p className="mt-2 text-sm text-text-muted">{t.onboarding.minutes.subtitle}</p>
            <div className="mt-6 flex flex-col gap-3">
              {MINUTES_OPTIONS.map((m) => (
                <ChoiceCard
                  key={m}
                  title={t.onboarding.minutes.optionLabel(m)}
                  selected={minutesJour === m}
                  onClick={() => setMinutesJour(m)}
                />
              ))}
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            <Button className="mt-6 w-full" onClick={handleFinish} disabled={submitting}>
              {submitting ? t.onboarding.minutes.finishing : t.onboarding.minutes.finish}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
