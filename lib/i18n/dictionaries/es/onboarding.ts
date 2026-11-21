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
  blocages: {
    title: "¿Qué es lo que más te cuesta para mejorar tus notas?",
    subtitle: "Puedes elegir varias respuestas.",
    continuer: "Continuar",
    options: {
      pas_de_depart: "No sé por dónde empezar",
      procrastination: "Lo dejo todo para el último día",
      concentration: "No consigo concentrarme",
      comprehension: "No entiendo bien mis clases",
      methode: "No tengo un método para estudiar",
      stress: "Me estreso en los exámenes",
      temps: "No tengo suficiente tiempo",
    },
  },
  methodeRevision: {
    title: "¿Cómo estudias hoy en día?",
    options: {
      relit: "Releo mis apuntes",
      recopie: "Copio mis apuntes",
      fiches_maison: "Hago mis propias fichas",
      revise_peu: "Casi no estudio",
    },
  },
  prochainExamen: {
    title: "¿Para cuándo es tu próximo examen importante?",
    options: {
      cette_semaine: "Esta semana",
      ce_mois: "Este mes",
      dans_2_3_mois: "En 2 o 3 meses",
      pas_de_date: "Todavía no hay fecha",
    },
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
      finish: "Generar mis fichas",
      finishing: "Un momento…",
      commentReviixAide: {
        title: "Lo que nos has dicho, y cómo te ayuda Reviix",
        parBlocage: {
          pas_de_depart: "No sabes por dónde empezar: Reviix te dice qué repasar cada día.",
          procrastination: "Lo dejas todo para el último día: tu planning reparte tus repasos día a día.",
          concentration: "Te cuesta concentrarte: tus fichas son cortas y concretas, para repasar en sesiones breves.",
          comprehension: "Te cuesta entender tus clases: tus fichas simplifican cada tema y los cuestionarios te entrenan.",
          methode: "No tienes un método para estudiar: el planning te dice qué hacer, y cuándo.",
          stress: "Te estresas en los exámenes: los cuestionarios te permiten entrenarte antes del gran día.",
          temps: "Te falta tiempo: tus fichas están listas en 2 minutos.",
        },
      },
    },
  },
  genericError: "Ha ocurrido un error.",
};
