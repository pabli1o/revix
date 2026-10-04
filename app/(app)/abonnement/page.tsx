import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { EXTRA_CREDIT_CREDITS, EXTRA_CREDIT_PRICE_EUR, TIERS, usdToCredits } from "@/lib/subscription/constants";
import { Card } from "@/components/ui/card";
import { BuyCreditButton, ManageSubscriptionButton } from "@/components/abonnement/subscribe-actions";
import { PricingCards } from "@/components/abonnement/pricing-cards";
import { ProfileForm } from "@/components/abonnement/profile-form";

export default async function AbonnementPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();

  const [subscription, { data: profile }] = await Promise.all([
    getSubscriptionInfo(user!.id),
    supabase.from("profiles").select("prenom, nom").eq("id", user!.id).maybeSingle(),
  ]);

  const tier = subscription.tier ? TIERS[subscription.tier] : null;
  const creditsUsed = usdToCredits(subscription.aiCostUsdPeriod);
  const extraCredits = usdToCredits(subscription.extraCreditUsdPeriod);
  const totalCredits = tier ? tier.credits + extraCredits : 0;
  const capReached = tier ? creditsUsed >= totalCredits : false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="mb-6 font-heading text-3xl font-semibold">Paramètres</h1>
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold">Profil</h2>
          <ProfileForm
            initialPrenom={profile?.prenom ?? ""}
            initialNom={profile?.nom ?? ""}
            initialEmail={user!.email ?? ""}
          />
        </Card>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold">Abonnement</h2>

        {subscription.isActive && tier && (
          <Card className="mb-4">
            <div className="flex flex-col gap-3">
              <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
                Abonnement {tier.label} actif ✅
              </p>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-text-muted">Crédits utilisés ce mois-ci</span>
                  <span className={clsx("font-mono font-semibold", capReached && "text-accent")}>
                    {creditsUsed} / {totalCredits} crédits
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className={clsx("h-full rounded-full", capReached ? "bg-accent" : "bg-success")}
                    style={{ width: `${Math.min((creditsUsed / totalCredits) * 100, 100)}%` }}
                  />
                </div>
                {extraCredits > 0 && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    Dont {extraCredits} crédits ajoutés ce mois-ci.
                  </p>
                )}
              </div>

              {capReached && (
                <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                  Tu as atteint le plafond de {totalCredits} crédits ce mois-ci (fiches + quiz
                  confondus). Il se réinitialise à ton prochain renouvellement, ou tu peux ajouter
                  des crédits dès maintenant ci-dessous.
                </p>
              )}

              <ManageSubscriptionButton />
            </div>
          </Card>
        )}

        {subscription.isActive && tier && (
          <Card className="mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-base font-semibold">Besoin de plus de crédits ?</p>
                <p className="mt-1 text-sm text-text-muted">
                  Ajoute {EXTRA_CREDIT_CREDITS} crédits au plafond du mois en cours, en paiement
                  unique de {EXTRA_CREDIT_PRICE_EUR.toFixed(2).replace(".", ",")} € — quel que soit
                  ton abonnement actuel. Ne se renouvelle pas automatiquement.
                </p>
              </div>
              <BuyCreditButton className="shrink-0" />
            </div>
          </Card>
        )}

        <PricingCards currentTier={subscription.tier} />
      </div>
    </div>
  );
}
