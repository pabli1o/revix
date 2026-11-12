import type { CommonDict } from "../fr/common";

export const common: CommonDict = {
  close: "Cerrar",
  cancel: "Cancelar",
  save: "Guardar",
  saving: "Guardando…",
  back: "Volver",
  delete: "Eliminar",
  deleting: "Eliminando…",
  confirm: "Confirmar",
  loading: "Cargando…",
  genericError: "Ha ocurrido un error. Inténtalo de nuevo en un momento.",
  retry: "Reintentar",
  network: {
    connectionFailed: "No se ha podido contactar con el servidor. Comprueba tu conexión a internet.",
    serverTimeout:
      "El servidor ha tardado demasiado en responder (tiempo agotado). Inténtalo de nuevo, quizá con menos contenido a la vez.",
    payloadTooLarge:
      "El contenido enviado es demasiado grande para el servidor. Quita una o varias fuentes (sobre todo fotos), o repártelas en varias fichas.",
    invalidResponse: (status: number) => `Respuesta no válida del servidor (código ${status}).`,
  },
};
