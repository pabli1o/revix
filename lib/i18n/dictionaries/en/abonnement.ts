import type { AbonnementDict } from "../fr/abonnement";

const nf = new Intl.NumberFormat("en-US");

export const abonnement: AbonnementDict = {
  pageTitle: "Settings",
  profileTitle: "Profile",
  subscriptionTitle: "Subscription",
  activeSubscription: (tierLabel: string) => `${tierLabel} plan active`,
  creditsUsedThisMonth: "Credits used this month",
  creditsCount: (used: number, total: number) => `${nf.format(used)} / ${nf.format(total)} credits`,
  extraCreditsNote: (count: number) => `Including ${nf.format(count)} credits added this month.`,
  capReached: (total: number) =>
    `You've reached your ${nf.format(total)}-credit cap for this month (notes and quizzes combined). It resets at your next renewal, or you can add more credits right now below.`,
  needMoreCredits: "Need more credits?",
  addCreditsDescription: (credits: number, price: string) =>
    `Add ${credits} credits to this month's cap, as a one-time payment of ${price} — whatever plan you're on. Doesn't renew automatically.`,

  prenomLabel: "First name",
  nomLabel: "Last name",
  emailLabel: "Email address",
  profileSaveError: "Couldn't save.",
  profileUpdated: "Profile updated.",
  networkError: "Network error.",
  emailChangeButton: "Change email",
  emailChangeSending: "Sending…",
  emailChangeConfirmMessage: "Check your inbox (the old and/or new address) to confirm this change.",

  gradeScaleTitle: "Grade scale",
  gradeScaleDescription: "Choose how your grades are displayed, independent of the interface language.",
  gradeScaleAuto: "Automatic (follows the language)",
  gradeScaleVingt: "Out of 20",
  gradeScaleDix: "Out of 10",
  gradeScalePourcentage: "As a percentage",
  gradeScaleSaveError: "Something went wrong saving the scale.",

  addCreditsButton: "Add credits",
  redirecting: "Redirecting…",
  buyCreditError: "Couldn't start the payment.",
  cancelConfirm:
    "Cancel your subscription? You'll keep access until the end of the current period, then it won't renew.",
  cancelButton: "Cancel my subscription",
  cancelling: "Cancelling…",
  cancelError: "Couldn't cancel the subscription.",

  tierLabels: {
    tier0: "Notes",
    tier1: "Complete",
    tier2: "Complete+",
    tier3: "Complete+",
  },
  badgePopular: "Popular",
  badgeBestValue: "Best value",
  perMonth: "/mo",
  creditsPerMonth: "credits / month",
  estimatedFiches: (min: number, max: number) => `≈ ${min}-${max} notes generated*`,
  featureFiches: "Note generation",
  featureQuizOn: "Quiz access",
  featureQuizOff: "No quiz",
  featurePlanningOn: "Planning access",
  featurePlanningOff: "No planning",
  featureExamenOn: "Exam access",
  featureExamenOff: "No exams",
  currentPlanButton: "Current plan",
  subscribeButton: "Subscribe",
  estimateDisclaimer:
    "* Rough estimate, not a guarantee: the actual number of notes depends on the type of content (photos, short or long PDFs) and quiz usage.",
  checkoutError: "Couldn't start the payment.",

  modalTitle: "Choose your plan",

  lockedTitle: "Feature locked",
  lockedCopy: {
    examen: "An active subscription is required to create and view exams.",
    quiz: "An active subscription is required to access quizzes.",
    planning: "An active subscription is required to access planning.",
  },
  viewPlans: "See plans",
  createAccount: "Create an account",
};
