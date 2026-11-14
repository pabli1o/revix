import type { ErrorsDict } from "../fr/errors";

export const errors: ErrorsDict = {
  common: {
    unauthenticated: "No autenticado",
    missingFields: "Faltan campos",
    missingOrInvalidFields: "Campos faltantes o no válidos",
    missingName: "Falta el nombre",
    unknownError: "Error desconocido",
  },
  subscription: {
    examenLocked: "Tu plan no incluye acceso a los exámenes.",
    planningLocked: "Tu plan no incluye acceso al planning.",
    quizLocked: "Tu plan no incluye acceso a los cuestionarios.",
    activeRequiredToSaveFiche: "Necesitas una suscripción activa para guardar una ficha.",
    activeRequiredForCreditTopup: "Necesitas una suscripción activa para comprar créditos adicionales.",
    checkFailed: (message: string) => `No se pudo comprobar la suscripción: ${message}`,
  },
  fiches: {
    missingTitle: "Falta el título",
    noFicheToSave: "No hay ninguna ficha que guardar",
    invalidFiche: "Ficha no válida (falta el título o el contenido)",
    missingSubject: "Falta la asignatura de una ficha",
    missingChapter: "Falta el tema de una ficha",
    saveFailed: "Ha ocurrido un error al guardar",
    draftNotFound: "Borrador no encontrado o caducado",
    noSourceProvided: "No se ha proporcionado ninguna fuente",
    tooManySources: (max: number) => `Demasiadas fuentes (máximo ${max})`,
    emptyOrUnreadableSources: "Las fuentes están vacías o no se pueden leer",
    sourceReadError: "Error al leer una fuente",
    fileNotFound: "Archivo no encontrado",
    fileDownloadFailed: "No se pudo recuperar el archivo enviado",
  },
  subjects: {
    missingSubjectName: "Falta el nombre de la asignatura",
  },
  profile: {
    noFieldsToUpdate: "No hay ningún campo que actualizar",
    emptyFirstName: "El nombre no puede estar vacío",
  },
  onboarding: {
    dbNotInitialized:
      "La base de datos todavía no está inicializada (faltan migraciones SQL). Contacta con el administrador del sitio.",
    dbAccessDenied: (detail: string) =>
      `Acceso denegado por la base de datos (política faltante o incorrecta). Detalle: ${detail}`,
  },
  quiz: {
    invalidDifficulty: "Dificultad no válida",
    chapterNotFound: "Tema no encontrado",
    invalidParams: "Parámetros no válidos",
    quizNotFound: "Cuestionario no encontrado o no disponible",
    noFicheContent: "Este tema todavía no tiene ninguna ficha a partir de la cual generar un cuestionario.",
  },
  examen: {
    subjectNotFound: "Asignatura no encontrada",
    examNotFound: "Examen no encontrado",
    invalidGrade: "Nota no válida",
  },
  whop: {
    noSubscriptionToManage: "No hay ninguna suscripción que gestionar",
    invalidOffer: "Plan no válido",
    missingConfig: "Falta la configuración de Whop",
    checkoutCreationFailed: "No se pudo crear la sesión de pago",
  },
  generation: {
    truncatedResponse: "Respuesta truncada: contenido demasiado denso para una sola generación.",
    emptyResponse: "Respuesta vacía recibida",
    invalidResponseFormat: "Formato de respuesta no válido",
    incompleteResponse: "Respuesta incompleta recibida",
    failedAfterAttempts: (attempts: number, lastError: string) =>
      `Fallo en la generación tras ${attempts} intentos: ${lastError}`,
  },
};
