import type { AuthDict } from "../fr/auth";

export const auth: AuthDict = {
  fields: {
    email: "Correo electrónico",
    emailPlaceholder: "nombre@ejemplo.com",
    password: "Contraseña",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirma tu contraseña",
    minPasswordPlaceholder: (min: number) => `Mínimo ${min} caracteres`,
  },
  login: {
    subtitleDefault: "Tus fichas de estudio, tu planning y tus cuestionarios, generados para ti.",
    subtitleFromFiche: "Inicia sesión para generar tu ficha.",
    forgotPassword: "¿Has olvidado tu contraseña?",
    submit: "Iniciar sesión",
    submitting: "Iniciando sesión…",
    noAccount: "¿Aún no tienes cuenta?",
    createAccount: "Crear una cuenta",
    errorEmailNotConfirmed: "Tu correo todavía no está confirmado. Revisa tu bandeja de entrada.",
    errorInvalidCredentials: "Correo o contraseña incorrectos.",
  },
  signup: {
    subtitleDefault: "Crea tu cuenta para empezar.",
    subtitleFromFiche: "Crea tu cuenta para generar tu ficha.",
    passwordTooShort: (min: number) => `La contraseña debe tener al menos ${min} caracteres.`,
    passwordMismatch: "Las contraseñas no coinciden.",
    emailAlreadyRegistered: "Ya existe una cuenta con este correo. Inicia sesión en su lugar.",
    submit: "Crear mi cuenta",
    submitting: "Creando…",
    sentTitle: "¡Revisa tu bandeja de entrada!",
    sentBody: (email: string) =>
      `Hemos enviado un enlace de confirmación a ${email}. Haz clic en él (en este mismo navegador) para activar tu cuenta.`,
    alreadyAccount: "¿Ya tienes una cuenta?",
    login: "Iniciar sesión",
  },
  forgotPassword: {
    subtitle: "Recibe un enlace por correo para elegir una nueva contraseña.",
    submit: "Enviar el enlace",
    submitting: "Enviando…",
    sentTitle: "¡Revisa tu bandeja de entrada!",
    sentBody: (email: string) =>
      `Si existe una cuenta para ${email}, se acaba de enviar un enlace de restablecimiento. Haz clic en él (en este mismo navegador) para elegir una nueva contraseña.`,
    backToLogin: "Volver a iniciar sesión",
  },
  resetPassword: {
    checkingLink: "Comprobando el enlace…",
    invalidLinkTitle: "Este enlace ya no es válido.",
    invalidLinkBody: "Puede que ya se haya usado o que haya caducado. Solicita un nuevo enlace de restablecimiento.",
    requestNewLink: "Solicitar un nuevo enlace",
    updatedTitle: "¡Contraseña actualizada!",
    redirecting: "Redirigiendo…",
    choosePassword: "Elige una nueva contraseña.",
    passwordTooShort: (min: number) => `La contraseña debe tener al menos ${min} caracteres.`,
    passwordMismatch: "Las contraseñas no coinciden.",
    submit: "Actualizar contraseña",
  },
};
