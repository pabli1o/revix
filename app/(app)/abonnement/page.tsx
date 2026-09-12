import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { MONTHLY_AI_BUDGET_EUR, USD_PER_EUR } from "@/lib/subscription/constants";
import { Card } from "@/components/ui/card";
import {
  SubscribeButton,
  ManageSubscriptionButton,
  BuyCreditButton,
} from "@/components/abonnement/subscribe-actions";
import { ProfileForm } from "@/components/abonnement/profile-form";

const FEATURES = [
  "Lecture illimitée de toutes tes fiches (plus d'aperçu limité)",
  "Génération de fiches à partir de textes, photos, PDF et Word",
  "Planning de révision multi-examens généré automatiquement",
  "Quiz pré-générés instantanément pour chaque chapitre",
];

export default async function AbonnementPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();

  const [subscription, { data: profile }] = await Promise.all([
    getSubscriptionInfo(user!.id),
    supabase.from("profiles").select("prenom, nom").eq("id", user!.id).maybeSingle(),
  ]);

  // Anthropic's response.usage cost is tracked internally in USD (see
  // lib/anthropic/client.ts); converted back to EUR here purely for
  // display, using the same fixed rate the cap itself is defined with.
  const costEur = subscription.aiCostUsdPeriod / USD_PER_EUR;
  const extraCreditEur = subscription.extraCreditUsdPeriod / USD_PER_EUR;
  const budgetEur = MONTHLY_AI_BUDGET_EUR + extraCreditEur;
  const capReached = costEur >= budgetEur;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="mb-6 font-heading text-3xl font-semibold">Paramètres</h1>
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold">Profil</h2>
          <ProfileForm initialPrenom={profile?.prenom ?? ""} initialNom={profile?.nom ?? ""} />
        </Card>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold">Abonnement</h2>
        <Card>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-heading text-4xl font-semibold text-accent">9,99 €</span>
            <span className="text-text-muted">/ mois</span>
          </div>

          <ul className="mb-6 flex flex-col gap-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="text-success">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {subscription.isActive ? (
            <div className="flex flex-col gap-3">
              <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
                Abonnement actif ✅
              </p>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-text-muted">Utilisation IA ce mois-ci</span>
                  <span className={clsx("font-mono font-semibold", capReached && "text-accent")}>
                    {costEur.toFixed(2)} € / {budgetEur.toFixed(2)} €
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className={clsx("h-full rounded-full", capReached ? "bg-accent" : "bg-success")}
                    style={{ width: `${Math.min((costEur / budgetEur) * 100, 100)}%` }}
                  />
                </div>
                {extraCreditEur > 0 && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    Dont +{extraCreditEur.toFixed(2)} € débloqués ce mois-ci
                  </p>
                )}
              </div>

              {capReached && (
                <div className="flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                  <p>
                    Tu as atteint le plafond de {budgetEur.toFixed(2)} € d&apos;utilisation IA ce
                    mois-ci (fiches + quiz confondus). Il se réinitialise à ton prochain
                    renouvellement, ou débloque plus de budget dès maintenant :
                  </p>
                  <BuyCreditButton />
                </div>
              )}
              <ManageSubscriptionButton />
            </div>
          ) : (
            <SubscribeButton />
          )}
        </Card>
      </div>
    </div>
  );
}
