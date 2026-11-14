"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { AnalyzingScreen } from "@/components/ui/analyzing-screen";
import { Confetti } from "@/components/ui/confetti";
import { useCountUp } from "@/components/ui/use-count-up";
import { GradeSlider } from "@/components/examen/grade-slider";
import { useLocale } from "@/components/i18n/locale-provider";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";
import {
  computeGeneralStudyPlan,
  DEFAULT_REVISION_JOURS_SEMAINE,
  type GeneralGoalCalcResult,
} from "@/lib/examen/goal-calc";

/** The hero's own "6 to 14" example, reused as this demo's starting
 * point — no account exists yet at this point, so there's no real school
 * level to ask for; "lycee" is a reasonable, simply-documented stand-in
 * (see goal-calc.ts's GENERAL_BASE_HOURS_PER_WEEK) for a figure that's
 * explicitly illustrative anyway (the hero's own disclaimer already says
 * so) rather than adding a classe/niveau picker to a landing page demo. */
const DEMO_CURRENT_AVERAGE = 6;
const DEMO_GOAL_AVERAGE = 14;
const DEMO_CLASSE_CYCLE = "lycee" as const;

type Step = "sliders" | "analyzing" | "result";

/**
 * The landing page's real, interactive "try it" demo, right under the
 * hero — same computeGeneralStudyPlan() math and the same analysis
 * animation as the onboarding flow (components/onboarding/wizard.tsx),
 * just with no account and a fixed "lycee" assumption. Never a scripted
 * fake result: whatever the two sliders are set to when "Lancer
 * l'analyse" is pressed is what actually gets computed.
 */
export function DemoCalculator() {
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, null);

  const [step, setStep] = useState<Step>("sliders");
  const [current, setCurrent] = useState(DEMO_CURRENT_AVERAGE);
  const [goal, setGoal] = useState(DEMO_GOAL_AVERAGE);
  const [calcResult, setCalcResult] = useState<GeneralGoalCalcResult | null>(null);
  const [analysisRun, setAnalysisRun] = useState(0);

  function runAnalysis() {
    const result = computeGeneralStudyPlan({
      currentAverage20: current,
      goal20: goal,
      classeCycle: DEMO_CLASSE_CYCLE,
      revisionJoursSemaine: DEFAULT_REVISION_JOURS_SEMAINE,
    });
    setCalcResult(result);
    setAnalysisRun((n) => n + 1);
    setStep("analyzing");
  }

  const animatedHoursPerWeek = useCountUp(calcResult?.hoursPerWeek ?? 0);
  const animatedMinutesPerDay = useCountUp(calcResult?.minutesPerDay ?? 0);

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-border bg-bg-card p-6 shadow-sm sm:p-8">
      {step === "sliders" && (
        <div>
          <h2 className="text-center font-heading text-2xl font-semibold">{t.landing.demoCalculator.title}</h2>
          <p className="mt-1.5 text-center text-sm text-text-muted">{t.landing.demoCalculator.subtitle}</p>

          <div className="mt-8">
            <label className="mb-1 block text-center text-sm font-medium text-text-muted">
              {t.landing.demoCalculator.currentLabel}
            </label>
            <GradeSlider
              value={current}
              onChange={setCurrent}
              scale={scale}
              locale={locale}
              ariaLabel={t.landing.demoCalculator.currentLabel}
            />
          </div>

          <div className="mt-8">
            <label className="mb-1 block text-center text-sm font-medium text-text-muted">
              {t.landing.demoCalculator.goalLabel}
            </label>
            <GradeSlider
              value={goal}
              onChange={setGoal}
              scale={scale}
              locale={locale}
              ariaLabel={t.landing.demoCalculator.goalLabel}
            />
          </div>

          <Button size="lg" className="mt-8 w-full" onClick={runAnalysis}>
            {t.landing.demoCalculator.launchButton}
          </Button>
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
            <p className="text-center font-heading text-xl font-semibold text-text">
              {calcResult.kind === "already-there" &&
                t.examen.wizard.result.alreadyThere(t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2))}
              {calcResult.kind === "normal" &&
                t.onboarding.moyenne.result.headline(
                  formatGrade(current, scale, locale),
                  formatGrade(goal, scale, locale),
                  t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                  t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                )}
              {calcResult.kind === "very-ambitious" &&
                t.examen.wizard.result.veryAmbitious(
                  formatGrade(goal, scale, locale),
                  t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                  formatGrade(calcResult.suggestedGoal20!, scale, locale),
                )}
              {calcResult.kind === "excessive-load" &&
                t.examen.wizard.result.excessiveLoad(
                  formatGrade(goal, scale, locale),
                  t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                  formatGrade(calcResult.suggestedGoal20!, scale, locale),
                )}
            </p>
            <p className="mt-4 text-center text-xs text-text-muted">{t.onboarding.moyenne.result.disclaimer}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href="/onboarding" size="lg" className="w-full">
              {t.landing.demoCalculator.createPlanButton}
            </ButtonLink>
            <Button size="lg" variant="ghost" onClick={() => setStep("sliders")}>
              {t.examen.wizard.back}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
