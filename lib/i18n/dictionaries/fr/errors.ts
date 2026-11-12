/** User-facing error/success strings returned by app/api/** route handlers
 * (JSON { error } bodies, occasionally a success message) — never raw
 * database/SDK error text (a Postgres/Supabase/Whop error's own .message
 * is passed through untouched; only the hardcoded prose written in a
 * route.ts file itself lives here). Grouped by shared/common strings
 * first, then by feature. Deliberately excludes app/api/whop/webhook —
 * that route only ever replies to Whop's server, never a browser. */
export const errors = {
  common: {
    unauthenticated: "Non authentifié",
    missingFields: "Champs manquants",
    missingOrInvalidFields: "Champs manquants ou invalides",
    missingName: "Nom manquant",
    unknownError: "Erreur inconnue",
  },
  subscription: {
    examenLocked: "Ton abonnement ne donne pas accès aux examens.",
    planningLocked: "Ton abonnement ne donne pas accès au planning.",
    quizLocked: "Ton abonnement ne donne pas accès aux quiz.",
    activeRequiredToSaveFiche: "Un abonnement actif est nécessaire pour enregistrer une fiche.",
    activeRequiredForCreditTopup: "Un abonnement actif est nécessaire pour acheter un supplément de crédit.",
    checkFailed: (message: string) => `Vérification de l'abonnement impossible : ${message}`,
  },
  fiches: {
    missingTitle: "Titre manquant",
    noFicheToSave: "Aucune fiche à enregistrer",
    invalidFiche: "Fiche invalide (titre ou contenu manquant)",
    missingSubject: "Matière manquante pour une fiche",
    missingChapter: "Chapitre manquant pour une fiche",
    saveFailed: "Erreur lors de l'enregistrement",
    draftNotFound: "Brouillon introuvable ou expiré",
    noSourceProvided: "Aucune source fournie",
    tooManySources: (max: number) => `Trop de sources (max ${max})`,
    emptyOrUnreadableSources: "Sources vides ou illisibles",
    sourceReadError: "Erreur de lecture d'une source",
    fileNotFound: "Fichier introuvable",
    fileDownloadFailed: "Impossible de récupérer le fichier envoyé",
  },
  subjects: {
    missingSubjectName: "Nom de matière manquant",
  },
  profile: {
    noFieldsToUpdate: "Aucun champ à mettre à jour",
    emptyFirstName: "Le prénom ne peut pas être vide",
  },
  onboarding: {
    dbNotInitialized:
      "La base de données n'est pas encore initialisée (migrations SQL manquantes). Contacte l'administrateur du site.",
    dbAccessDenied: (detail: string) =>
      `Accès refusé par la base de données (policy manquante ou incorrecte). Détail : ${detail}`,
  },
  quiz: {
    invalidDifficulty: "Difficulté invalide",
    chapterNotFound: "Chapitre introuvable",
    invalidParams: "Paramètres invalides",
    quizNotFound: "Quiz introuvable ou non prêt",
  },
  whop: {
    noSubscriptionToManage: "Aucun abonnement à gérer",
    invalidOffer: "Offre invalide",
    missingConfig: "Configuration Whop manquante",
    checkoutCreationFailed: "Impossible de créer la session de paiement",
  },
};

export type ErrorsDict = typeof errors;
