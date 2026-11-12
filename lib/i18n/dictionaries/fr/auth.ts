export const auth = {
  fields: {
    email: "Adresse e-mail",
    emailPlaceholder: "prenom@exemple.fr",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirme le mot de passe",
    minPasswordPlaceholder: (min: number) => `${min} caractères minimum`,
  },
  login: {
    subtitleDefault: "Tes fiches de révision, ton planning et tes quiz, générés pour toi.",
    subtitleFromFiche: "Connecte-toi pour générer ta fiche.",
    forgotPassword: "Mot de passe oublié ?",
    submit: "Se connecter",
    submitting: "Connexion…",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    errorEmailNotConfirmed: "Ton adresse e-mail n'est pas encore confirmée. Vérifie ta boîte mail.",
    errorInvalidCredentials: "Email ou mot de passe incorrect.",
  },
  signup: {
    subtitleDefault: "Crée ton compte pour commencer.",
    subtitleFromFiche: "Crée ton compte pour générer ta fiche.",
    passwordTooShort: (min: number) => `Le mot de passe doit contenir au moins ${min} caractères.`,
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    emailAlreadyRegistered: "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.",
    submit: "Créer mon compte",
    submitting: "Création…",
    sentTitle: "Vérifie ta boîte mail !",
    sentBody: (email: string) =>
      `On a envoyé un lien de confirmation à ${email}. Clique dessus (dans ce même navigateur) pour activer ton compte.`,
    alreadyAccount: "Déjà un compte ?",
    login: "Se connecter",
  },
  forgotPassword: {
    subtitle: "Reçois un lien par e-mail pour choisir un nouveau mot de passe.",
    submit: "Envoyer le lien",
    submitting: "Envoi…",
    sentTitle: "Vérifie ta boîte mail !",
    sentBody: (email: string) =>
      `Si un compte existe pour ${email}, un lien de réinitialisation vient d'être envoyé. Clique dessus (dans ce même navigateur) pour choisir un nouveau mot de passe.`,
    backToLogin: "Retour à la connexion",
  },
  resetPassword: {
    checkingLink: "Vérification du lien…",
    invalidLinkTitle: "Ce lien n'est plus valide.",
    invalidLinkBody: "Il a peut-être déjà été utilisé ou a expiré. Demande un nouveau lien de réinitialisation.",
    requestNewLink: "Demander un nouveau lien",
    updatedTitle: "Mot de passe mis à jour !",
    redirecting: "Redirection…",
    choosePassword: "Choisis un nouveau mot de passe.",
    passwordTooShort: (min: number) => `Le mot de passe doit contenir au moins ${min} caractères.`,
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    submit: "Mettre à jour le mot de passe",
  },
};

export type AuthDict = typeof auth;
