export const nav = {
  tabs: {
    fiches: "Fiches",
    examen: "Examen",
    planning: "Planning",
    quiz: "Quiz",
  },
  greeting: (prenom: string) => `Salut ${prenom}`,
  appHeader: {
    introWithName: (prenom: string) => `Salut ${prenom} — tes fiches, réparties automatiquement jusqu'à l'examen.`,
    introDefault: "Tes fiches, réparties automatiquement jusqu'à l'examen.",
    heroTitleLine1: "Tes fiches de révision",
    heroTitleLine2: "en moins de 2 min.",
    heroSubtitle: "Colle ton cours, ta fiche est prête.",
  },
  settingsMenu: {
    ariaLabel: "Paramètres",
    accountAndSubscription: "Paramètres du compte et abonnement",
    rhythm: "Rythme de révision",
    corbeille: "Corbeille",
  },
  signOut: {
    idle: "Se déconnecter",
    loading: "Déconnexion…",
  },
  settingsModal: {
    title: "Ton rythme de révision",
    validate: "Valider",
  },
  settingsPanel: {
    daysLabel: "Jours de révision par semaine",
    dayOption: (d: number) => `${d} jour${d > 1 ? "s" : ""} par semaine`,
    minutesLabel: "Temps de révision par jour de travail",
    minuteOption: (m: number) => `${m} min par jour`,
    note: "S'applique à l'ensemble de tes examens.",
  },
  floatingBackButton: {
    ariaLabel: "Retour",
  },
};

export type NavDict = typeof nav;
