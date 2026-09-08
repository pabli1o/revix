import type {
  Importance,
  PlanningTaskPartie,
  PlanningTaskType,
} from "@/lib/supabase/database.types";

export interface SchedulerExam {
  id: string;
  date: string; // ISO yyyy-mm-dd
  importance: Importance;
  chapterIds: string[];
}

export interface SchedulerChapter {
  id: string;
  /** Every plan section title across the chapter's active fiches, in
   * reading order — the units a discovery/review pass can be split over. */
  parties: PlanningTaskPartie[];
}

export interface SchedulerSettings {
  revisionJoursSemaine: number; // 1-7
  revisionMinutesJour: number;
}

export interface GeneratedTask {
  examId: string | null;
  chapterId: string;
  date: string; // ISO yyyy-mm-dd
  type: PlanningTaskType;
  parties: PlanningTaskPartie[];
  dureeMinutes: number;
}

const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  normale: 1,
  importante: 2,
  tres_importante: 3,
};

/** Number of "rappel" (review/recall) passes to schedule per chapter,
 * before budgeting/availability constraints trim it down. */
const IMPORTANCE_RAPPEL_COUNT: Record<Importance, number> = {
  normale: 2,
  importante: 3,
  tres_importante: 4,
};

/**
 * Maps a revision-days-per-week count to a fixed, evenly-spread set of ISO
 * weekdays (1 = Monday ... 7 = Sunday). There's no UI for picking specific
 * days, so this gives a deterministic, sensible spread for any count.
 */
const WEEKDAYS_BY_COUNT: Record<number, number[]> = {
  1: [3],
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 7],
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoWeekday(d: Date): number {
  const day = d.getUTCDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

function startOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Every active study day from `today` (inclusive) up to and including
 * `lastDate`, per the weekly rhythm in `settings`. */
function buildStudyDays(today: Date, lastDate: Date, revisionJoursSemaine: number): Date[] {
  const weekdays = new Set(
    WEEKDAYS_BY_COUNT[Math.min(7, Math.max(1, revisionJoursSemaine))] ?? WEEKDAYS_BY_COUNT[4],
  );
  const days: Date[] = [];
  let cursor = startOfDayUtc(today);
  const end = startOfDayUtc(lastDate);
  while (cursor.getTime() <= end.getTime()) {
    if (weekdays.has(isoWeekday(cursor))) {
      days.push(cursor);
    }
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** Nearest study day at or after `ideal`, but never after `hardLimit`.
 * Falls back to the closest available day before `hardLimit` if `ideal`
 * itself is already past it. */
function pickStudyDay(studyDays: Date[], ideal: Date, hardLimit: Date): Date | null {
  const eligible = studyDays.filter((d) => d.getTime() <= hardLimit.getTime());
  if (eligible.length === 0) return null;
  const onOrAfter = eligible.find((d) => d.getTime() >= ideal.getTime());
  return onOrAfter ?? eligible[eligible.length - 1];
}

function estimateDuration(type: PlanningTaskType, partiesCount: number): number {
  const perPartie = type === "decouverte" ? 5 : 3;
  const base = type === "decouverte" ? 15 : 10;
  return Math.max(base, Math.round(partiesCount * perPartie));
}

interface Candidate extends GeneratedTask {
  priority: number;
}

/**
 * Generates the full multi-exam revision plan via spaced repetition:
 * - one "decouverte" pass per chapter (deduplicated across exams sharing a
 *   chapter), scheduled as soon as possible,
 * - several "rappel" passes per exam/chapter, spread between the
 *   discovery date and the exam date,
 * then budgets everything onto actual study days by `revisionMinutesJour`,
 * prioritizing by urgency (days until exam) and importance, pushing
 * whatever doesn't fit a day forward to the next available study day
 * (never past that task's own exam date).
 */
export function generatePlanning(
  exams: SchedulerExam[],
  chapters: Map<string, SchedulerChapter>,
  settings: SchedulerSettings,
  today: Date = new Date(),
): GeneratedTask[] {
  const todayStart = startOfDayUtc(today);
  const futureExams = exams
    .map((e) => ({ ...e, dateObj: startOfDayUtc(new Date(e.date)) }))
    .filter((e) => e.dateObj.getTime() >= todayStart.getTime());

  if (futureExams.length === 0) return [];

  const lastExamDate = futureExams.reduce(
    (latest, e) => (e.dateObj.getTime() > latest.getTime() ? e.dateObj : latest),
    futureExams[0].dateObj,
  );
  const studyDays = buildStudyDays(todayStart, lastExamDate, settings.revisionJoursSemaine);
  if (studyDays.length === 0) return [];

  const candidates: Candidate[] = [];
  const discoveryScheduled = new Set<string>();
  const discoveryDateByChapter = new Map<string, Date>();

  // Sort exams by date so the nearest exam claims a chapter's discovery pass.
  const examsByDate = [...futureExams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  for (const exam of examsByDate) {
    const urgencyDays = Math.max(1, daysBetween(todayStart, exam.dateObj));
    const importanceWeight = IMPORTANCE_WEIGHT[exam.importance];
    const priority = importanceWeight * 100 - urgencyDays;

    for (const chapterId of exam.chapterIds) {
      const chapter = chapters.get(chapterId);
      const parties = chapter?.parties.length
        ? chapter.parties
        : [{ numero: 1, titre: "Ensemble du chapitre" }];

      let discoveryDate = discoveryDateByChapter.get(chapterId) ?? null;

      if (!discoveryScheduled.has(chapterId)) {
        const idealDiscovery = todayStart;
        const day = pickStudyDay(studyDays, idealDiscovery, exam.dateObj);
        if (day) {
          candidates.push({
            examId: exam.id,
            chapterId,
            date: toIsoDate(day),
            type: "decouverte",
            parties,
            dureeMinutes: estimateDuration("decouverte", parties.length),
            priority: priority + 50, // discovery always takes precedence
          });
          discoveryScheduled.add(chapterId);
          discoveryDateByChapter.set(chapterId, day);
          discoveryDate = day;
        }
      }

      const anchor = discoveryDate ?? todayStart;
      const spanDays = Math.max(1, daysBetween(anchor, exam.dateObj));
      const rappelCount = Math.min(
        IMPORTANCE_RAPPEL_COUNT[exam.importance],
        Math.max(1, Math.floor(spanDays / 2)),
      );

      for (let i = 1; i <= rappelCount; i++) {
        const fraction = i / (rappelCount + 1);
        const idealDate = addDays(anchor, Math.round(spanDays * fraction));
        const day = pickStudyDay(studyDays, idealDate, exam.dateObj);
        if (!day || day.getTime() === anchor.getTime()) continue;
        candidates.push({
          examId: exam.id,
          chapterId,
          date: toIsoDate(day),
          type: "rappel",
          parties,
          dureeMinutes: estimateDuration("rappel", parties.length),
          priority,
        });
      }
    }
  }

  return budgetOntoStudyDays(candidates, studyDays, settings.revisionMinutesJour, exams);
}

/** Greedily fills each study day up to the minutes budget, highest
 * priority first; anything that doesn't fit is pushed to the next
 * available study day (never past its own exam's date). */
function budgetOntoStudyDays(
  candidates: Candidate[],
  studyDays: Date[],
  minutesPerDay: number,
  exams: SchedulerExam[],
): GeneratedTask[] {
  const examDateById = new Map(exams.map((e) => [e.id, startOfDayUtc(new Date(e.date))]));
  const sortedDays = [...studyDays].sort((a, b) => a.getTime() - b.getTime());
  const dayIndexByIso = new Map(sortedDays.map((d, i) => [toIsoDate(d), i]));

  // Bucket candidates by their initially assigned day index.
  const buckets = new Map<number, Candidate[]>();
  for (const c of candidates) {
    const idx = dayIndexByIso.get(c.date) ?? 0;
    if (!buckets.has(idx)) buckets.set(idx, []);
    buckets.get(idx)!.push(c);
  }

  const result: GeneratedTask[] = [];
  let overflow: Candidate[] = [];

  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i];
    const todaysCandidates = [...overflow, ...(buckets.get(i) ?? [])].sort(
      (a, b) => b.priority - a.priority,
    );
    overflow = [];

    let minutesUsed = 0;
    for (const c of todaysCandidates) {
      const examDate = c.examId ? examDateById.get(c.examId) : undefined;
      const pastDeadline = examDate ? day.getTime() > examDate.getTime() : false;

      if (!pastDeadline && minutesUsed + c.dureeMinutes <= minutesPerDay) {
        minutesUsed += c.dureeMinutes;
        result.push({
          examId: c.examId,
          chapterId: c.chapterId,
          date: toIsoDate(day),
          type: c.type,
          parties: c.parties,
          dureeMinutes: c.dureeMinutes,
        });
      } else if (!examDate || addDays(day, 1).getTime() <= examDate.getTime()) {
        overflow.push(c);
      }
      // else: no more room before the exam — dropped rather than scheduled late.
    }
  }

  return result;
}
