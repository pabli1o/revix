import type { AuthDict } from "../fr/auth";

export const auth: AuthDict = {
  fields: {
    email: "Email address",
    emailPlaceholder: "name@example.com",
    password: "Password",
    newPassword: "New password",
    confirmPassword: "Confirm your password",
    minPasswordPlaceholder: (min: number) => `At least ${min} characters`,
  },
  login: {
    subtitleDefault: "Your study notes, planning, and quizzes, generated for you.",
    subtitleFromFiche: "Log in to generate your note.",
    forgotPassword: "Forgot your password?",
    submit: "Log in",
    submitting: "Logging in…",
    noAccount: "Don't have an account yet?",
    createAccount: "Create an account",
    errorEmailNotConfirmed: "Your email address hasn't been confirmed yet. Check your inbox.",
    errorInvalidCredentials: "Incorrect email or password.",
  },
  signup: {
    subtitleDefault: "Create your account to get started.",
    subtitleFromFiche: "Create your account to generate your note.",
    passwordTooShort: (min: number) => `Your password must be at least ${min} characters long.`,
    passwordMismatch: "The passwords don't match.",
    emailAlreadyRegistered: "An account already exists with this email. Log in instead.",
    submit: "Create my account",
    submitting: "Creating…",
    sentTitle: "Check your inbox!",
    sentBody: (email: string) =>
      `We've sent a confirmation link to ${email}. Click it (in this same browser) to activate your account.`,
    alreadyAccount: "Already have an account?",
    login: "Log in",
  },
  forgotPassword: {
    subtitle: "Get an email link to choose a new password.",
    submit: "Send the link",
    submitting: "Sending…",
    sentTitle: "Check your inbox!",
    sentBody: (email: string) =>
      `If an account exists for ${email}, a reset link was just sent. Click it (in this same browser) to choose a new password.`,
    backToLogin: "Back to login",
  },
  resetPassword: {
    checkingLink: "Checking the link…",
    invalidLinkTitle: "This link is no longer valid.",
    invalidLinkBody: "It may have already been used or expired. Request a new reset link.",
    requestNewLink: "Request a new link",
    updatedTitle: "Password updated!",
    redirecting: "Redirecting…",
    choosePassword: "Choose a new password.",
    passwordTooShort: (min: number) => `Your password must be at least ${min} characters long.`,
    passwordMismatch: "The passwords don't match.",
    submit: "Update password",
  },
};
