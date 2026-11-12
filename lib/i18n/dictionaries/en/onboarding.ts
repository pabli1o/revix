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
  jours: {
    title: "How many days a week can you study?",
    subtitle: "This helps build your plan later — you can change it anytime.",
    optionLabel: (d: number) => `${d} day${d > 1 ? "s" : ""} a week`,
  },
  minutes: {
    title: "How much time per study day?",
    subtitle: "You can change this anytime in settings.",
    optionLabel: (m: number) => `${m} min a day`,
    finish: "Finish",
    finishing: "One moment…",
  },
  genericError: "Something went wrong.",
};
