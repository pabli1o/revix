"use client";

import { useEffect, useRef, useState } from "react";

/** Comfortably inside the "30 à 60 secondes" window asked for — long
 * enough that it's basically never shorter than Supabase's own resend
 * rate limit (so clicking "Renvoyer" when the button is enabled essentially
 * never gets rejected server-side), short enough not to feel stuck. */
const COOLDOWN_SECONDS = 45;

/**
 * Shared by every remaining "renvoyer l'e-mail" button — mot de passe
 * oublié (app/forgot-password/page.tsx) — now that email confirmation is
 * disabled in Supabase and signup/login no longer need a resend path
 * (see components/auth/signup-form.tsx, login-form.tsx). Each caller does
 * its own resend call (they hit different Supabase Auth methods); this
 * only owns the shared countdown so a student can't spam the button.
 */
export function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  return { secondsLeft, canResend: secondsLeft === 0, start };
}
