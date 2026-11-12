import type { AbonnementDict } from "../fr/abonnement";

export const abonnement: AbonnementDict = {
  pageTitle: "Ajustes",
  profileTitle: "Perfil",
  subscriptionTitle: "Suscripción",
  activeSubscription: (tierLabel: string) => `Plan ${tierLabel} activo`,
  creditsUsedThisMonth: "Créditos usados este mes",
  creditsCount: (used: number, total: number) => `${used} / ${total} créditos`,
  extraCreditsNote: (count: number) => `Incluye ${count} créditos añadidos este mes.`,
  capReached: (total: number) =>
    `Has alcanzado el límite de ${total} créditos este mes (fichas y cuestionarios juntos). Se reinicia en tu próxima renovación, o puedes añadir créditos ahora mismo abajo.`,
  needMoreCredits: "¿Necesitas más créditos?",
  addCreditsDescription: (credits: number, price: string) =>
    `Añade ${credits} créditos al límite de este mes, con un pago único de ${price} — sea cual sea tu plan actual. No se renueva automáticamente.`,

  prenomLabel: "Nombre",
  nomLabel: "Apellido",
  emailLabel: "Correo electrónico",
  profileSaveError: "No se ha podido guardar.",
  profileUpdated: "Perfil actualizado.",
  networkError: "Error de red.",
  emailChangeButton: "Cambiar el correo",
  emailChangeSending: "Enviando…",
  emailChangeConfirmMessage: "Revisa tu correo (la dirección antigua y/o la nueva) para confirmar este cambio.",

  addCreditsButton: "Añadir créditos",
  redirecting: "Redirigiendo…",
  buyCreditError: "No se ha podido iniciar el pago.",
  cancelConfirm:
    "¿Cancelar tu suscripción? Mantendrás el acceso hasta el final del periodo en curso, y después no se renovará.",
  cancelButton: "Cancelar mi suscripción",
  cancelling: "Cancelando…",
  cancelError: "No se ha podido cancelar la suscripción.",

  tierLabels: {
    tier0: "Fichas",
    tier1: "Completo",
    tier2: "Completo+",
    tier3: "Completo+",
  },
  badgePopular: "Popular",
  badgeBestValue: "Mejor relación calidad-precio",
  perMonth: "/mes",
  creditsPerMonth: "créditos / mes",
  estimatedFiches: (min: number, max: number) => `≈ ${min}-${max} fichas generadas*`,
  featureFiches: "Generación de fichas",
  featureQuizOn: "Acceso a los cuestionarios",
  featureQuizOff: "Sin cuestionarios",
  featurePlanningOn: "Acceso al planning",
  featurePlanningOff: "Sin planning",
  featureExamenOn: "Acceso a los exámenes",
  featureExamenOff: "Sin exámenes",
  currentPlanButton: "Plan actual",
  subscribeButton: "Suscribirme",
  estimateDisclaimer:
    "* Estimación orientativa, no una garantía: el número real de fichas depende del tipo de contenido (fotos, PDF cortos o largos) y del uso de los cuestionarios.",
  checkoutError: "No se ha podido iniciar el pago.",

  modalTitle: "Elige tu plan",

  lockedTitle: "Función bloqueada",
  lockedCopy: {
    examen: "Se necesita una suscripción activa para crear y consultar exámenes.",
    quiz: "Se necesita una suscripción activa para acceder a los cuestionarios.",
    planning: "Se necesita una suscripción activa para acceder al planning.",
  },
  viewPlans: "Ver los planes",
  createAccount: "Crear una cuenta",
};
