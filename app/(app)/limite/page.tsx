import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloatingBottomBar } from "@/components/layout/floating-bottom-bar";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Shown instead of the fiche/quiz generation screen once an active
 * subscriber hits their monthly usage cap (see lib/subscription/gate.ts —
 * AiUsageCapExceededError, surfaced as aiUsageCapExceeded on the fiche
 * generation and quiz API responses). Deliberately vague: no euro amounts,
 * no mention of what the cap is actually measuring — see the exact wording
 * rules that apply here. Before the next renewal, /abonnement offers both
 * the one-time credit top-up and switching to a higher tier.
 */
export default async function LimitePage() {
  const t = await getDictionary();

  return (
    <div className="pb-28">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
        <div>
          <h1 className="mb-2 font-heading text-2xl font-semibold">{t.root.limite.title}</h1>
          <p className="text-text-muted">{t.root.limite.subtitle}</p>
        </div>
        <Card className="w-full text-left text-sm text-text-muted">
          <p>{t.root.limite.description}</p>
        </Card>
      </div>

      <FloatingBottomBar>
        <Link href="/abonnement" prefetch={true} className="block w-full">
          <Button className="w-full" size="lg">
            {t.abonnement.viewPlans}
          </Button>
        </Link>
      </FloatingBottomBar>
    </div>
  );
}
