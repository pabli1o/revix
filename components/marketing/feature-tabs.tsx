"use client";

import { useState } from "react";
import clsx from "clsx";
import { PhoneFrame } from "./phone-frame";
import { DemoFicheScreen, DemoExamenScreen, DemoPlanningScreen, DemoQuizScreen } from "./demo-screens";
import { useLocale } from "@/components/i18n/locale-provider";

type TabKey = "fiches" | "examen" | "planning" | "quiz";
const TAB_KEYS: TabKey[] = ["fiches", "examen", "planning", "quiz"];

const TAB_SCREENS: Record<TabKey, React.ReactNode> = {
  fiches: <DemoFicheScreen compact />,
  examen: <DemoExamenScreen />,
  planning: <DemoPlanningScreen />,
  quiz: <DemoQuizScreen />,
};

export function FeatureTabs() {
  const { t } = useLocale();
  const [active, setActive] = useState<TabKey>("fiches");
  const tabs = t.landing.featureTabs.tabs;

  return (
    <div>
      <div
        role="tablist"
        aria-label={t.landing.featureTabs.tabsAriaLabel}
        className="mx-auto flex max-w-md flex-wrap justify-center gap-1.5 rounded-full border border-border bg-bg-card p-1.5"
      >
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150",
              active === key ? "bg-accent text-white" : "text-text-muted hover:text-text",
            )}
          >
            {tabs[key].label}
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
        <PhoneFrame key={active}>{TAB_SCREENS[active]}</PhoneFrame>
        <p className="max-w-sm text-center text-base text-text-muted md:text-left">{tabs[active].description}</p>
      </div>
    </div>
  );
}
