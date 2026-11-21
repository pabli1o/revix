export const auth = {
  /** Shared by signup-form.tsx and login-form.tsx — the "Continuer avec
   * Google" button + "ou" separator above the e-mail form, and the brief
   * loading page the browser lands on after Google redirects back (see
   * app/auth/oauth-complete/page.tsx). Requires Google OAuth configured
   * in the Supabase dashboard (Authentication → Providers → Google) and
   * a matching OAuth client in Google Cloud Console — code-ready either
   * way, just inactive (the button still shows, Supabase just rejects
   * the attempt) until that's done. */
  oauth: {
    continueWithGoogle: "Continuer avec Google",
    orSeparator: "ou",
    completing: "Connexion en cours…",
    genericError: "La connexion avec Google a échoué. Réessaie, ou utilise ton e-mail ci-dessous.",
  },
  fields: {
    email: "Adresse e-mail",
    emailPlaceholder: "prenom@exemple.fr",
    confirmEmail: "Retape ton e-mail",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirme le mot de passe",
    minPasswordPlaceholder: (min: number) => `${min} caractères minimum`,
  },
  /** Shared across the two screens qui envoient encore un e-mail à
   * confirmer : mot de passe oublié (app/forgot-password/page.tsx) et le
   * changement d'adresse dans les réglages (components/abonnement/
   * profile-form.tsx). Plus utilisé par l'inscription ni par l'erreur de
   * connexion depuis que la confirmation par e-mail est désactivée côté
   * Supabase — voir le commentaire sur login.errorEmailNotConfirmed. */
  emailHelp: {
    spamNote: "Pense à vérifier tes indésirables (spam) : l'e-mail s'y cache souvent.",
    resend: "Renvoyer l'e-mail",
    resendIn: (seconds: number) => `Renvoyer dans ${seconds} s`,
    resending: "Envoi…",
    resent: "E-mail renvoyé.",
  },
  login: {
    subtitleDefault: "Tes fiches de révision, ton planning et tes quiz, générés pour toi.",
    subtitleFromFiche: "Connecte-toi pour générer ta fiche.",
    forgotPassword: "Mot de passe oublié ?",
    submit: "Se connecter",
    submitting: "Connexion…",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    // La confirmation par e-mail est désactivée côté Supabase : une
    // inscription normale ne peut plus laisser ce compte non confirmé.
    // Ce message ne vise donc qu'un compte ancien, créé avant ce
    // changement, dont l'e-mail n'a jamais été confirmé — Supabase
    // continue de bloquer sa connexion par mot de passe. Passer par "Mot
    // de passe oublié" établit une session malgré tout (le lien de
    // réinitialisation prouve lui aussi qu'on contrôle la boîte mail),
    // donc c'est une porte de sortie réelle, pas un simple message.
    errorEmailNotConfirmed:
      "Ce compte n'a jamais été confirmé. Utilise « Mot de passe oublié » ci-dessous : cela te donnera accès à ton compte et te permettra de choisir un nouveau mot de passe.",
    errorInvalidCredentials: "Email ou mot de passe incorrect.",
  },
  signup: {
    subtitleDefault: "Crée ton compte pour commencer.",
    subtitleFromFiche: "Crée ton compte pour générer ta fiche.",
    passwordTooShort: (min: number) => `Le mot de passe doit contenir au moins ${min} caractères.`,
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    emailMismatch: "Les deux adresses e-mail ne correspondent pas.",
    emailAlreadyRegistered: "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.",
    submit: "Créer mon compte",
    submitting: "Création…",
    // Ne devrait plus jamais arriver (la confirmation par e-mail est
    // désactivée côté Supabase, donc l'inscription renvoie toujours une
    // session immédiate) — gardé en secours si ce réglage change un jour,
    // pour ne jamais laisser l'écran bloqué sans explication.
    noImmediateSessionError:
      "Ton compte a bien été créé, mais la connexion automatique n'a pas fonctionné. Connecte-toi avec ton e-mail et ton mot de passe.",
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
