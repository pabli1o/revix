export const root = {
  /** Document <title> (root layout default) and the landing page's own
   * title/OG/Twitter metadata — same phrase, reused by both. */
  siteTagline: "Reviix — Tes fiches de révision en moins de 2 min",
  siteDescription:
    "Dépose ton cours, récupère une fiche de révision claire en quelques secondes — planning avant l'examen et quiz inclus.",
  errorBoundary: {
    defaultMessage: "Une erreur inattendue s'est produite.",
    reference: "Référence",
  },
};

export type RootDict = typeof root;
