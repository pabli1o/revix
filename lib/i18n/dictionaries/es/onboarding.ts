import type { OnboardingDict } from "../fr/onboarding";

export const onboarding: OnboardingDict = {
  classe: {
    title: "¿En qué curso estás?",
    subtitle: "Para adaptar un poco la experiencia.",
    options: {
      college: { label: "Secundaria (ESO)", description: "De 1º a 4º de ESO" },
      lycee: { label: "Bachillerato", description: "1º y 2º de Bachillerato" },
      superieur: { label: "Educación superior", description: "Universidad, FP, oposiciones…" },
    },
  },
  niveau: {
    title: "¿Qué curso exactamente?",
    superieurPlaceholder: "Ej.: 2º de Economía, FP, oposiciones…",
    continuer: "Continuar",
    collegeNiveaux: ["1º ESO", "2º ESO", "3º ESO", "4º ESO"],
    lyceeNiveaux: ["1º Bachillerato", "2º Bachillerato"],
  },
  prenom: {
    title: "¿Cómo te llamamos?",
    subtitle: "Tu nombre o un apodo, como prefieras.",
    placeholder: "Ej.: Lucía, o un apodo…",
    continuer: "Continuar",
  },
  jours: {
    title: "¿Cuántos días a la semana puedes estudiar?",
    subtitle: "Esto sirve para construir tu planning más adelante — se puede cambiar cuando quieras.",
    optionLabel: (d: number) => `${d} día${d > 1 ? "s" : ""} a la semana`,
  },
  minutes: {
    title: "¿Cuánto tiempo por día de estudio?",
    subtitle: "Se puede cambiar cuando quieras en los ajustes.",
    optionLabel: (m: number) => `${m} min al día`,
    finish: "Terminar",
    finishing: "Un momento…",
  },
  genericError: "Ha ocurrido un error.",
};
