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
  moyenne: {
    actuelle: {
      title: "¿Cuál es tu media general?",
      subtitle: "Basta con una estimación, podrás ajustarla más adelante.",
      continuer: "Continuar",
    },
    objectif: {
      title: "¿Qué media quieres alcanzar?",
      subtitle: "Ponte un objetivo realista, podrás cambiarlo cuando quieras.",
      valider: "Confirmar mi objetivo",
    },
    analyzing: {
      title: "Analizando…",
      step1: "Diferencia entre tu media actual y tu objetivo",
      step2: "Teniendo en cuenta tu nivel de estudios",
      step3: "Construyendo tu ritmo de estudio",
    },
    result: {
      headline: (from: string, to: string) => `Para pasar de ${from} a ${to}:`,
      disclaimer: "Estimación general, la afinaremos con tus exámenes.",
      finish: "Terminar",
      finishing: "Un momento…",
    },
  },
  genericError: "Ha ocurrido un error.",
};
