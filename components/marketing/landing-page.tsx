"use client";

import Link from "next/link";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button-link";
import { SIZE_CLASSES } from "@/components/ui/button";
import { IconDocument, IconCheck } from "@/components/ui/icons";
import { LandingHeader } from "./landing-header";
import { Reveal } from "./reveal";
import { PhoneFrame } from "./phone-frame";
import { DemoFicheScreen, FloatingCard } from "./demo-screens";
import { FeatureTabs } from "./feature-tabs";
import { FaqAccordion } from "./faq-accordion";
import { useLocale } from "@/components/i18n/locale-provider";

export function LandingPage() {
  const { t } = useLocale();
  const d = t.landing;

  return (
    <div>
      <LandingHeader />

      {/* 1. Premier écran */}
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center sm:px-6 sm:pt-20">
        <Reveal>
          <span className="inline-block rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
            {d.hero.badge}
          </span>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {d.hero.titlePrefix}{" "}
            <mark className="rounded-[2px] px-1 text-accent" style={{ backgroundColor: "var(--color-highlight)" }}>
              {d.hero.titleHighlight}
            </mark>{" "}
            {d.hero.titleSuffix}
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="mx-auto mt-5 max-w-lg text-base text-text-muted sm:text-lg">{d.hero.subtitle}</p>
        </Reveal>

        <Reveal delay={200}>
          <div className="mx-auto mt-8 flex max-w-xl flex-col items-stretch gap-3 rounded-3xl border border-border bg-bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-5">
            <div className="flex flex-1 items-center gap-2 py-2 text-text-muted">
              <IconDocument className="size-5 shrink-0" />
              <span className="text-sm sm:text-base">{d.hero.dropCourse}</span>
            </div>
            <ButtonLink href="/onboarding" size="lg" className="w-full sm:w-auto">
              {d.hero.essayerGratuitement}
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <p className="mt-5 text-sm text-text-muted">{d.hero.tagline}</p>
        </Reveal>
      </section>

      {/* 2. Grand téléphone + cartes flottantes */}
      <Reveal delay={100}>
        <div className="relative mx-auto mt-10 flex max-w-sm justify-center px-10 pb-4 sm:mt-14 sm:max-w-md">
          <PhoneFrame size="lg">
            <DemoFicheScreen />
          </PhoneFrame>

          <FloatingCard label={d.demo.floatingPlanningLabel} className="top-10 -left-2 rotate-[-6deg] sm:-left-8">
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-accent">
                <IconCheck className="size-2.5 text-white" />
              </span>
              <span className="text-[11px] font-medium">{d.demo.floatingPlanningTask}</span>
            </div>
          </FloatingCard>

          <FloatingCard label={d.demo.floatingQuizLabel} className="-right-2 bottom-20 rotate-[5deg] sm:-right-8">
            <p className="text-[11px] font-medium leading-snug">{d.demo.floatingQuizQuestion}</p>
          </FloatingCard>
        </div>
      </Reveal>

      {/* 4. Comment ça marche */}
      <section id="comment-ca-marche" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-20 pb-4 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{d.howItWorks.title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {d.howItWorks.steps.map((step, i) => (
            <Reveal key={step.titre} delay={i * 100}>
              <div className="h-full rounded-2xl border border-border bg-bg-card p-6">
                <span className="font-heading text-4xl font-bold text-accent/25">{i + 1}</span>
                <p className="mt-3 font-heading text-lg font-semibold">{step.titre}</p>
                <p className="mt-1.5 text-sm text-text-muted">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Onglets de fonctions */}
      <section id="fonctionnalites" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-20 pb-4 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{d.featureTabs.title}</h2>
        </Reveal>
        <Reveal delay={60}>
          <div className="mt-10">
            <FeatureTabs />
          </div>
        </Reveal>
      </section>

      {/* 6. Pourquoi Reviix */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-4 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{d.benefits.title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.benefits.items.map((benefit, i) => (
            <Reveal key={benefit.titre} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-border bg-bg-card p-6">
                <p className="font-heading text-base font-semibold">{benefit.titre}</p>
                <p className="mt-1.5 text-sm text-text-muted">{benefit.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 px-4 pt-20 pb-4 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{d.faq.title}</h2>
        </Reveal>
        <div className="mt-10">
          <Reveal delay={80}>
            <FaqAccordion />
          </Reveal>
        </div>
      </section>

      {/* 9. Bloc final */}
      <section className="px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-accent px-6 py-14 text-center sm:px-14">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{d.finalCta.title}</h2>
            <div className="mt-8 flex justify-center">
              <Link
                href="/onboarding"
                className={clsx(
                  "inline-flex items-center justify-center font-medium text-accent transition-all duration-150 bg-white hover:bg-white/90 active:scale-[0.96]",
                  SIZE_CLASSES.lg,
                )}
              >
                {d.finalCta.button}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 10. Pied de page */}
      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-3 border-t border-border pt-8 text-center">
          <Link href="/" className="font-heading text-lg font-bold tracking-tight text-accent">
            Reviix
          </Link>
          <p className="text-xs text-text-muted">{d.footer.copyright(new Date().getFullYear())}</p>
        </div>
      </footer>
    </div>
  );
}
