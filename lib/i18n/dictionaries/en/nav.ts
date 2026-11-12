import type { NavDict } from "../fr/nav";

export const nav: NavDict = {
  tabs: {
    fiches: "Notes",
    examen: "Exams",
    planning: "Planning",
    quiz: "Quiz",
  },
  greeting: (prenom: string) => `Hi ${prenom}`,
  appHeader: {
    introWithName: (prenom: string) => `Hi ${prenom} — your notes, spread out automatically until your exam.`,
    introDefault: "Your notes, spread out automatically until your exam.",
    heroTitleLine1: "Your study notes",
    heroTitleLine2: "in under 2 min.",
    heroSubtitle: "Paste your course, your note is ready.",
  },
  settingsMenu: {
    ariaLabel: "Settings",
    accountAndSubscription: "Account and subscription settings",
    rhythm: "Study rhythm",
    corbeille: "Trash",
  },
  signOut: {
    idle: "Sign out",
    loading: "Signing out…",
  },
  settingsModal: {
    title: "Your study rhythm",
    validate: "Confirm",
  },
  settingsPanel: {
    daysLabel: "Study days per week",
    dayOption: (d: number) => `${d} day${d > 1 ? "s" : ""} a week`,
    minutesLabel: "Study time per working day",
    minuteOption: (m: number) => `${m} min a day`,
    note: "Applies to all of your exams.",
  },
  floatingBackButton: {
    ariaLabel: "Back",
  },
};
