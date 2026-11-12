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
import { PricingSection } from "./pricing-section";
import { FaqAccordion } from "./faq-accordion";

const HOW_IT_WORKS = [
  {
    numero: 1,
    titre: "Dépose ton cours",
    description: "Une photo, un PDF ou un fichier Word — pas besoin de le retaper.",
  },
  {
    numero: 2,
    titre: "Reçois tes fiches",
    description: "Une fiche claire et structurée, prête en quelques secondes.",
  },
  {
    numero: 3,
    titre: "Révise avec ton planning",
    description: "Réparti automatiquement jusqu'à la date de ton examen.",
  },
];

const BENEFITS = [
  {
    titre: "Fiches prêtes en quelques secondes",
    description: "Dépose ton cours, récupère une fiche structurée sans tout retaper.",
  },
  {
    titre: "Un planning qui suit ton examen",
    description: "Donne la date de ton examen, le planning répartit automatiquement ce qu'il reste à réviser.",
  },
  {
    titre: "Quiz à partir de tes propres fiches",
    description: "Teste-toi sur ce que tu as vraiment étudié, pas sur un contenu générique.",
  },
  {
    titre: "Rien n'est perdu par erreur",
    description: "Une fiche supprimée part dans la corbeille, jamais effacée sur un simple clic.",
  },
  {
    titre: "Pensé pour le téléphone",
    description: "Dépose un cours et révise une fiche entre deux cours, sur mobile comme sur tablette.",
  },
  {
    titre: "Des crédits simples à comprendre",
    description: "Un seul compteur par mois, affiché en crédits, sans surprise à la fin.",
  },
];

export function LandingPage() {
  return (
    <div>
      <LandingHeader />

      {/* 1. Premier écran */}
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-8 text-center sm:px-6 sm:pt-20">
        <Reveal>
          <span className="inline-block rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
            Pour les étudiants
          </span>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Tes{" "}
            <mark className="rounded-[2px] px-1 text-accent" style={{ backgroundColor: "var(--color-highlight)" }}>
              fiches
            </mark>{" "}
            de révision en moins de 2 min
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="mx-auto mt-5 max-w-lg text-base text-text-muted sm:text-lg">
            Dépose ton cours — PDF, photos ou Word — et récupère une fiche claire et organisée, prête à réviser.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div className="mx-auto mt-8 flex max-w-xl flex-col items-stretch gap-3 rounded-3xl border border-border bg-bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-5">
            <div className="flex flex-1 items-center gap-2 py-2 text-text-muted">
              <IconDocument className="size-5 shrink-0" />
              <span className="text-sm sm:text-base">Dépose ton cours</span>
            </div>
            <ButtonLink href="/onboarding" size="lg" className="w-full sm:w-auto">
              Essayer gratuitement
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <p className="mt-5 text-sm text-text-muted">Fiches • Planning avant examen • Quiz</p>
        </Reveal>
      </section>

      {/* 2. Grand téléphone + cartes flottantes */}
      <Reveal delay={100}>
        <div className="relative mx-auto mt-10 flex max-w-sm justify-center px-10 pb-4 sm:mt-14 sm:max-w-md">
          <PhoneFrame size="lg">
            <DemoFicheScreen />
          </PhoneFrame>

          <FloatingCard label="Planning" className="top-10 -left-2 rotate-[-6deg] sm:-left-8">
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-accent">
                <IconCheck className="size-2.5 text-white" />
              </span>
              <span className="text-[11px] font-medium">Le cœur — fait</span>
            </div>
          </FloatingCard>

          <FloatingCard label="Quiz" className="-right-2 bottom-20 rotate-[5deg] sm:-right-8">
            <p className="text-[11px] font-medium leading-snug">Quel rôle a la petite circulation ?</p>
          </FloatingCard>
        </div>
      </Reveal>

      {/* 4. Comment ça marche */}
      <section id="comment-ca-marche" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-20 pb-4 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Comment ça marche</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <Reveal key={step.numero} delay={i * 100}>
              <div className="h-full rounded-2xl border border-border bg-bg-card p-6">
                <span className="font-heading text-4xl font-bold text-accent/25">{step.numero}</span>
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
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Une app, quatre outils</h2>
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
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Pourquoi Reviix</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <Reveal key={benefit.titre} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-border bg-bg-card p-6">
                <p className="font-heading text-base font-semibold">{benefit.titre}</p>
                <p className="mt-1.5 text-sm text-text-muted">{benefit.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7. Les offres */}
      <section id="offres" className="scroll-mt-20 pt-20 pb-4">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Les offres</h2>
        </Reveal>
        <div className="mt-10 pt-2">
          <Reveal delay={80}>
            <PricingSection />
          </Reveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 px-4 pt-20 pb-4 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Questions fréquentes</h2>
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
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à réviser plus vite ?
            </h2>
            <div className="mt-8 flex justify-center">
              <Link
                href="/onboarding"
                className={clsx(
                  "inline-flex items-center justify-center font-medium text-accent transition-all duration-150 bg-white hover:bg-white/90 active:scale-[0.96]",
                  SIZE_CLASSES.lg,
                )}
              >
                Essayer gratuitement
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
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} Reviix. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
