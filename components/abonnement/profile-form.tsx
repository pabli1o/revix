"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCard } from "@/components/ui/choice-card";
import { useLocale } from "@/components/i18n/locale-provider";
import { GRADE_SCALES } from "@/lib/i18n/grade-scale";
import type { GradeScale } from "@/lib/supabase/database.types";

export function ProfileForm({
  initialPrenom,
  initialNom,
  initialEmail,
  initialEchelleNote,
}: {
  initialPrenom: string;
  initialNom: string;
  initialEmail: string;
  /** The manual grade-scale override (lib/i18n/grade-scale.ts) — null
   * means "follow the current language" rather than a fixed choice. */
  initialEchelleNote: GradeScale | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [prenom, setPrenom] = useState(initialPrenom);
  const [nom, setNom] = useState(initialNom);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [echelleNote, setEchelleNote] = useState<GradeScale | null>(initialEchelleNote);
  const [savingEchelle, setSavingEchelle] = useState(false);
  const [echelleError, setEchelleError] = useState<string | null>(null);

  const echelleLabels: Record<GradeScale, string> = {
    vingt: t.abonnement.gradeScaleVingt,
    dix: t.abonnement.gradeScaleDix,
    pourcentage: t.abonnement.gradeScalePourcentage,
  };

  async function handleChangeEchelle(next: GradeScale | null) {
    setEchelleNote(next);
    setSavingEchelle(true);
    setEchelleError(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ echelleNote: next }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setEchelleError(data?.error ?? t.abonnement.gradeScaleSaveError);
      setSavingEchelle(false);
      return;
    }
    setSavingEchelle(false);
    router.refresh();
  }

  const [email, setEmail] = useState(initialEmail);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? t.abonnement.profileSaveError);
        return;
      }
      setMessage(t.abonnement.profileUpdated);
      router.refresh();
    } catch {
      setError(t.abonnement.networkError);
    } finally {
      setSaving(false);
    }
  }

  /** Goes straight through Supabase Auth (not /api/me — email lives on
   * auth.users, not the profiles table). Whether this applies immediately
   * or requires clicking a confirmation link in the new (and possibly old)
   * inbox depends on the project's "Secure email change" setting in
   * Supabase, which isn't something this code controls — the message
   * below assumes confirmation is required, the safer default to assume. */
  async function handleSaveEmail() {
    const trimmed = email.trim();
    if (!trimmed || trimmed === initialEmail) return;

    setSavingEmail(true);
    setEmailMessage(null);
    setEmailError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ email: trimmed });
      if (updateError) {
        setEmailError(updateError.message);
        return;
      }
      setEmailMessage(t.abonnement.emailChangeConfirmMessage);
    } catch {
      setEmailError(t.abonnement.networkError);
    } finally {
      setSavingEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t.abonnement.prenomLabel}</label>
          <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t.abonnement.nomLabel}</label>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}
        <Button size="sm" className="self-start" onClick={handleSave} disabled={saving || !prenom.trim()}>
          {saving ? t.common.saving : t.common.save}
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t.abonnement.emailLabel}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {emailError && <p className="text-sm text-danger">{emailError}</p>}
        {emailMessage && <p className="text-sm text-success">{emailMessage}</p>}
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={handleSaveEmail}
          disabled={savingEmail || !email.trim() || email.trim() === initialEmail}
        >
          {savingEmail ? t.abonnement.emailChangeSending : t.abonnement.emailChangeButton}
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div>
          <p className="text-sm font-medium">{t.abonnement.gradeScaleTitle}</p>
          <p className="mt-0.5 text-xs text-text-muted">{t.abonnement.gradeScaleDescription}</p>
        </div>
        <div className="flex flex-col gap-2">
          <ChoiceCard
            compact
            title={t.abonnement.gradeScaleAuto}
            selected={echelleNote === null}
            disabled={savingEchelle}
            onClick={() => handleChangeEchelle(null)}
          />
          {GRADE_SCALES.map((scale) => (
            <ChoiceCard
              key={scale}
              compact
              title={echelleLabels[scale]}
              selected={echelleNote === scale}
              disabled={savingEchelle}
              onClick={() => handleChangeEchelle(scale)}
            />
          ))}
        </div>
        {echelleError && <p className="text-sm text-danger">{echelleError}</p>}
      </div>
    </div>
  );
}
