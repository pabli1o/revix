import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloatingBottomBar } from "@/components/layout/floating-bottom-bar";

/**
 * Shown instead of the fiche/quiz generation screen once an active
 * subscriber hits their monthly usage cap (see lib/subscription/gate.ts —
 * AiUsageCapExceededError, surfaced as aiUsageCapExceeded on the fiche
 * generation and quiz API responses). Deliberately vague: no euro amounts,
 * no mention of what the cap is actually measuring — see the exact wording
 * rules that apply here. No more in-period top-up (every plan is a fixed
 * monthly credit allowance now) — the only way to get more credit before
 * the next renewal is switching to a higher tier from /abonnement.
 */
export default function LimitePage() {
  return (
    <div className="pb-28">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
        <span className="text-5xl">🪫</span>
        <div>
          <h1 className="mb-2 font-heading text-2xl font-semibold">Crédits épuisés</h1>
          <p className="text-text-muted">Tu as utilisé tous tes crédits ce mois-ci.</p>
        </div>
        <Card className="w-full text-left text-sm text-text-muted">
          <p>
            Tes crédits se renouvellent automatiquement à ton prochain renouvellement
            d&apos;abonnement. Tu peux aussi passer à une offre avec plus de crédits dès
            maintenant.
          </p>
        </Card>
      </div>

      <FloatingBottomBar>
        <Link href="/abonnement" prefetch={true} className="block w-full">
          <Button className="w-full" size="lg">
            Voir les abonnements
          </Button>
        </Link>
      </FloatingBottomBar>
    </div>
  );
}
