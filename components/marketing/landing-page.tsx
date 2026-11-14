"use client";

import { useLayoutEffect, useRef } from "react";
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

/** How far up the hero phone (see the ref-based effect below) ideally
 * pulls up to peek into the first screen, before clamping to what's
 * actually safe. */
const PHONE_PEEK_TARGET_PX = 170;
/** Minimum gap always kept between the real text content (CTA buttons, or
 * the tagline below them where it renders) and anything placed below it —
 * the phone's pull-up and the scroll cue are each clamped independently
 * against this, so neither ever sits on top of actual text. The phone and
 * the cue are free to overlap *each other* when space is tight: the cue
 * then lands on the phone's own plain bezel/dynamic-island area, which
 * reads fine (no text collision), unlike overlapping the CTA/tagline would. */
const CONTENT_SAFETY_PX = 12;

export function LandingPage() {
  const { t, locale } = useLocale();
  const d = t.landing;
  const scale = resolveGradeScale(locale, null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const phoneWrapRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  // The phone needs to peek into the bottom of the first screen, and the
  // scroll cue needs to sit below the real text — without either ever
  // covering the CTA buttons or the tagline below them. The safe amount
  // depends on how tall the hero text renders (varies by viewport width
  // *and* by how much each language's text wraps), which no fixed CSS
  // margin can track reliably at every width, so both are positioned from
  // a direct measurement instead. Runs before paint (useLayoutEffect) so
  // there's no visible flash of the unclamped position, and re-measures on
  // resize/orientation change.
  useLayoutEffect(() => {
    const phoneEl = phoneWrapRef.current;
    const ctaEl = ctaRef.current;
    const cueEl = cueRef.current;
    if (!phoneEl || !ctaEl || !cueEl) return;

    function applyLayout() {
      if (!phoneEl || !ctaEl || !cueEl) return;
      phoneEl.style.marginTop = "0px";
      const naturalTop = phoneEl.getBoundingClientRect().top;
      const ctaBottom = ctaEl.getBoundingClientRect().bottom;
      // getBoundingClientRect() on a `display: none` element (tagline
      // hidden below 375px) returns an all-zero rect, so this correctly
      // falls back to ctaBottom when the tagline isn't rendered.
      const taglineBottom = taglineRef.current?.getBoundingClientRect().bottom ?? 0;
      const contentBottom = Math.max(ctaBottom, taglineBottom);

      const safeMax = Math.max(0, naturalTop - contentBottom - CONTENT_SAFETY_PX);
      const pullUp = Math.min(PHONE_PEEK_TARGET_PX, safeMax);
      phoneEl.style.marginTop = `-${pullUp}px`;

      cueEl.style.top = `${contentBottom + CONTENT_SAFETY_PX}px`;
    }

    applyLayout();
    window.addEventListener("resize", applyLayout);
    return () => window.removeEventListener("resize", applyLayout);
  }, [locale]);

  return (
    <div>
      {/* 1. Premier écran — le slogan, la promesse "passe de 6 à 14 de moyenne",
         et le haut du téléphone qui dépasse en bas pour inviter à défiler.
         Le header est à l'intérieur de ce wrapper (plutôt qu'avant) pour que
         ce dernier démarre à y=0 : l'indicateur de défilement, positionné en
         `top: calc(100vh - ...)`, tombe alors exactement en bas de l'écran
         réel au premier affichage, quelle que soit la hauteur du header. */}
      <div className="relative">
        <LandingHeader />

        <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-3 text-center sm:px-6 sm:py-10">
          <Reveal>
            <span className="inline-block rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
              {d.hero.badge}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mx-auto mt-3 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight max-[374px]:text-[1.75rem] max-[374px]:leading-[1.15] sm:mt-6 sm:text-5xl md:text-6xl">
              {d.hero.slogan}
            </h1>
          </Reveal>

          <Reveal delay={110}>
            <p className="mx-auto mt-1.5 max-w-xl text-xl font-bold text-accent sm:mt-3 sm:text-2xl">
              {d.hero.titleBefore} {formatGradeNumber(HERO_FROM, scale, locale)} {d.hero.titleMiddle}{" "}
              <mark className="rounded-[2px] px-1 text-accent" style={{ backgroundColor: "var(--color-highlight)" }}>
                {formatGradeNumber(HERO_TO, scale, locale)}
              </mark>{" "}
              {d.hero.titleAfter}
            </p>
          </Reveal>

          <Reveal delay={140}>
            <p className="mx-auto mt-1 max-w-lg text-xs text-text-muted sm:mt-3">{d.hero.disclaimer}</p>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted sm:mt-4 sm:text-lg">{d.hero.subtitle}</p>
          </Reveal>

          <Reveal delay={220}>
            <div
              ref={ctaRef}
              className="mx-auto mt-3 flex max-w-md flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:justify-center"
            >
              <ButtonLink href="/onboarding" size="lg" className="w-full sm:w-auto">
                {d.hero.ctaPrimary}
              </ButtonLink>
              <ButtonLink href="/onboarding" variant="secondary" size="lg" className="w-full sm:w-auto">
                {d.hero.essayerGratuitement}
              </ButtonLink>
            </div>
          </Reveal>

          {/* Masqué sous 375px : ce n'est pas un élément protégé (titre,
             sous-titre, boutons) et le céder en premier, sur les tout petits
             écrans, est ce qui laisse assez de place pour que le téléphone
             dépasse sans jamais recouvrir les boutons. */}
          <Reveal delay={260}>
            <p ref={taglineRef} className="mt-3 hidden text-sm text-text-muted min-[375px]:block sm:mt-5">
              {d.hero.tagline}
            </p>
          </Reveal>
        </section>

        {/* 2. Grand téléphone (aperçu du curseur d'objectif de l'onboarding) + cartes
           flottantes — remonté par une marge négative (calculée en JS, voir
           l'effet ci-dessus) pour dépasser en bas du premier écran plutôt
           que d'apparaître entièrement sous la ligne de flottaison, sans
           jamais recouvrir les boutons. Pas de Reveal ici (contrairement au
           reste de la page) : ce bloc doit être visible dès le premier
           affichage, mais seule une petite tranche dépasse dans le premier
           écran — trop peu pour franchir le seuil de 15% de Reveal, qui
           resterait donc invisible tant que la page n'a pas défilé. */}
        <div ref={phoneWrapRef} className="relative z-10 mx-auto flex max-w-sm justify-center px-4 sm:max-w-md sm:px-10">
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

        {/* Indicateur discret "il y a du contenu en dessous" — positionné en
           JS juste au-dessus du téléphone (voir l'effet plus haut), jamais
           sur le contenu protégé. Léger mouvement désactivé sous
           prefers-reduced-motion (voir .scroll-cue-motion dans globals.css),
           transform uniquement donc aucun saut de mise en page. */}
        <div ref={cueRef} aria-hidden className="pointer-events-none absolute inset-x-0 z-20 flex justify-center">
          <div className="scroll-cue-motion flex flex-col items-center gap-1 text-accent">
            <span className="text-[10px] font-semibold uppercase tracking-wide">{d.hero.scrollCue}</span>
            <IconChevronDown className="size-5" />
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
