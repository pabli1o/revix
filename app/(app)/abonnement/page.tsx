import { createClient } from "@/lib/supabase/server";
import { getSubscriptionInfo } from "@/lib/subscription/gate";
import { Card } from "@/components/ui/card";
import { SubscribeButton, ManageSubscriptionButton } from "@/components/abonnement/subscribe-actions";

const FEATURES = [
  "Lecture illimitée de toutes tes fiches (plus d'aperçu limité)",
  "Génération de fiches à partir de textes, photos, PDF et Word — toujours gratuite et illimitée",
  "Planning de révision multi-examens généré automatiquement",
  "Quiz pré-générés instantanément pour chaque chapitre",
];

export default async function AbonnementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = await getSubscriptionInfo(user!.id);
  const capReached = subscription.fichesGeneratedPeriod >= subscription.monthlyCap;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 font-heading text-3xl font-semibold">Abonnement</h1>

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
            {capReached && (
              <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
                Tu as atteint la limite de {subscription.monthlyCap} fiches enregistrées ce
                mois-ci. Elle se réinitialise à ton prochain renouvellement.
              </p>
            )}
            <ManageSubscriptionButton />
          </div>
        ) : (
          <SubscribeButton />
        )}
      </Card>
    </div>
  );
}
