import type { NavDict } from "../fr/nav";

export const nav: NavDict = {
  tabs: {
    fiches: "Fichas",
    examen: "Exámenes",
    planning: "Planning",
    quiz: "Cuestionarios",
  },
  greeting: (prenom: string) => `Hola ${prenom}`,
  appHeader: {
    introWithName: (prenom: string) => `Hola ${prenom} — tus fichas, repartidas automáticamente hasta el examen.`,
    introDefault: "Tus fichas, repartidas automáticamente hasta el examen.",
    heroTitleLine1: "Tus fichas de estudio",
    heroTitleLine2: "en menos de 2 min.",
    heroSubtitle: "Pega tu curso, tu ficha está lista.",
  },
  settingsMenu: {
    ariaLabel: "Ajustes",
    accountAndSubscription: "Ajustes de cuenta y suscripción",
    rhythm: "Ritmo de estudio",
    corbeille: "Papelera",
  },
  signOut: {
    idle: "Cerrar sesión",
    loading: "Cerrando sesión…",
  },
  settingsModal: {
    title: "Tu ritmo de estudio",
    validate: "Confirmar",
  },
  settingsPanel: {
    daysLabel: "Días de estudio por semana",
    dayOption: (d: number) => `${d} día${d > 1 ? "s" : ""} por semana`,
    minutesLabel: "Tiempo de estudio por día de trabajo",
    minuteOption: (m: number) => `${m} min por día`,
    note: "Se aplica a todos tus exámenes.",
  },
  floatingBackButton: {
    ariaLabel: "Volver",
  },
};
