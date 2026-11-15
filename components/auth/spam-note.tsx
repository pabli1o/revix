"use client";

import { useLocale } from "@/components/i18n/locale-provider";

/**
 * The small "check your spam folder" box shown on every screen that tells
 * a student to go check their email (signup confirmation, forgot
 * password, the "email not confirmed" login error, an email-change
 * confirmation) — a real, common failure mode (confirmation emails
 * landing in spam) worth calling out, but calmly: a plain neutral box,
 * not a red/danger one, and no alarmist wording.
 */
export function SpamNote({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div className={`rounded-lg border border-border bg-bg-elevated p-3 text-xs text-text-muted ${className ?? ""}`}>
      <span className="font-medium text-text">{t.auth.emailHelp.spamNote}</span>
    </div>
  );
}
