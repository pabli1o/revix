"use client";

import { useLocale } from "@/components/i18n/locale-provider";

/**
 * The small "check your spam folder" box shown on the two remaining
 * screens that tell a student to go check their email — forgot password
 * (app/forgot-password/page.tsx) and an email-change confirmation
 * (components/abonnement/profile-form.tsx). Signup no longer sends a
 * confirmation email at all (disabled in the Supabase project), so it
 * doesn't use this anymore. A real, common failure mode (confirmation
 * emails landing in spam) worth calling out, but calmly: a plain neutral
 * box, not a red/danger one, and no alarmist wording.
 */
export function SpamNote({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div className={`rounded-lg border border-border bg-bg-elevated p-3 text-xs text-text-muted ${className ?? ""}`}>
      <span className="font-medium text-text">{t.auth.emailHelp.spamNote}</span>
    </div>
  );
}
