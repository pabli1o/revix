import type { OnboardingDict } from "../fr/onboarding";

export const onboarding: OnboardingDict = {
  classe: {
    title: "What year are you in?",
    subtitle: "So we can tailor things a bit.",
    options: {
      college: { label: "Middle school", description: "Grades 6 to 9" },
      lycee: { label: "High school", description: "Grades 10, 11, 12" },
      superieur: { label: "Higher ed", description: "University, college, prep school…" },
    },
  },
  niveau: {
    title: "What grade?",
    superieurPlaceholder: "E.g.: 2nd-year Economics, community college, prep school…",
    continuer: "Continue",
    collegeNiveaux: ["Grade 6", "Grade 7", "Grade 8", "Grade 9"],
    lyceeNiveaux: ["Grade 10", "Grade 11", "Grade 12"],
  },
  prenom: {
    title: "What should we call you?",
    subtitle: "Your first name or a nickname, whatever you prefer.",
    placeholder: "E.g.: Lea, or a nickname…",
    continuer: "Continue",
  },
  blocages: {
    title: "What's making it hardest to get better grades?",
    subtitle: "Pick as many as apply.",
    continuer: "Continue",
    options: {
      pas_de_depart: "I don't know where to start",
      procrastination: "I leave everything to the last minute",
      concentration: "I can't concentrate",
      comprehension: "I don't really understand my classes",
      methode: "I don't have a method to revise",
      stress: "I get stressed during exams",
      temps: "I don't have enough time",
    },
  },
  methodeRevision: {
    title: "How do you revise today?",
    options: {
      relit: "I reread my notes",
      recopie: "I copy out my notes",
      fiches_maison: "I make my own study notes",
      revise_peu: "I barely revise",
    },
  },
  prochainExamen: {
    title: "When's your next important exam?",
    options: {
      cette_semaine: "This week",
      ce_mois: "This month",
      dans_2_3_mois: "In 2 or 3 months",
      pas_de_date: "No date yet",
    },
  },
  moyenne: {
    actuelle: {
      title: "What's your overall average?",
      subtitle: "A rough estimate is fine, you can refine it later.",
      continuer: "Continue",
    },
    objectif: {
      title: "What average do you want to reach?",
      subtitle: "Set a realistic goal — you can change it anytime.",
      valider: "Confirm my goal",
    },
    analyzing: {
      title: "Analyzing…",
      step1: "Gap between your current average and your goal",
      step2: "Factoring in your school level",
      step3: "Building your study rhythm",
    },
    result: {
      headline: (from: string, to: string) => `To go from ${from} to ${to}:`,
      disclaimer: "A general estimate — we'll refine it with your actual exams.",
      finish: "Generate my study notes",
      finishing: "One moment…",
      commentReviixAide: {
        title: "What you told us, and how Reviix helps",
        parBlocage: {
          pas_de_depart: "You don't know where to start: Reviix tells you what to revise each day.",
          procrastination: "You leave everything to the last minute: your schedule spreads your revisions out day by day.",
          concentration: "You struggle to concentrate: your study notes are short and focused, for revising in small sessions.",
          comprehension: "You find your classes hard to follow: your study notes simplify each chapter and the quizzes train you on them.",
          methode: "You don't have a method to revise: your schedule tells you what to do, and when.",
          stress: "You get stressed during exams: the quizzes let you practice before the big day.",
          temps: "You're short on time: your study notes are ready in 2 minutes.",
        },
      },
    },
  },
  genericError: "Something went wrong.",
};
