const nf = new Intl.NumberFormat("fr-FR");

export const examen = {
  noChapter: "Aucun chapitre",
  addExam: "+ Ajouter un examen",
  distributionNote:
    "Chaque examen est réparti dans le temps qui lui reste, en priorisant les fiches les plus urgentes et les chapitres pas encore révisés.",
  editRhythm: "Modifier mon temps de révision",
  yourExams: "Tes examens",
  generatePlanning: "Générer le planning",
  generatingPlanning: "Génération…",
  confirmDeleteExam: "Supprimer cet examen et son planning associé ?",
  noExamsYet: "Aucun examen ajouté pour l'instant.",
  coefficientBadge: (coefficient: number) => `Coeff. ${nf.format(coefficient)}`,
  goalBadge: (goal: string, obtained: string | null) =>
    obtained ? `Objectif ${goal} · obtenu ${obtained}` : `Objectif ${goal}`,
  importance: {
    normale: { label: "Normale", description: "Un contrôle comme un autre" },
    importante: { label: "Importante", description: "Compte plus dans la moyenne" },
    tresImportante: { label: "Très importante", description: "Examen décisif, type bac/partiels" },
  },
  calendar: {
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    months: [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ],
  },
  /** The "Objectif de note" wizard (components/examen/goal-wizard.tsx) —
   * replaces the old name+importance+chapters ExamForm. Every grade/average
   * shown here is already converted to the student's scale by the caller
   * (lib/i18n/grade-scale.ts) — this dict only supplies the surrounding
   * sentence, never raw /20 math. */
  wizard: {
    title: "Objectif de note",
    closeAria: "Fermer",
    estimateDisclaimer: "Toujours une estimation, jamais une promesse de note.",
    progressStep: (step: number, total: number) => `Étape ${step} sur ${total}`,
    back: "Retour",
    subjectStep: {
      title: "Quelle matière ?",
      subtitle: "Choisis la matière de cet examen.",
      subjectLabel: "Matière",
      noSubjects: "Crée d'abord une matière dans Fiches pour pouvoir ajouter un examen.",
      continueButton: "Continuer",
      missingFields: "Choisis une matière.",
    },
    chaptersStep: {
      title: "Quels chapitres ?",
      subtitle: "Sélectionne au moins un chapitre couvert par cet examen.",
      selectAllButton: "Tout le cours",
      noChaptersYet: "Crée d'abord des fiches dans cette matière pour avoir des chapitres.",
      continueButton: "Continuer",
      missingFields: "Choisis au moins un chapitre.",
    },
    dateStep: {
      title: "Quelle est la date de l'examen ?",
      dateLabel: "Date de l'examen",
      continueButton: "Continuer",
      missingFields: "Choisis une date.",
      pastDateError: "La date de l'examen doit être dans le futur.",
    },
    coefficientStep: {
      title: "Quel coefficient ?",
      subtitle: "Un examen plus lourd dans ta moyenne reçoit plus de révisions.",
      continueButton: "Continuer",
    },
    average: {
      title: (subject: string) => `Ta moyenne actuelle en ${subject}`,
      subtitleWithGrades: "Pré-remplie d'après tes examens déjà notés dans cette matière.",
      subtitleNoGrades:
        "Tu n'as pas encore de note enregistrée dans cette matière. Ajuste le curseur si tu as une idée de ton niveau.",
      noGradeLink: "Je n'ai pas encore de note",
      continueButton: "Continuer",
    },
    goal: {
      title: (subject: string) => `Ton objectif en ${subject}`,
      subtitle: "Fixe la note que tu veux viser. Rien n'est calculé avant que tu valides.",
      validateButton: "Valider mon objectif",
    },
    analyzing: {
      title: "Analyse en cours…",
      step1: "Écart entre ta moyenne actuelle et ton objectif",
      step2: "Prise en compte de la date de ton examen",
      step3: "Construction de ton rythme de révision",
    },
    result: {
      hours: (h: number) => `${nf.format(h)} h`,
      minutes: (m: number) => `${nf.format(m)} minute${m === 1 ? "" : "s"}`,
      inWeeks: (n: number) => (n <= 0 ? "cette semaine" : n === 1 ? "dans 1 semaine" : `dans ${nf.format(n)} semaines`),
      // Short intro line above the big number (see components/examen/
      // goal-wizard.tsx and components/onboarding/wizard.tsx's result
      // step) — the numbers themselves render separately: minutes/day
      // big, hours/week small underneath, so this sentence no longer
      // embeds either figure.
      normalHeadline: (goal: string) => `Pour atteindre ${goal} :`,
      perDayLabel: "par jour",
      perWeekLine: (hoursPerWeek: string) => `soit environ ${hoursPerWeek} par semaine`,
      // The positive line under the big number — always framed as an
      // estimate's everyday feel, never a promise about the grade itself.
      // Bucketed by minutes/day; only used for "normal" results (the
      // other kinds have their own dedicated messaging below).
      encouragement: (minutesPerDay: number): string => {
        if (minutesPerDay <= 20) return "C'est moins qu'un épisode de série, chaque jour.";
        if (minutesPerDay <= 40) return "À peu près la durée d'un épisode de série, chaque jour.";
        return "Un vrai rythme, mais qui reste accessible en t'organisant un peu.";
      },
      examDateInfo: (dateLabel: string, weeksLabel: string) =>
        `Examen le ${dateLabel}, ${weeksLabel}. Estimation basée sur ta moyenne et ton objectif.`,
      alreadyThere: (hoursPerWeek: string) =>
        `Tu es déjà au niveau. Pour le maintenir, environ ${hoursPerWeek} par semaine suffisent.`,
      veryAmbitious: (goal: string, hoursPerWeek: string, milestone: string) =>
        `${goal}, c'est très ambitieux — mais jouable si tu t'y mets sérieusement : environ ${hoursPerWeek} par semaine. Pour avancer par étapes, vise d'abord ${milestone}.`,
      aimForMilestoneButton: (milestone: string) => `Viser ${milestone} d'abord`,
      excessiveLoad: (goal: string, dailyLoad: string, suggestedGoal: string) =>
        `Pour atteindre ${goal}, il faudrait réviser environ ${dailyLoad} par jour avant l'examen — ce n'est pas tenable sur ce délai. Objectif plus réaliste : ${suggestedGoal}.`,
      aimForSuggestedButton: (suggestedGoal: string) => `Viser ${suggestedGoal} à la place`,
      // The "progressive" case (lib/examen/goal-calc.ts's PROGRESSIVE_PLAN_*
      // constants): the full rhythm a goal needs is demanding enough that
      // showing it as a flat daily target outright would discourage more
      // than motivate, so the result leads with a light starting point
      // instead and offers an easier first milestone — aimForMilestoneButton
      // above is reused for that milestone's button.
      progressiveIntro: (goal: string) => `Pour atteindre ${goal}, le rythme complet est soutenu.`,
      progressiveStart: (startMinutes: string) => `Commence à ${startMinutes} par jour, puis augmente peu à peu.`,
      progressiveFullLoad: (hoursPerWeek: string) =>
        `Le rythme complet représente environ ${hoursPerWeek} par semaine.`,
      progressiveMilestone: (milestone: string) => `Pour avancer en douceur, vise d'abord ${milestone}.`,
      generatePlanningButton: "Générer mon planning",
      changeGoalButton: "Changer mon objectif",
      generationError: "Erreur lors de la création de l'examen.",
      // Compares the hours/semaine a goal needs against the rhythm the
      // student already chose (onboarding's jours/minutes, or the saved
      // profile rhythm for an exam) — never rewrites that rhythm, only
      // reports how it measures up (lib/examen/goal-calc.ts's
      // compareRhythmToNeed).
      compareInsufficient: (needed: string, chosen: string, gap: string) =>
        `Il te faut environ ${needed} par semaine. Tu as prévu ${chosen} : il manque environ ${gap}.`,
      compareSufficient: (needed: string, chosen: string) =>
        `Il te faut environ ${needed} par semaine. Tu as prévu ${chosen} : parfait, ça suffit largement !`,
      compareExcessive: (needed: string, chosen: string) =>
        `Il te faut environ ${needed} par semaine. Tu as prévu ${chosen} : plus que nécessaire, libre à toi de garder ce rythme ou d'alléger un peu.`,
    },
    generating: {
      title: "Génération de ton planning…",
      doneTitle: "Ton planning est prêt",
      doneSubtitle: "Il tient compte de cet objectif et de tous tes autres examens.",
      openPlanningButton: "Ouvrir mon planning",
      addAnotherButton: "Ajouter un autre examen",
      error: "Erreur lors de la génération du planning.",
    },
  },
  /** Part B — the grade-entry banner shown once an exam's date has passed
   * with no grade (components/examen/grade-entry-banner.tsx). */
  gradeEntry: {
    question: (subject: string) => `Comment s'est passé ton examen de ${subject} ? Entre ta note.`,
    submitButton: "Enregistrer la note",
    savingButton: "Enregistrement…",
    goalGap: (goal: string, obtained: string) => `Tu visais ${goal}, tu as eu ${obtained}.`,
    saveError: "Erreur lors de l'enregistrement de la note.",
    editButton: "Modifier",
  },
  /** Part B — the "Ma moyenne" block (components/examen/moyenne-block.tsx):
   * weighted average, goal, and the grade still needed to catch up. */
  moyenne: {
    title: "Ma moyenne",
    noGradesYet: "Aucun examen noté pour l'instant.",
    source: "D'après les examens enregistrés dans Reviix.",
    upcomingBadge: "À venir",
    goalLabel: "Objectif de moyenne",
    goalSaveButton: "Valider",
    goalSaving: "Enregistrement…",
    goalSaveError: "Erreur lors de l'enregistrement de l'objectif.",
    remainingExamsLabel: (count: number) => (count === 1 ? "ton examen restant" : `tes ${nf.format(count)} examens restants`),
    neededNormal: (avg: string, goal: string, needed: string, remaining: string) =>
      `Ta moyenne est de ${avg}. Pour finir à ${goal}, il te faut en moyenne ${needed} sur ${remaining}.`,
    neededAlreadyAchieved: (avg: string, goal: string) =>
      `Ta moyenne est de ${avg}. Ton objectif de ${goal} est déjà acquis !`,
    neededOutOfReach: (avg: string, goal: string, max: string) =>
      `Ta moyenne est de ${avg}. Ton objectif de ${goal} est hors de portée — le mieux que tu puisses atteindre désormais est ${max}.`,
    prefillCta: (needed: string) => `Pour remonter ta moyenne, vise ${needed} au prochain examen.`,
    prefillButton: (needed: string) => `Ajouter un examen avec l'objectif ${needed}`,
  },
};

export type ExamenDict = typeof examen;
