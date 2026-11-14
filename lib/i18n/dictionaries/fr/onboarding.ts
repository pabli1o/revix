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
  /** The "quelle est ta moyenne générale / que veux-tu atteindre ?"
   * screens — between prenom and jours (see components/onboarding/wizard.tsx).
   * No subject or exam yet, just a general starting point and goal fed to
   * lib/examen/goal-calc.ts's computeGeneralStudyPlan. */
  moyenne: {
    actuelle: {
      title: "Quelle est ta moyenne générale ?",
      subtitle: "Une estimation suffit, tu pourras l'affiner plus tard.",
      continuer: "Continuer",
    },
    objectif: {
      title: "Quelle moyenne veux-tu atteindre ?",
      subtitle: "Fixe-toi un objectif réaliste, tu pourras le changer à tout moment.",
      valider: "Valider mon objectif",
    },
    analyzing: {
      title: "Analyse en cours…",
      step1: "Écart entre ta moyenne actuelle et ton objectif",
      step2: "Prise en compte de ton niveau d'études",
      step3: "Construction de ton rythme de révision",
    },
    result: {
      headline: (from: string, to: string, hoursPerWeek: string, minutesPerDay: string) =>
        `Pour passer de ${from} à ${to}, compte environ ${hoursPerWeek} par semaine, soit environ ${minutesPerDay} par jour.`,
      disclaimer: "Estimation générale, on l'affinera avec tes examens.",
      continuer: "Continuer",
    },
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
    continuer: "Continuer",
    finish: "Terminer",
    finishing: "Un instant…",
  },
  genericError: "Une erreur est survenue.",
};

export type OnboardingDict = typeof onboarding;
