"use client";

import { useState } from "react";
import clsx from "clsx";
import { PhoneFrame } from "./phone-frame";
import { DemoFicheScreen, DemoExamenScreen, DemoPlanningScreen, DemoQuizScreen } from "./demo-screens";

const TABS = [
  {
    key: "fiches",
    label: "Fiches",
    description: "Dépose un cours (PDF, photos ou Word), Reviix le transforme en fiche structurée : un plan, des sous-points, et un encart « À retenir ».",
    screen: <DemoFicheScreen compact />,
  },
  {
    key: "examen",
    label: "Examen",
    description: "Ajoute la date de ton examen et les chapitres concernés : Reviix sait combien de temps il te reste pour tout réviser.",
    screen: <DemoExamenScreen />,
  },
  {
    key: "planning",
    label: "Planning",
    description: "Un planning quotidien généré automatiquement, qui répartit ce qu'il reste à réviser jusqu'à la date de l'examen.",
    screen: <DemoPlanningScreen />,
  },
  {
    key: "quiz",
    label: "Quiz",
    description: "Teste-toi avec des questions générées à partir de tes propres fiches, pas d'un contenu générique.",
    screen: <DemoQuizScreen />,
  },
] as const;

export function FeatureTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("fiches");
  const tab = TABS.find((t) => t.key === active)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Fonctionnalités"
        className="mx-auto flex max-w-md flex-wrap justify-center gap-1.5 rounded-full border border-border bg-bg-card p-1.5"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150",
              active === t.key ? "bg-accent text-white" : "text-text-muted hover:text-text",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
        <PhoneFrame key={tab.key}>{tab.screen}</PhoneFrame>
        <p className="max-w-sm text-center text-base text-text-muted md:text-left">{tab.description}</p>
      </div>
    </div>
  );
}
