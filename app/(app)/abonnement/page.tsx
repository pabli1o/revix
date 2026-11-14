import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { EXTRA_CREDIT_CREDITS, EXTRA_CREDIT_PRICE_EUR, TIERS, usdToCredits } from "@/lib/subscription/constants";
import { Card } from "@/components/ui/card";
import { BuyCreditButton, ManageSubscriptionButton } from "@/components/abonnement/subscribe-actions";
import { PricingCards } from "@/components/abonnement/pricing-cards";
import { ProfileForm } from "@/components/abonnement/profile-form";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatEuros } from "@/lib/i18n/format";

export default async function AbonnementPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const t = await getDictionary();
  const locale = await getLocale();

  const [subscription, { data: profile }] = await Promise.all([
    getSubscriptionInfo(user!.id),
    supabase.from("profiles").select("prenom, nom, echelle_note").eq("id", user!.id).maybeSingle(),
  ]);

  const tier = subscription.tier ? TIERS[subscription.tier] : null;
  const tierLabel = subscription.tier ? (t.abonnement.tierLabels[subscription.tier] ?? tier?.label) : null;
  const creditsUsed = usdToCredits(subscription.aiCostUsdPeriod);
  const extraCredits = usdToCredits(subscription.extraCreditUsdPeriod);
  const totalCredits = tier ? tier.credits + extraCredits : 0;
  const capReached = tier ? creditsUsed >= totalCredits : false;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="mb-6 font-heading text-3xl font-semibold">{t.abonnement.pageTitle}</h1>
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold">{t.abonnement.profileTitle}</h2>
          <ProfileForm
            initialPrenom={profile?.prenom ?? ""}
            initialNom={profile?.nom ?? ""}
            initialEmail={user!.email ?? ""}
            initialEchelleNote={profile?.echelle_note ?? null}
          />
        </Card>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold">{t.abonnement.subscriptionTitle}</h2>

        {subscription.isActive && tier && (
          <Card className="mb-4">
            <div className="flex flex-col gap-3">
              <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
                {t.abonnement.activeSubscription(tierLabel ?? tier.label)}
              </p>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-text-muted">{t.abonnement.creditsUsedThisMonth}</span>
                  <span className={clsx("font-mono font-semibold", capReached && "text-accent")}>
                    {t.abonnement.creditsCount(creditsUsed, totalCredits)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className={clsx("h-full rounded-full", capReached ? "bg-accent" : "bg-success")}
                    style={{ width: `${Math.min((creditsUsed / totalCredits) * 100, 100)}%` }}
                  />
                </div>
                {extraCredits > 0 && (
                  <p className="mt-1.5 text-xs text-text-muted">{t.abonnement.extraCreditsNote(extraCredits)}</p>
                )}
              </div>

              {capReached && (
                <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                  {t.abonnement.capReached(totalCredits)}
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
                <p className="font-heading text-base font-semibold">{t.abonnement.needMoreCredits}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {t.abonnement.addCreditsDescription(
                    EXTRA_CREDIT_CREDITS,
                    formatEuros(EXTRA_CREDIT_PRICE_EUR, locale),
                  )}
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
