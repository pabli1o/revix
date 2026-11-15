import type { ExamenDict } from "../fr/examen";

const nf = new Intl.NumberFormat("en-US");

export const examen: ExamenDict = {
  noChapter: "No chapter",
  addExam: "+ Add an exam",
  distributionNote:
    "Each exam gets spread over the time left before it, prioritizing the most urgent notes and chapters you haven't reviewed yet.",
  editRhythm: "Change my study rhythm",
  yourExams: "Your exams",
  generatePlanning: "Generate the plan",
  generatingPlanning: "Generating…",
  confirmDeleteExam: "Delete this exam and its planning?",
  noExamsYet: "No exam added yet.",
  coefficientBadge: (coefficient: number) => `Coeff. ${nf.format(coefficient)}`,
  goalBadge: (goal: string, obtained: string | null) =>
    obtained ? `Goal ${goal} · got ${obtained}` : `Goal ${goal}`,
  importance: {
    normale: { label: "Normal", description: "A test like any other" },
    importante: { label: "Important", description: "Counts more toward your grade" },
    tresImportante: { label: "Very important", description: "A decisive exam — finals, board exams…" },
  },
  calendar: {
    previousMonth: "Previous month",
    nextMonth: "Next month",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  wizard: {
    title: "Grade goal",
    closeAria: "Close",
    estimateDisclaimer: "Always an estimate, never a promise of a grade.",
    progressStep: (step: number, total: number) => `Step ${step} of ${total}`,
    back: "Back",
    subjectStep: {
      title: "Which subject?",
      subtitle: "Pick the subject of this exam.",
      subjectLabel: "Subject",
      noSubjects: "Create a subject in Notes first before adding an exam.",
      continueButton: "Continue",
      missingFields: "Pick a subject.",
    },
    chaptersStep: {
      title: "Which chapters?",
      subtitle: "Select at least one chapter covered by this exam.",
      selectAllButton: "The whole subject",
      noChaptersYet: "Create some notes in this subject first to get chapters.",
      continueButton: "Continue",
      missingFields: "Pick at least one chapter.",
    },
    dateStep: {
      title: "What's the exam date?",
      dateLabel: "Exam date",
      continueButton: "Continue",
      missingFields: "Pick a date.",
      pastDateError: "The exam date must be in the future.",
    },
    coefficientStep: {
      title: "What coefficient?",
      subtitle: "An exam that counts for more in your grade gets more review time.",
      continueButton: "Continue",
    },
    average: {
      title: (subject: string) => `Your current average in ${subject}`,
      subtitleWithGrades: "Pre-filled from your already-graded exams in this subject.",
      subtitleNoGrades:
        "You don't have a recorded grade in this subject yet. Adjust the slider if you have a sense of your level.",
      noGradeLink: "I don't have a grade yet",
      continueButton: "Continue",
    },
    goal: {
      title: (subject: string) => `Your goal in ${subject}`,
      subtitle: "Set the grade you're aiming for. Nothing is calculated until you confirm.",
      validateButton: "Confirm my goal",
    },
    analyzing: {
      title: "Analyzing…",
      step1: "Gap between your current average and your goal",
      step2: "Factoring in your exam date",
      step3: "Building your study rhythm",
    },
    result: {
      hours: (h: number) => `${nf.format(h)} hr${h === 1 ? "" : "s"}`,
      minutes: (m: number) => `${nf.format(m)} minute${m === 1 ? "" : "s"}`,
      inWeeks: (n: number) => (n <= 0 ? "this week" : n === 1 ? "in 1 week" : `in ${nf.format(n)} weeks`),
      normalHeadline: (goal: string) => `To reach ${goal}:`,
      perDayLabel: "a day",
      perWeekLine: (hoursPerWeek: string) => `about ${hoursPerWeek} a week`,
      encouragement: (minutesPerDay: number) => {
        if (minutesPerDay <= 20) return "That's less than one episode of a show, every day.";
        if (minutesPerDay <= 40) return "About the length of one episode of a show, every day.";
        return "A real commitment, but still manageable with a bit of organizing.";
      },
      examDateInfo: (dateLabel: string, weeksLabel: string) =>
        `Exam on ${dateLabel}, ${weeksLabel}. Estimate based on your average and your goal.`,
      alreadyThere: (hoursPerWeek: string) =>
        `You're already at that level. About ${hoursPerWeek} a week will keep you there.`,
      veryAmbitious: (goal: string, hoursPerWeek: string, milestone: string) =>
        `${goal} is very ambitious — doable if you commit: about ${hoursPerWeek} a week. To pace yourself, aim for ${milestone} first.`,
      aimForMilestoneButton: (milestone: string) => `Aim for ${milestone} first`,
      excessiveLoad: (goal: string, dailyLoad: string, suggestedGoal: string) =>
        `Reaching ${goal} would mean about ${dailyLoad} a day before the exam — not realistic in this timeframe. A more realistic goal: ${suggestedGoal}.`,
      aimForSuggestedButton: (suggestedGoal: string) => `Aim for ${suggestedGoal} instead`,
      progressiveIntro: (goal: string) => `To reach ${goal}, the full rhythm is a lot.`,
      progressiveStart: (startMinutes: string) => `Start at ${startMinutes} a day, then build up gradually.`,
      progressiveFullLoad: (hoursPerWeek: string) => `The full rhythm is about ${hoursPerWeek} a week.`,
      progressiveMilestone: (milestone: string) => `To ease into it, aim for ${milestone} first.`,
      generatePlanningButton: "Generate my plan",
      changeGoalButton: "Change my goal",
      generationError: "Something went wrong creating the exam.",
      compareInsufficient: (needed: string, chosen: string, gap: string) =>
        `You need about ${needed} a week. You've planned ${chosen}: that's about ${gap} short.`,
      compareSufficient: (needed: string, chosen: string) =>
        `You need about ${needed} a week. You've planned ${chosen}: that's plenty.`,
      compareExcessive: (needed: string, chosen: string) =>
        `You need about ${needed} a week. You've planned ${chosen}: more than necessary — keep that pace or ease off a bit, your call.`,
    },
    generating: {
      title: "Generating your plan…",
      doneTitle: "Your plan is ready",
      doneSubtitle: "It accounts for this goal and all your other exams.",
      openPlanningButton: "Open my plan",
      addAnotherButton: "Add another exam",
      error: "Something went wrong generating the plan.",
    },
  },
  gradeEntry: {
    question: (subject: string) => `How did your ${subject} exam go? Enter your grade.`,
    submitButton: "Save my grade",
    savingButton: "Saving…",
    goalGap: (goal: string, obtained: string) => `You were aiming for ${goal}, you got ${obtained}.`,
    saveError: "Something went wrong saving the grade.",
    editButton: "Edit",
  },
  moyenne: {
    title: "My average",
    noGradesYet: "No graded exam yet.",
    source: "Based on the exams recorded in Reviix.",
    upcomingBadge: "Upcoming",
    goalLabel: "Average goal",
    goalSaveButton: "Confirm",
    goalSaving: "Saving…",
    goalSaveError: "Something went wrong saving the goal.",
    remainingExamsLabel: (count: number) => (count === 1 ? "your remaining exam" : `your ${nf.format(count)} remaining exams`),
    neededNormal: (avg: string, goal: string, needed: string, remaining: string) =>
      `Your average is ${avg}. To reach ${goal}, you need an average of ${needed} on ${remaining}.`,
    neededAlreadyAchieved: (avg: string, goal: string) =>
      `Your average is ${avg}. Your goal of ${goal} is already locked in!`,
    neededOutOfReach: (avg: string, goal: string, max: string) =>
      `Your average is ${avg}. Your goal of ${goal} is out of reach now — the best you can still reach is ${max}.`,
    prefillCta: (needed: string) => `To bring your average up, aim for ${needed} on your next exam.`,
    prefillButton: (needed: string) => `Add an exam with a goal of ${needed}`,
  },
};
