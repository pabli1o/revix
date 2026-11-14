"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useCountUp } from "@/components/ui/use-count-up";
import { CalendarPicker } from "@/components/planning/calendar-picker";
import { GradeSlider } from "@/components/examen/grade-slider";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";
import type { GradeScale } from "@/lib/supabase/database.types";
import {
  computeStudyPlan,
  daysUntil,
  clampGrade,
  roundToGradeStep,
  type GoalCalcResult,
} from "@/lib/examen/goal-calc";

interface SubjectOption {
  id: string;
  nom: string;
}
interface ChapterOption {
  id: string;
  nom: string;
  subject_id: string;
}

/** A bit above the current average, so the goal slider never starts at
 * "no improvement" by default — per spec. Purely a UI starting point,
 * not part of the hours estimate itself (see goal-calc.ts). */
const DEFAULT_GOAL_OFFSET = 2;

/** Used for the current-average slider when the subject has no graded
 * exams yet to pre-fill from ("Je n'ai pas encore de note") — the
 * midpoint of the /20 scale, a neutral starting guess. */
const DEFAULT_CURRENT_AVERAGE = 10;

const COEFFICIENT_STEP = 0.5;
const MIN_COEFFICIENT = 0.5;
const MAX_COEFFICIENT = 20;
const DEFAULT_COEFFICIENT = 1;

/** 3 narrative beats shown one after another during the "analysis"
 * animation, ~1.1s apart — each corresponds to a real input the
 * calculation already used (see computeStudyPlan), nothing invented. */
const ANALYZING_STEP_DELAY_MS = 1100;
const ANALYZING_STEP_COUNT = 3;
const ANALYZING_HOLD_MS = 900;

type Step =
  | "subject"
  | "chapters"
  | "date"
  | "coefficient"
  | "average"
  | "goal"
  | "analyzing"
  | "result"
  | "generating"
  | "done";
const FORM_STEP_ORDER: Step[] = ["subject", "chapters", "date", "coefficient", "average", "goal"];

export function GoalWizard({
  subjects,
  chapters,
  ficheCountByChapter,
  averageBySubject,
  revisionJoursSemaine,
  gradeScaleOverride,
  suggestedGoal20,
  onClose,
}: {
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  /** Non-deleted fiche count per chapter id — the content base the hours
   * estimate scales from, summed over whichever chapters this exam
   * covers (see goal-calc.ts's computeContentBaseHours). */
  ficheCountByChapter: Record<string, number>;
  /** Coefficient-weighted average of this subject's already-graded exams,
   * /20 — null when the subject has none yet. */
  averageBySubject: Record<string, number | null>;
  revisionJoursSemaine: number;
  gradeScaleOverride: GradeScale | null;
  /** Part B's "remonter ma moyenne" link (lib/examen/average-calc.ts's
   * computeNeededAverage): pre-fills the goal step instead of the usual
   * "current average + 2" default — the student still has to confirm it
   * on the goal step like any other goal, nothing skips ahead. */
  suggestedGoal20?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, gradeScaleOverride);

  const [step, setStep] = useState<Step>("subject");

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<string | null>(null);
  const [coefficient, setCoefficient] = useState(DEFAULT_COEFFICIENT);
  const [stepError, setStepError] = useState<string | null>(null);

  const [currentAverage20, setCurrentAverage20] = useState(DEFAULT_CURRENT_AVERAGE);
  const [goal20, setGoal20] = useState(DEFAULT_CURRENT_AVERAGE + DEFAULT_GOAL_OFFSET);

  const [calcResult, setCalcResult] = useState<GoalCalcResult | null>(null);
  const [visibleAnalyzingSteps, setVisibleAnalyzingSteps] = useState(0);

  const [genError, setGenError] = useState<string | null>(null);

  const subject = subjects.find((s) => s.id === subjectId) ?? null;
  const subjectChapters = subjectId ? chapters.filter((c) => c.subject_id === subjectId) : [];
  const hasRealAverage = subjectId ? averageBySubject[subjectId] != null : false;
  const allChaptersSelected = subjectChapters.length > 0 && subjectChapters.every((c) => selectedChapterIds.has(c.id));

  function resetToInfo() {
    setStep("subject");
    setSubjectId(null);
    setSelectedChapterIds(new Set());
    setDate(null);
    setCoefficient(DEFAULT_COEFFICIENT);
    setStepError(null);
    setCurrentAverage20(DEFAULT_CURRENT_AVERAGE);
    setGoal20(DEFAULT_CURRENT_AVERAGE + DEFAULT_GOAL_OFFSET);
    setCalcResult(null);
    setGenError(null);
  }

  function chooseSubject(id: string) {
    setSubjectId(id);
    setSelectedChapterIds(new Set());
  }

  function toggleChapter(id: string) {
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllChapters() {
    setSelectedChapterIds(allChaptersSelected ? new Set() : new Set(subjectChapters.map((c) => c.id)));
  }

  function goToChaptersStep() {
    if (!subjectId) {
      setStepError(t.examen.wizard.subjectStep.missingFields);
      return;
    }
    setStepError(null);
    setStep("chapters");
  }

  function goToDateStep() {
    if (selectedChapterIds.size === 0) {
      setStepError(t.examen.wizard.chaptersStep.missingFields);
      return;
    }
    setStepError(null);
    setStep("date");
  }

  function goToCoefficientStep() {
    if (!date) {
      setStepError(t.examen.wizard.dateStep.missingFields);
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (date < todayIso) {
      setStepError(t.examen.wizard.dateStep.pastDateError);
      return;
    }
    setStepError(null);
    setStep("coefficient");
  }

  function goToAverageStep() {
    if (!subjectId) return;
    const real = averageBySubject[subjectId];
    const start = real ?? DEFAULT_CURRENT_AVERAGE;
    setCurrentAverage20(start);
    setGoal20(
      suggestedGoal20 != null ? clampGrade(suggestedGoal20) : roundToGradeStep(clampGrade(start + DEFAULT_GOAL_OFFSET)),
    );
    setStep("average");
  }

  function ficheCountForSelection(): number {
    let total = 0;
    for (const id of selectedChapterIds) total += ficheCountByChapter[id] ?? 0;
    return total;
  }

  function validateGoal() {
    if (!date) return;
    const result = computeStudyPlan({
      currentAverage20,
      goal20,
      ficheCount: ficheCountForSelection(),
      daysUntilExam: daysUntil(date),
      revisionJoursSemaine,
    });
    setCalcResult(result);
    setVisibleAnalyzingSteps(0);
    setStep("analyzing");
  }

  // Reveals the 3 analysis beats one at a time, then auto-advances to the
  // result — purely narrative timing, the real computation already ran
  // synchronously in validateGoal() above.
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

  function adoptSuggestedGoal(suggested: number) {
    if (!date) return;
    setGoal20(suggested);
    const result = computeStudyPlan({
      currentAverage20,
      goal20: suggested,
      ficheCount: ficheCountForSelection(),
      daysUntilExam: daysUntil(date),
      revisionJoursSemaine,
    });
    setCalcResult(result);
  }

  async function handleGenerate() {
    if (!subjectId || !date || !calcResult || selectedChapterIds.size === 0) return;
    setGenError(null);
    setStep("generating");

    const examRes = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        chapterIds: Array.from(selectedChapterIds),
        date,
        coefficient,
        noteVisee: goal20,
        moyenneDeclareeDepart: currentAverage20,
      }),
    });
    if (!examRes.ok) {
      const data = (await examRes.json().catch(() => null)) as { error?: string } | null;
      setGenError(data?.error ?? t.examen.wizard.result.generationError);
      setStep("result");
      return;
    }

    await fetch("/api/planning/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revisionJoursSemaine,
        revisionMinutesJour: Math.max(5, Math.round(calcResult.minutesPerDay)),
      }),
    });

    const planRes = await fetch("/api/planning/generate", { method: "POST" });
    if (!planRes.ok) {
      setGenError(t.examen.wizard.generating.error);
      setStep("result");
      return;
    }

    router.refresh();
    setStep("done");
  }

  const animatedHoursPerWeek = useCountUp(calcResult?.hoursPerWeek ?? 0);
  const animatedMinutesPerDay = useCountUp(calcResult?.minutesPerDay ?? 0);

  const formStepIndex = FORM_STEP_ORDER.indexOf(step as Step);
  const showProgressBar = formStepIndex >= 0;

  return (
    <div className="notebook-paper fixed inset-0 z-50 overflow-y-auto">
      <div
        className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 py-6"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="font-heading text-lg font-semibold">{t.examen.wizard.title}</p>
          <button
            type="button"
            onClick={onClose}
            disabled={step === "generating"}
            aria-label={t.examen.wizard.closeAria}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {showProgressBar && <ProgressBar step={formStepIndex + 1} total={FORM_STEP_ORDER.length} />}

        {step === "subject" && (
          <div className="flex flex-1 flex-col">
            <h1 className="font-heading text-2xl font-semibold">{t.examen.wizard.subjectStep.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.examen.wizard.subjectStep.subtitle}</p>

            <div className="mt-6">
              {subjects.length === 0 ? (
                <p className="text-sm text-text-muted">{t.examen.wizard.subjectStep.noSubjects}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {subjects.map((s) => (
                    <ChoiceCard key={s.id} compact title={s.nom} selected={subjectId === s.id} onClick={() => chooseSubject(s.id)} />
                  ))}
                </div>
              )}
            </div>

            {stepError && <p className="mt-4 text-sm text-danger">{stepError}</p>}

            <div className="mt-8">
              <Button size="lg" className="w-full" onClick={goToChaptersStep} disabled={subjects.length === 0}>
                {t.examen.wizard.subjectStep.continueButton}
              </Button>
            </div>
          </div>
        )}

        {step === "chapters" && subject && (
          <div className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("subject")}
              className="mb-4 w-fit rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.examen.wizard.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.examen.wizard.chaptersStep.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.examen.wizard.chaptersStep.subtitle}</p>

            {subjectChapters.length === 0 ? (
              <p className="mt-6 text-sm text-text-muted">{t.examen.wizard.chaptersStep.noChaptersYet}</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleSelectAllChapters}
                  className="mt-6 w-fit rounded-full border border-accent/50 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  {t.examen.wizard.chaptersStep.selectAllButton}
                </button>
                <div className="mt-3 flex flex-col gap-2">
                  {subjectChapters.map((c) => (
                    <ChoiceCard
                      key={c.id}
                      compact
                      title={c.nom}
                      selected={selectedChapterIds.has(c.id)}
                      onClick={() => toggleChapter(c.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {stepError && <p className="mt-4 text-sm text-danger">{stepError}</p>}

            <div className="mt-8">
              <Button size="lg" className="w-full" onClick={goToDateStep} disabled={subjectChapters.length === 0}>
                {t.examen.wizard.chaptersStep.continueButton}
              </Button>
            </div>
          </div>
        )}

        {step === "date" && (
          <div className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("chapters")}
              className="mb-4 w-fit rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.examen.wizard.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.examen.wizard.dateStep.title}</h1>

            <div className="mt-6">
              <CalendarPicker value={date} onChange={setDate} />
            </div>

            {stepError && <p className="mt-4 text-sm text-danger">{stepError}</p>}

            <div className="mt-8">
              <Button size="lg" className="w-full" onClick={goToCoefficientStep}>
                {t.examen.wizard.dateStep.continueButton}
              </Button>
            </div>
          </div>
        )}

        {step === "coefficient" && (
          <div className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("date")}
              className="mb-4 w-fit rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.examen.wizard.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.examen.wizard.coefficientStep.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.examen.wizard.coefficientStep.subtitle}</p>

            <div className="mt-8 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => setCoefficient((c) => Math.max(MIN_COEFFICIENT, Math.round((c - COEFFICIENT_STEP) * 10) / 10))}
                aria-label="−"
                className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border text-2xl font-semibold text-text transition-colors hover:border-accent hover:text-accent"
              >
                −
              </button>
              <span className="w-20 text-center font-heading text-3xl font-bold text-accent">
                {formatNumber(coefficient, locale)}
              </span>
              <button
                type="button"
                onClick={() => setCoefficient((c) => Math.min(MAX_COEFFICIENT, Math.round((c + COEFFICIENT_STEP) * 10) / 10))}
                aria-label="+"
                className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border text-2xl font-semibold text-text transition-colors hover:border-accent hover:text-accent"
              >
                +
              </button>
            </div>

            <div className="mt-8">
              <Button size="lg" className="w-full" onClick={goToAverageStep}>
                {t.examen.wizard.coefficientStep.continueButton}
              </Button>
            </div>
          </div>
        )}

        {step === "average" && subject && (
          <div className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("coefficient")}
              className="mb-4 w-fit rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.examen.wizard.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.examen.wizard.average.title(subject.nom)}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {hasRealAverage ? t.examen.wizard.average.subtitleWithGrades : t.examen.wizard.average.subtitleNoGrades}
            </p>

            <div className="mt-8">
              <GradeSlider
                value={currentAverage20}
                onChange={setCurrentAverage20}
                scale={scale}
                locale={locale}
                ariaLabel={t.examen.wizard.average.title(subject.nom)}
              />
            </div>

            {!hasRealAverage && (
              <button
                type="button"
                onClick={() => setStep("goal")}
                className="mt-4 self-center text-sm font-medium text-accent underline-offset-2 hover:underline"
              >
                {t.examen.wizard.average.noGradeLink}
              </button>
            )}

            <div className="mt-8">
              <Button size="lg" className="w-full" onClick={() => setStep("goal")}>
                {t.examen.wizard.average.continueButton}
              </Button>
            </div>
          </div>
        )}

        {step === "goal" && subject && (
          <div className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => setStep("average")}
              className="mb-4 w-fit rounded-full border border-border bg-black/[0.03] px-4 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ← {t.examen.wizard.back}
            </button>
            <h1 className="font-heading text-2xl font-semibold">{t.examen.wizard.goal.title(subject.nom)}</h1>
            <p className="mt-1 text-sm text-text-muted">{t.examen.wizard.goal.subtitle}</p>

            <div className="mt-8">
              <GradeSlider
                value={goal20}
                onChange={setGoal20}
                scale={scale}
                locale={locale}
                markers={[10, 14, 16]}
                ariaLabel={t.examen.wizard.goal.title(subject.nom)}
              />
              <p className="mt-6 text-center text-xs text-text-muted">{t.examen.wizard.goal.markerNote}</p>
            </div>

            <div className="mt-8">
              <Button size="lg" className="w-full" onClick={validateGoal}>
                {t.examen.wizard.goal.validateButton}
              </Button>
            </div>
          </div>
        )}

        {step === "analyzing" && calcResult && date && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <h1 className="mb-8 font-heading text-xl font-semibold">{t.examen.wizard.analyzing.title}</h1>
            <div className="flex w-full flex-col gap-4">
              {[
                t.examen.wizard.analyzing.step1,
                t.examen.wizard.analyzing.step2,
                t.examen.wizard.analyzing.step3,
              ].map((label, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 transition-opacity duration-500"
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

        {step === "result" && calcResult && date && (
          <div className="flex flex-1 flex-col">
            <div className="rounded-2xl border border-border bg-bg-card p-6">
              <p className="text-center font-heading text-xl font-semibold text-text">
                {calcResult.kind === "already-there" &&
                  t.examen.wizard.result.alreadyThere(t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2))}
                {calcResult.kind === "normal" &&
                  t.examen.wizard.result.normalHeadline(
                    formatGrade(goal20, scale, locale),
                    t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                    t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                  )}
                {calcResult.kind === "very-ambitious" &&
                  t.examen.wizard.result.veryAmbitious(
                    formatGrade(goal20, scale, locale),
                    t.examen.wizard.result.hours(Math.round(animatedHoursPerWeek * 2) / 2),
                    formatGrade(calcResult.suggestedGoal20!, scale, locale),
                  )}
                {calcResult.kind === "excessive-load" &&
                  t.examen.wizard.result.excessiveLoad(
                    formatGrade(goal20, scale, locale),
                    t.examen.wizard.result.minutes(Math.round(animatedMinutesPerDay)),
                    formatGrade(calcResult.suggestedGoal20!, scale, locale),
                  )}
              </p>
              <p className="mt-3 text-center text-sm text-text-muted">
                {t.examen.wizard.result.examDateInfo(
                  formatDate(date, locale, { day: "numeric", month: "long" }),
                  t.examen.wizard.result.inWeeks(Math.round(daysUntil(date) / 7)),
                )}
              </p>
              <p className="mt-4 text-center text-xs text-text-muted">{t.examen.wizard.estimateDisclaimer}</p>
            </div>

            {genError && <p className="mt-4 text-sm text-danger">{genError}</p>}

            <div className="mt-6 flex flex-col gap-3">
              {calcResult.kind === "very-ambitious" && calcResult.suggestedGoal20 !== undefined && (
                <Button size="lg" onClick={() => adoptSuggestedGoal(calcResult.suggestedGoal20!)}>
                  {t.examen.wizard.result.aimForMilestoneButton(formatGrade(calcResult.suggestedGoal20, scale, locale))}
                </Button>
              )}
              {calcResult.kind === "excessive-load" && calcResult.suggestedGoal20 !== undefined && (
                <Button size="lg" onClick={() => adoptSuggestedGoal(calcResult.suggestedGoal20!)}>
                  {t.examen.wizard.result.aimForSuggestedButton(formatGrade(calcResult.suggestedGoal20, scale, locale))}
                </Button>
              )}
              <Button
                size="lg"
                variant={calcResult.kind === "very-ambitious" || calcResult.kind === "excessive-load" ? "outline" : "primary"}
                onClick={handleGenerate}
              >
                {t.examen.wizard.result.generatePlanningButton}
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setStep("goal")}>
                {t.examen.wizard.result.changeGoalButton}
              </Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="size-10 animate-spin rounded-full border-4 border-border border-t-accent" aria-hidden />
            <p className="font-heading text-lg font-semibold">{t.examen.wizard.generating.title}</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent text-white">
              <svg viewBox="0 0 24 24" fill="none" className="size-8">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="font-heading text-xl font-semibold">{t.examen.wizard.generating.doneTitle}</p>
              <p className="mt-1 text-sm text-text-muted">{t.examen.wizard.generating.doneSubtitle}</p>
            </div>
            <div className="flex w-full flex-col gap-3">
              <Button size="lg" onClick={() => router.push("/planning")}>
                {t.examen.wizard.generating.openPlanningButton}
              </Button>
              <Button size="lg" variant="secondary" onClick={resetToInfo}>
                {t.examen.wizard.generating.addAnotherButton}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
