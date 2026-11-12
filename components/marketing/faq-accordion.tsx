"use client";

import { useState } from "react";
import clsx from "clsx";
import { useLocale } from "@/components/i18n/locale-provider";

export function FaqAccordion() {
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {t.landing.faq.items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="overflow-hidden rounded-2xl border border-border bg-bg-card">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-heading text-base font-semibold">{item.q}</span>
              <span
                aria-hidden
                className={clsx(
                  "shrink-0 text-xl leading-none text-accent transition-transform duration-200",
                  isOpen && "rotate-45",
                )}
              >
                +
              </span>
            </button>
            <div
              className={clsx(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <p className="overflow-hidden px-5 pb-4 text-sm text-text-muted">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
