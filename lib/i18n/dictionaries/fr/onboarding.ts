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
   * screens, right after signup (see components/onboarding/wizard.tsx) —
   * no rhythm question anymore (ASSUMED_DAYS_PER_WEEK), just a general
   * starting point and goal fed to lib/examen/goal-calc.ts's
   * computeGeneralStudyPlan. */
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
      // Short intro line above the big number — see fr/examen.ts's
      // wizard.result.normalHeadline, which this mirrors (the numbers
      // render separately: minutes/day big, hours/week small underneath).
      headline: (from: string, to: string) => `Pour passer de ${from} à ${to} :`,
      disclaimer: "Estimation générale, on l'affinera avec tes examens.",
      finish: "Terminer",
      finishing: "Un instant…",
    },
  },
  genericError: "Une erreur est survenue.",
};

export type OnboardingDict = typeof onboarding;
