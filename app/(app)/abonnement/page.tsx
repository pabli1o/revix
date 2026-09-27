import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { TIERS, usdToCredits } from "@/lib/subscription/constants";
import { Card } from "@/components/ui/card";
import { ManageSubscriptionButton } from "@/components/abonnement/subscribe-actions";
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
  const capReached = tier ? creditsUsed >= tier.credits : false;

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
                    {creditsUsed} / {tier.credits} crédits
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className={clsx("h-full rounded-full", capReached ? "bg-accent" : "bg-success")}
                    style={{ width: `${Math.min((creditsUsed / tier.credits) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {capReached && (
                <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                  Tu as atteint le plafond de {tier.credits} crédits ce mois-ci (fiches + quiz
                  confondus). Il se réinitialise à ton prochain renouvellement.
                </p>
              )}

              <ManageSubscriptionButton />
            </div>
          </Card>
        )}

        <PricingCards currentTier={subscription.tier} />
      </div>
    </div>
  );
}
