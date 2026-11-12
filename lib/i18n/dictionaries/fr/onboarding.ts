export const onboarding = {
  classe: {
    title: "Tu es en quelle classe ?",
    subtitle: "Pour adapter un peu l'expérience.",
    options: {
      college: { label: "Collège", description: "De la 6e à la 3e" },
      lycee: { label: "Lycée", description: "Seconde, Première, Terminale" },
      superieur: { label: "Supérieur", description: "Licence, BTS, prépa…" },
    },
  },
  niveau: {
    title: "Quel niveau ?",
    superieurPlaceholder: "Ex : Licence 2 Économie, BTS, prépa…",
    continuer: "Continuer",
    collegeNiveaux: ["6e", "5e", "4e", "3e"],
    lyceeNiveaux: ["Seconde", "Première", "Terminale"],
  },
  prenom: {
    title: "Comment on t'appelle ?",
    subtitle: "Ton prénom ou un pseudo, comme tu préfères.",
    placeholder: "Ex : Léa, ou un pseudo…",
    continuer: "Continuer",
  },
  jours: {
    title: "Combien de jours par semaine peux-tu réviser ?",
    subtitle: "Ça sert à construire ton planning plus tard — modifiable à tout moment.",
    optionLabel: (d: number) => `${d} jour${d > 1 ? "s" : ""} par semaine`,
  },
  minutes: {
    title: "Combien de temps par jour de travail ?",
    subtitle: "Modifiable à tout moment dans les réglages.",
    optionLabel: (m: number) => `${m} min par jour`,
    finish: "Terminer",
    finishing: "Un instant…",
  },
  genericError: "Une erreur est survenue.",
};

export type OnboardingDict = typeof onboarding;
