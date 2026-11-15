"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useCountUp } from "@/components/ui/use-count-up";
import { AnalyzingScreen } from "@/components/ui/analyzing-screen";
import { Confetti } from "@/components/ui/confetti";
import { GradeSlider } from "@/components/examen/grade-slider";
import { consumeResumeFicheCreation } from "@/components/fiches/new/resume-flag";
import { clearDraftSources } from "@/components/fiches/new/local-draft";
import { saveLocalOnboarding, loadLocalOnboarding, clearLocalOnboarding } from "./local-onboarding";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";
import type { ClasseCycle } from "@/lib/supabase/database.types";
import {
  computeGeneralStudyPlan,
  clampGrade,
  roundToGradeStep,
  type GeneralGoalCalcResult,
} from "@/lib/examen/goal-calc";

const CYCLE_VALUES: ClasseCycle[] = ["college", "lycee", "superieur"];

/** A bit above the starting average, so the goal slider never starts at
 * "no improvement" by default — same idea as the exam wizard's own
 * DEFAULT_GOAL_OFFSET (components/examen/goal-wizard.tsx), duplicated
 * rather than shared since the two flows have no other state in common. */
const DEFAULT_GOAL_OFFSET = 2;
const DEFAULT_STARTING_AVERAGE = 10;

/** Onboarding no longer asks "combien de jours par semaine" — the general
 * estimate (computeGeneralStudyPlan) still needs a days/week to turn
 * hours/week into minutes/day, so this assumes a believable middle-ground
 * rhythm instead. Also what gets saved as the default revision_jours_
 * semaine at the end of onboarding (see handleFinish) — editable
 * afterward in "Modifier mon temps de révision" like any other rhythm. */
const ASSUMED_DAYS_PER_WEEK = 5;

/** Same list components/planning/settings-panel.tsx offers in "Modifier
 * mon temps de révision" — kept in sync manually (no shared module for
 * one 7-value array) since this is the only other place it needs to
 * exist: rounding the onboarding result's minutes/day onto a value the
 * student could actually pick there (see roundToNearestMinutesOption,
 * used by handleFinish). */
const MINUTES_OPTIONS = [15, 20, 30, 45, 60, 75, 90];

function roundToNearestMinutesOption(minutes: number): number {
  return MINUTES_OPTIONS.reduce((closest, option) =>
    Math.abs(option - minutes) < Math.abs(closest - minutes) ? option : closest,
  );
}

export type Step =
  | "classe"
  | "niveau"
  | "prenom"
  | "moyenneActuelle"
  | "moyenneObjectif"
  | "analyzing"
  | "result";
const STEP_ORDER: Step[] = ["classe", "niveau", "prenom", "moyenneActuelle", "moyenneObjectif"];

/** What the server already knows about an authenticated-but-incomplete
 * profile, so the wizard can resume exactly where the account left off
 * (see app/onboarding/page.tsx) instead of re-asking classe/niveau/prénom
 * (now saved right after the prénom step, before signup — see
 * handlePrenomContinue) or the moyennes saved along the way. Never set
 * for mode="anonymous". */
export interface OnboardingPrefill {
  prenom?: string | null;
  classeCycle?: ClasseCycle | null;
  classeNiveau?: string | null;
  moyenneGeneraleDepart?: number | null;
  objectifMoyenne?: number | null;
}

export function OnboardingWizard({
  mode,
  initialStep,
  prefill,
}: {
  mode: "anonymous" | "authenticated";
  /** Authenticated resume only — which of the 3 checkpoints the profile
   * has already reached (see app/onboarding/page.tsx's bucket logic). */
  initialStep?: Step;
  prefill?: OnboardingPrefill;
}) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, null);
  const [step, setStep] = useState<Step>(initialStep ?? "classe");

  const [prenom, setPrenom] = useState(prefill?.prenom ?? "");
  const [cycle, setCycle] = useState<ClasseCycle | null>(prefill?.classeCycle ?? null);
  const [niveau, setNiveau] = useState(
    prefill?.classeCycle && prefill.classeCycle !== "superieur" ? (prefill.classeNiveau ?? "") : "",
  );
  const [superieurText, setSuperieurText] = useState(
    prefill?.classeCycle === "superieur" ? (prefill.classeNiveau ?? "") : "",
  );

  const [moyenneActuelle, setMoyenneActuelle] = useState(prefill?.moyenneGeneraleDepart ?? DEFAULT_STARTING_AVERAGE);
  const [moyenneObjectif, setMoyenneObjectif] = useState(
    prefill?.objectifMoyenne ?? DEFAULT_STARTING_AVERAGE + DEFAULT_GOAL_OFFSET,
  );
  const [calcResult, setCalcResult] = useState<GeneralGoalCalcResult | null>(null);
  const [analysisRun, setAnalysisRun] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anonymous only — two cases, never both:
  //  - "nouveau=1" (every landing-page call to action — see
  //    components/marketing/landing-page.tsx / landing-header.tsx): a
  //    forced fresh start. Wipe anything left over from a previous
  //    attempt so this never silently resumes past the first question,
  //    then clean the param off the address bar.
  //  - otherwise, a visitor who already answered classe/niveau/prénom
  //    (saved locally right before being sent to sign up — see
  //    handlePrenomContinue) came back here mid-flow (browser back from
  //    /signup, a reload) — skip straight back to signup instead of
  //    re-asking.
  useEffect(() => {
    if (mode !== "anonymous") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("nouveau") === "1") {
      clearLocalOnboarding();
      consumeResumeFicheCreation();
      void clearDraftSources().catch(() => {});
      params.delete("nouveau");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
      return;
    }

    if (loadLocalOnboarding()) {
      router.replace("/signup");
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

  /** The step that used to be "keep going locally" is now "create your
   * account" — signup happens right after prénom, not at the very end
   * (see the result-step redesign below). Anonymous: stash the trio
   * locally (nothing to attach it to yet) and send the visitor to sign
   * up; authenticated (an account already exists — e.g. resuming from
   * bucket 1, see app/onboarding/page.tsx): save it directly and keep
   * going in this same wizard. */
  async function handlePrenomContinue() {
    if (!cycle) return;
    const finalNiveau = cycle === "superieur" ? superieurText.trim() : niveau;
    setError(null);

    if (mode === "anonymous") {
      saveLocalOnboarding({ prenom: prenom.trim(), classeCycle: cycle, classeNiveau: finalNiveau });
      router.push("/signup");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom: prenom.trim(), classeCycle: cycle, classeNiveau: finalNiveau }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.onboarding.genericError);
      return;
    }
    setStep("moyenneActuelle");
  }

  /** Authenticated-only from here on (anonymous mode never reaches past
   * prénom — see handlePrenomContinue above) — each remaining screen
   * saves straight to the profile as it's answered, "au fil des écrans",
   * rather than waiting for the final "Terminer". */
  async function handleMoyenneActuelleContinue() {
    setMoyenneObjectif(roundToGradeStep(clampGrade(moyenneActuelle + DEFAULT_GOAL_OFFSET)));
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moyenneGeneraleDepart: moyenneActuelle }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.onboarding.genericError);
      return;
    }
    setStep("moyenneObjectif");
  }

  async function handleObjectifValidate() {
    if (!cycle) return;
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectifMoyenne: moyenneObjectif }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.onboarding.genericError);
      return;
    }

    const result = computeGeneralStudyPlan({
      currentAverage20: moyenneActuelle,
      goal20: moyenneObjectif,
      classeCycle: cycle,
      // Onboarding no longer asks for a rhythm — see ASSUMED_DAYS_PER_WEEK.
      revisionJoursSemaine: ASSUMED_DAYS_PER_WEEK,
    });
    setCalcResult(result);
    setAnalysisRun((n) => n + 1);
    setStep("analyzing");
  }

  /** Mirrors goal-wizard.tsx's adoptSuggestedGoal — lets the student accept
   * the easier milestone offered for "very-ambitious"/"progressive"
   * results without leaving the result screen. Persists the corrected
   * objectif too (fire-and-forget: the final "Terminer" below resends it
   * regardless, so a failure here just means a reload before clicking
   * Terminer would show the pre-milestone objectif again — not worth
   * blocking the UI over). */
  function adoptSuggestedObjectif(suggested: number) {
    if (!cycle) return;
    setMoyenneObjectif(suggested);
    const result = computeGeneralStudyPlan({
      currentAverage20: moyenneActuelle,
      goal20: suggested,
      classeCycle: cycle,
      revisionJoursSemaine: ASSUMED_DAYS_PER_WEEK,
    });
    setCalcResult(result);
    fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectifMoyenne: suggested }),
    }).catch(() => {});
  }

  async function handleFinish() {
    if (!calcResult) return;
    setSubmitting(true);
    setError(null);
    const finalNiveau = cycle === "superieur" ? superieurText.trim() : niveau;

    // No rhythm was ever asked in this flow — seed one from the result
    // itself so "Tu as prévu X" keeps working everywhere else (exam
    // creation, planning) instead of comparing against nothing. For
    // "progressive", that's the eased-in starting point (what the result
    // screen actually told the student to begin doing), not the full
    // target load. /api/onboarding only applies this if the profile's
    // rhythm is still untouched — it never overwrites a real choice.
    const defaultMinutesPerDay =
      calcResult.kind === "progressive" ? calcResult.startMinutesPerDay ?? 20 : calcResult.minutesPerDay;

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom,
        classeCycle: cycle,
        classeNiveau: finalNiveau,
        revisionJoursSemaine: ASSUMED_DAYS_PER_WEEK,
        revisionMinutesJour: roundToNearestMinutesOption(defaultMinutesPerDay),
        moyenneGeneraleDepart: moyenneActuelle,
        objectifMoyenne: moyenneObjectif,
        complete: true,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.onboarding.genericError);
      setSubmitting(false);
      return;
    }

    // Resumes the anonymous "Nouvelle fiche" draft (see creation-flow.tsx)
    // if this account came from the public creation screen — otherwise
    // the normal post-onboarding destination is fiche creation itself
    // (signup now happens right after prénom, so onboarding always
    // finishes authenticated — see handlePrenomContinue).
    const resume = consumeResumeFicheCreation();
    router.replace(resume ? "/fiches/new?resume=1" : "/fiches/new");
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
            <Button className="mt-6 w-full" disabled={!canFinish || submitting} onClick={handlePrenomContinue}>
              {t.onboarding.prenom.continuer}
            </Button>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
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
            <Button className="mt-8 w-full" disabled={submitting} onClick={handleMoyenneActuelleContinue}>
              {t.onboarding.moyenne.actuelle.continuer}
            </Button>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
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
                ariaLabel={t.onboarding.moyenne.objectif.title}
              />
            </div>
            <Button className="mt-8 w-full" disabled={submitting} onClick={handleObjectifValidate}>
              {t.onboarding.moyenne.objectif.valider}
            </Button>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </div>
        )}

        {step === "analyzing" && (
          <AnalyzingScreen
            key={analysisRun}
            spinnerLabel={t.onboarding.moyenne.analyzing.title}
            items={[
              t.onboarding.moyenne.analyzing.step1,
              t.onboarding.moyenne.analyzing.step2,
              t.onboarding.moyenne.analyzing.step3,
            ]}
            onDone={() => setStep("result")}
          />
        )}

        {step === "result" && calcResult && (
          <div>
            <Confetti key={`confetti-${analysisRun}`} />
            <div className="rounded-2xl border border-border bg-bg-elevated p-6">
              {calcResult.kind === "already-there" && (
                <p className="text-center font-heading text-xl font-semibold text-text">
                  {t.examen.wizard.result.alreadyThere(t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2))}
                </p>
              )}

              {calcResult.kind === "normal" && (
                <div className="text-center">
                  <p className="font-heading text-lg font-semibold text-text">
                    {t.onboarding.moyenne.result.headline(
                      formatGrade(moyenneActuelle, scale, locale),
                      formatGrade(moyenneObjectif, scale, locale),
                    )}
                  </p>
                  {/* Minutes/day is the big, motivating number; hours/week
                     is the smaller supporting figure underneath — the
                     reverse of the previous single-sentence layout, so the
                     everyday-sized number is what catches the eye. */}
                  <p className="mt-2 font-heading text-5xl font-bold text-accent">
                    {t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay))}
                  </p>
                  <p className="text-sm text-text-muted">{t.examen.wizard.result.perDayLabel}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {t.examen.wizard.result.perWeekLine(t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2))}
                  </p>
                  <p className="mt-3 text-sm font-medium text-accent">
                    {t.examen.wizard.result.encouragement(Math.round(animatedMinutesPerDay))}
                  </p>
                </div>
              )}

              {calcResult.kind === "progressive" && (
                <div className="text-center">
                  <p className="font-heading text-lg font-semibold text-text">
                    {t.examen.wizard.result.progressiveIntro(formatGrade(moyenneObjectif, scale, locale))}
                  </p>
                  <p className="mt-2 font-heading text-5xl font-bold text-accent">
                    {t.examen.wizard.result.minutes(calcResult.startMinutesPerDay ?? 0)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-accent">
                    {t.examen.wizard.result.progressiveStart(t.examen.wizard.result.minutes(calcResult.startMinutesPerDay ?? 0))}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">
                    {t.examen.wizard.result.progressiveFullLoad(
                      t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                    )}
                  </p>
                  {calcResult.suggestedGoal20 !== undefined && (
                    <p className="mt-1 text-sm text-text-muted">
                      {t.examen.wizard.result.progressiveMilestone(formatGrade(calcResult.suggestedGoal20, scale, locale))}
                    </p>
                  )}
                </div>
              )}

              {calcResult.kind === "very-ambitious" && (
                <p className="text-center font-heading text-xl font-semibold text-text">
                  {t.examen.wizard.result.veryAmbitious(
                    formatGrade(moyenneObjectif, scale, locale),
                    t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                    formatGrade(calcResult.suggestedGoal20!, scale, locale),
                  )}
                </p>
              )}

              {calcResult.kind === "excessive-load" && (
                <p className="text-center font-heading text-xl font-semibold text-text">
                  {t.examen.wizard.result.excessiveLoad(
                    formatGrade(moyenneObjectif, scale, locale),
                    t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                    formatGrade(calcResult.suggestedGoal20!, scale, locale),
                  )}
                </p>
              )}

              <p className="mt-4 text-center text-xs text-text-muted">{t.onboarding.moyenne.result.disclaimer}</p>
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            {(calcResult.kind === "very-ambitious" || calcResult.kind === "progressive") &&
              calcResult.suggestedGoal20 !== undefined && (
                <Button
                  className="mt-6 w-full"
                  variant="outline"
                  onClick={() => adoptSuggestedObjectif(calcResult.suggestedGoal20!)}
                >
                  {t.examen.wizard.result.aimForMilestoneButton(formatGrade(calcResult.suggestedGoal20, scale, locale))}
                </Button>
              )}
            <Button
              className={
                (calcResult.kind === "very-ambitious" || calcResult.kind === "progressive") &&
                calcResult.suggestedGoal20 !== undefined
                  ? "mt-3 w-full"
                  : "mt-6 w-full"
              }
              onClick={handleFinish}
              disabled={submitting}
            >
              {submitting ? t.onboarding.moyenne.result.finishing : t.onboarding.moyenne.result.finish}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
