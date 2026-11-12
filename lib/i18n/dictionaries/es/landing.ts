import type { LandingDict } from "../fr/landing";

export const landing: LandingDict = {
  header: {
    connexion: "Iniciar sesión",
    openMenu: "Abrir el menú",
    closeMenu: "Cerrar el menú",
    navComment: "Cómo funciona",
    navFonctionnalites: "Funciones",
    navFaq: "Preguntas",
    essayerGratuitement: "Probar gratis",
  },
  hero: {
    badge: "Para estudiantes",
    titlePrefix: "Tus",
    titleHighlight: "fichas",
    titleSuffix: "de estudio en menos de 2 min",
    subtitle: "Sube tu curso — PDF, fotos o Word — y recibe una ficha clara y organizada, lista para estudiar.",
    dropCourse: "Sube tu curso",
    essayerGratuitement: "Probar gratis",
    tagline: "Fichas • Planning antes del examen • Cuestionarios",
  },
  howItWorks: {
    title: "Cómo funciona",
    steps: [
      { titre: "Sube tu curso", description: "Una foto, un PDF o un archivo Word — sin necesidad de volver a escribirlo." },
      { titre: "Recibe tus fichas", description: "Una ficha clara y estructurada, lista en segundos." },
      { titre: "Estudia con tu planning", description: "Repartido automáticamente hasta la fecha de tu examen." },
    ],
  },
  featureTabs: {
    title: "Una app, cuatro herramientas",
    tabsAriaLabel: "Funciones",
    tabs: {
      fiches: {
        label: "Fichas",
        description:
          "Sube un curso (PDF, fotos o Word) y Reviix lo convierte en una ficha estructurada: un esquema, subpuntos y un apartado «Para recordar».",
      },
      examen: {
        label: "Exámenes",
        description: "Añade la fecha de tu examen y los temas que incluye: Reviix sabe exactamente cuánto tiempo te queda para repasarlo todo.",
      },
      planning: {
        label: "Planning",
        description: "Un planning diario generado automáticamente, que reparte lo que falta por repasar hasta la fecha del examen.",
      },
      quiz: {
        label: "Cuestionarios",
        description: "Ponte a prueba con preguntas generadas a partir de tus propias fichas, no de contenido genérico.",
      },
    },
  },
  benefits: {
    title: "Por qué Reviix",
    items: [
      {
        titre: "Fichas listas en segundos",
        description: "Sube tu curso y recibe una ficha estructurada sin volver a escribir nada.",
      },
      {
        titre: "Un planning que sigue tu examen",
        description: "Dale la fecha de tu examen y el planning reparte automáticamente lo que falta por repasar.",
      },
      {
        titre: "Cuestionarios a partir de tus propias fichas",
        description: "Ponte a prueba con lo que de verdad has estudiado, no con contenido genérico.",
      },
      {
        titre: "Nada se pierde por error",
        description: "Una ficha eliminada va a la papelera, nunca se borra con un solo toque.",
      },
      {
        titre: "Pensado para el móvil",
        description: "Sube un curso y repasa una ficha entre dos clases, tanto en el móvil como en la tablet.",
      },
      {
        titre: "Créditos fáciles de entender",
        description: "Un único contador al mes, mostrado en créditos, sin sorpresas al final.",
      },
    ],
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        q: "¿Cómo funciona?",
        a: "Subes tu curso y Reviix genera una ficha de estudio estructurada en segundos. Después puedes seguir un planning y entrenarte con cuestionarios creados a partir de esa ficha.",
      },
      {
        q: "¿Qué archivos puedo subir?",
        a: "Fotos de apuntes, PDF y archivos Word (.doc, .docx).",
      },
      {
        q: "¿Qué son los créditos?",
        a: "Cada generación de ficha o de cuestionario consume créditos. Cada plan da un número de créditos al mes, que no se acumulan de un mes a otro.",
      },
      {
        q: "¿Puedo cancelar cuando quiera?",
        a: "Sí, con un clic desde tu cuenta. El acceso sigue activo hasta el final del periodo ya pagado.",
      },
      {
        q: "¿Mis cursos son privados?",
        a: "Sí. Tus cursos y tus fichas están vinculados a tu cuenta y nadie más puede verlos.",
      },
    ],
  },
  finalCta: {
    title: "¿Listo para repasar más rápido?",
    button: "Probar gratis",
  },
  footer: {
    copyright: (year: number) => `© ${year} Reviix. Todos los derechos reservados.`,
  },
  demo: {
    ficheLabel: "Ficha de estudio",
    ficheTitre: "El corazón y la circulación sanguínea",
    sections: [
      {
        titre: "Anatomía del corazón",
        sousPoints: [
          "El corazón es un músculo hueco, el **miocardio**, dividido en 4 cavidades: 2 aurículas y 2 ventrículos.",
          "Las **válvulas cardíacas** impiden que la sangre retroceda entre dos latidos.",
        ],
      },
      {
        titre: "La circulación sanguínea",
        sousPoints: [
          "La **circulación mayor** envía la sangre oxigenada del corazón a todos los órganos.",
          "La **circulación menor** envía la sangre a los pulmones para oxigenarse.",
        ],
      },
    ],
    aRetenirLabel: "Para recordar",
    aRetenirPoint: "**Sístole** = contracción del corazón, **diástole** = relajación.",
    examenLabel: "Tus exámenes",
    examenSubject1: "Biología — Anatomía",
    examenIn1: "En 12 días",
    examenSubject2: "Historia",
    examenIn2: "En 25 días",
    planningLabel: "Hoy",
    planningTasks: ["El corazón y la circulación", "Revolución francesa — parte 2", "Vocabulario de inglés"],
    quizLabel: "Cuestionario — Anatomía",
    quizQuestion: "¿Qué función tiene la circulación menor?",
    quizOptionCorrect: "Oxigenar la sangre en los pulmones",
    quizOptionWrong: "Transportar la sangre hacia los músculos",
    floatingPlanningLabel: "Planning",
    floatingPlanningTask: "El corazón — hecho",
    floatingQuizLabel: "Cuestionario",
    floatingQuizQuestion: "¿Qué función tiene la circulación menor?",
  },
};
