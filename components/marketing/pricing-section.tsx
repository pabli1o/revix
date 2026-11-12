import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button-link";
import { IconCheck, IconMinus } from "@/components/ui/icons";
import { TIERS, TIER_ORDER } from "@/lib/subscription/constants";

/** Every price/credit/fiche figure here comes straight from
 * lib/subscription/constants.ts — nothing is hardcoded, so this section
 * can never drift from the real offers. Links to /signup rather than
 * starting checkout directly: that API route requires an authenticated
 * user (see app/api/whop/checkout/route.ts), so a visitor always creates
 * an account first. */
export function PricingSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid gap-6 sm:grid-cols-3">
        {TIER_ORDER.map((tierId) => {
          const tier = TIERS[tierId];
          const featured = tierId === "tier1";

          return (
            <div
              key={tierId}
              className={clsx(
                "relative flex flex-col gap-5 rounded-2xl border p-6 pt-8",
                featured
                  ? "border-accent bg-accent/5 shadow-[0_12px_36px_-12px_rgba(30,58,95,0.4)] sm:-translate-y-3"
                  : "border-border bg-bg-card",
              )}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold whitespace-nowrap uppercase tracking-wide text-white">
                  Le plus choisi
                </span>
              )}

              <div>
                <p className="font-heading text-lg font-semibold">{tier.label}</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-semibold text-accent">
                    {tier.priceEur.toFixed(2).replace(".", ",")} €
                  </span>
                  <span className="text-sm text-text-muted">/mois</span>
                </p>
                <p className="mt-1 text-sm text-text-muted">{tier.credits} crédits / mois</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  ≈ {tier.estimatedFiches.min}-{tier.estimatedFiches.max} fiches générées*
                </p>
              </div>

              <ul className="flex flex-col gap-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0 text-accent" />
                  <span>Génération de fiches</span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.features.quiz ? (
                    <IconCheck className="size-4 shrink-0 text-accent" />
                  ) : (
                    <IconMinus className="size-4 shrink-0 text-text-muted" />
                  )}
                  <span>{tier.features.quiz ? "Accès au quiz" : "Pas de quiz"}</span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.features.planning ? (
                    <IconCheck className="size-4 shrink-0 text-accent" />
                  ) : (
                    <IconMinus className="size-4 shrink-0 text-text-muted" />
                  )}
                  <span>{tier.features.planning ? "Accès au planning" : "Pas de planning"}</span>
                </li>
                <li className="flex items-center gap-2">
                  {tier.features.examen ? (
                    <IconCheck className="size-4 shrink-0 text-accent" />
                  ) : (
                    <IconMinus className="size-4 shrink-0 text-text-muted" />
                  )}
                  <span>{tier.features.examen ? "Accès aux examens" : "Pas d'examens"}</span>
                </li>
              </ul>

              <ButtonLink
                href="/signup"
                size="lg"
                variant={featured ? "primary" : "secondary"}
                className="mt-auto w-full"
              >
                Créer un compte
              </ButtonLink>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        * Estimation indicative, pas une garantie : le nombre réel de fiches dépend du type de contenu
        (photos, PDF courts ou longs) et de l&apos;usage du quiz.
      </p>
    </section>
  );
}
