"use client";

import Link from "next/link";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button-link";
import { SIZE_CLASSES } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";
import { LandingHeader } from "./landing-header";
import { Reveal } from "./reveal";
import { PhoneFrame } from "./phone-frame";
import { DemoGradeSliderScreen, FloatingCard } from "./demo-screens";
import { FeatureTabs } from "./feature-tabs";
import { FaqAccordion } from "./faq-accordion";
import { IconChevronDown } from "@/components/ui/icons";
import { useLocale } from "@/components/i18n/locale-provider";
import { resolveGradeScale, formatGradeNumber } from "@/lib/i18n/grade-scale";

/** The hero's own "6 to 14" example — fixed numbers, no counting
 * animation (that caused a layout jump on load: the "0" a counter starts
 * from is narrower than "6"/"14", reflowing the title as it counted up).
 * Still scale-aware per language (formatGradeNumber below). */
const HERO_FROM = 6;
const HERO_TO = 14;

export function LandingPage() {
  const { t, locale } = useLocale();
  const d = t.landing;
  const scale = resolveGradeScale(locale, null);

  return (
    <div>
      {/* 1. Premier écran — le slogan, la promesse "passe de 6 à 14 de moyenne",
         l'indicateur de défilement, et le haut du téléphone qui dépasse en
         bas pour inviter à défiler. Une colonne flex simple, sans aucun
         calcul en JS : sa hauteur minimale est l'écran visible moins le
         header (100svh tient compte des barres flottantes de Safari — le
         header est à l'intérieur de cette même colonne, donc sa propre
         hauteur se déduit naturellement du budget sans avoir à la
         connaître). Le texte/les boutons et l'indicateur gardent leur
         hauteur naturelle ; la zone du téléphone prend tout l'espace
         restant (flex-1) avec un plancher de 100px et masque son
         dépassement (overflow-hidden) — le téléphone, plus grand qu'elle,
         est donc toujours coupé par le bas. Si le contenu au-dessus est
         trop grand pour tenir dans 100svh, la colonne grandit simplement
         au-delà (min-height, pas height) : le premier écran déborde un peu
         plutôt que de superposer quoi que ce soit. */}
      <div className="flex min-h-[100svh] flex-col">
        <LandingHeader />

        {/* lg: (≥1024px, i.e. an actual desktop/laptop window, not just a
           wide phone) deliberately shrinks every gap and caps the type
           scale instead of letting it keep growing with sm:/md: — a
           laptop window is wide but often SHORT (668-730px of real
           content height once browser chrome is subtracted, at common
           1366x768/1280x720 windows), the opposite of a tall phone, so
           the same sizes that read well on a phone made this block alone
           taller than the whole window and pushed the scroll-cue (and
           the phone preview below it) off-screen. Widening the title's
           max-width at lg: also lets it wrap to 2 lines instead of 3. */}
        <section className="mx-auto max-w-3xl px-4 pt-10 pb-6 text-center sm:px-6 sm:pt-14 lg:pt-6 lg:pb-3">
          <Reveal>
            <span className="inline-block rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
              {d.hero.badge}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mx-auto mt-6 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:mt-3 lg:max-w-2xl lg:text-5xl">
              {d.hero.slogan}
            </h1>
          </Reveal>

          <Reveal delay={110}>
            <p className="mx-auto mt-3 max-w-xl text-xl font-bold text-accent sm:text-2xl lg:mt-2">
              {d.hero.titleBefore} {formatGradeNumber(HERO_FROM, scale, locale)} {d.hero.titleMiddle}{" "}
              <mark className="rounded-[2px] px-1 text-accent" style={{ backgroundColor: "var(--color-highlight)" }}>
                {formatGradeNumber(HERO_TO, scale, locale)}
              </mark>{" "}
              {d.hero.titleAfter}
            </p>
          </Reveal>

          <Reveal delay={140}>
            <p className="mx-auto mt-3 max-w-lg text-xs text-text-muted lg:mt-1">{d.hero.disclaimer}</p>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-4 max-w-lg text-base text-text-muted sm:text-lg lg:mt-2 lg:text-base">
              {d.hero.subtitle}
            </p>
          </Reveal>

          <Reveal delay={220}>
            <div className="mx-auto mt-6 flex max-w-md flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:mt-4">
              <ButtonLink href="/onboarding?nouveau=1" size="lg" className="w-full sm:w-auto">
                {d.hero.ctaPrimary}
              </ButtonLink>
              <ButtonLink href="/onboarding?nouveau=1" variant="secondary" size="lg" className="w-full sm:w-auto">
                {d.hero.essayerGratuitement}
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-3 text-sm text-text-muted sm:mt-5 lg:mt-2">{d.hero.tagline}</p>
          </Reveal>
        </section>

        {/* Indicateur discret "il y a du contenu en dessous" — dans le flux
           normal (pas en position absolue), donc jamais sur le contenu.
           Léger mouvement désactivé sous prefers-reduced-motion (voir
           .scroll-cue-motion dans globals.css), transform uniquement donc
           aucun saut de mise en page. */}
        <div aria-hidden className="flex shrink-0 justify-center py-4 lg:py-2">
          <div className="scroll-cue-motion flex flex-col items-center gap-1 text-accent">
            <span className="text-[10px] font-semibold uppercase tracking-wide">{d.hero.scrollCue}</span>
            <IconChevronDown className="size-5" />
          </div>
        </div>

        {/* 2. Zone du téléphone — prend l'espace restant de la colonne (au
           moins 100px), coupe tout ce qui dépasse. Le téléphone (plus haut
           que cette zone, sauf écran très haut) est donc naturellement
           tronqué par le bas, coupé par le bord réel de l'écran plutôt que
           par une marge calculée. Pas de Reveal ici (contrairement au reste
           de la page) : ce bloc doit être visible dès le premier affichage,
           mais seule une petite tranche dépasse dans le premier écran —
           trop peu pour franchir le seuil de 15% de Reveal, qui resterait
           donc invisible tant que la page n'a pas défilé. */}
        <div className="min-h-[100px] flex-1 overflow-hidden">
          <div className="relative mx-auto flex max-w-sm justify-center px-4 sm:max-w-md sm:px-10">
            <PhoneFrame size="lg">
              <DemoGradeSliderScreen />
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
        </div>
      </div>

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
                href="/onboarding?nouveau=1"
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
