// Credits/fiche counts shown to the user format with this locale's own
// digit grouping (Intl.NumberFormat), matching lib/i18n/locale.ts's
// INTL_TAG["fr"] — hardcoded here rather than threaded in as a parameter
// since each locale's dictionary file already knows its own tag.
const nf = new Intl.NumberFormat("fr-FR");

export const abonnement = {
  pageTitle: "Paramètres",
  profileTitle: "Profil",
  subscriptionTitle: "Abonnement",
  activeSubscription: (tierLabel: string) => `Abonnement ${tierLabel} actif`,
  creditsUsedThisMonth: "Crédits utilisés ce mois-ci",
  creditsCount: (used: number, total: number) => `${nf.format(used)} / ${nf.format(total)} crédits`,
  extraCreditsNote: (count: number) => `Dont ${nf.format(count)} crédits ajoutés ce mois-ci.`,
  capReached: (total: number) =>
    `Tu as atteint le plafond de ${nf.format(total)} crédits ce mois-ci (fiches + quiz confondus). Il se réinitialise à ton prochain renouvellement, ou tu peux ajouter des crédits dès maintenant ci-dessous.`,
  needMoreCredits: "Besoin de plus de crédits ?",
  addCreditsDescription: (credits: number, price: string) =>
    `Ajoute ${credits} crédits au plafond du mois en cours, en paiement unique de ${price} — quel que soit ton abonnement actuel. Ne se renouvelle pas automatiquement.`,

  // Profile form
  prenomLabel: "Prénom",
  nomLabel: "Nom",
  emailLabel: "Adresse e-mail",
  profileSaveError: "Impossible d'enregistrer.",
  profileUpdated: "Profil mis à jour.",
  networkError: "Erreur réseau.",
  emailChangeButton: "Modifier l'e-mail",
  emailChangeSending: "Envoi…",
  emailChangeConfirmMessage: "Vérifie ta boîte mail (l'ancienne et/ou la nouvelle adresse) pour confirmer ce changement.",

  // Manual grade-scale override (lib/i18n/grade-scale.ts) — independent
  // of the interface language.
  gradeScaleTitle: "Échelle des notes",
  gradeScaleDescription: "Choisis comment tes notes s'affichent, indépendamment de la langue de l'interface.",
  gradeScaleAuto: "Automatique (selon la langue)",
  gradeScaleVingt: "Sur 20",
  gradeScaleDix: "Sur 10",
  gradeScalePourcentage: "En pourcentage",
  gradeScaleSaveError: "Erreur lors de l'enregistrement de l'échelle.",

  // Subscribe actions
  addCreditsButton: "Ajouter des crédits",
  redirecting: "Redirection…",
  buyCreditError: "Impossible de démarrer le paiement.",
  cancelConfirm:
    "Résilier ton abonnement ? Tu garderas l'accès jusqu'à la fin de la période en cours, puis il ne sera pas renouvelé.",
  cancelButton: "Résilier mon abonnement",
  cancelling: "Résiliation…",
  cancelError: "Impossible de résilier l'abonnement.",

  // Pricing cards (tier.label itself comes from lib/subscription/constants.ts,
  // which is shared/untranslated config — this map supplies the localized
  // display name for each tier id instead of showing that raw config value).
  tierLabels: {
    tier0: "Fiches",
    tier1: "Complet",
    tier2: "Complet+",
    tier3: "Complet+",
  } as Record<string, string>,
  badgePopular: "Populaire",
  badgeBestValue: "Meilleure valeur",
  perMonth: "/mois",
  creditsPerMonth: "crédits / mois",
  estimatedFiches: (min: number, max: number) => `≈ ${min}-${max} fiches générées*`,
  featureFiches: "Génération de fiches",
  featureQuizOn: "Accès au quiz",
  featureQuizOff: "Pas de quiz",
  featurePlanningOn: "Accès au planning",
  featurePlanningOff: "Pas de planning",
  featureExamenOn: "Accès aux examens",
  featureExamenOff: "Pas d'examens",
  currentPlanButton: "Abonnement actuel",
  subscribeButton: "S'abonner",
  estimateDisclaimer:
    "* Estimation indicative, pas une garantie : le nombre réel de fiches dépend du type de contenu (photos, PDF courts ou longs) et de l'usage du quiz.",
  checkoutError: "Impossible de démarrer le paiement.",

  // Pricing modal
  modalTitle: "Choisis ton abonnement",

  // Feature-locked screens
  lockedTitle: "Fonctionnalité verrouillée",
  lockedCopy: {
    examen: "Un abonnement actif est nécessaire pour créer et consulter des examens.",
    quiz: "Un abonnement actif est nécessaire pour accéder aux quiz.",
    planning: "Un abonnement actif est nécessaire pour accéder au planning.",
  },
  viewPlans: "Voir les abonnements",
  createAccount: "Créer un compte",
};

export type AbonnementDict = typeof abonnement;
