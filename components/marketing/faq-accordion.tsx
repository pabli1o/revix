"use client";

import { useState } from "react";
import clsx from "clsx";

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Comment ça marche ?",
    a: "Tu déposes ton cours, Reviix génère une fiche de révision structurée en quelques secondes. Tu peux ensuite suivre un planning et t'entraîner avec des quiz construits à partir de cette fiche.",
  },
  {
    q: "Quels fichiers puis-je déposer ?",
    a: "Des photos de cours, des PDF, et des fichiers Word (.doc, .docx).",
  },
  {
    q: "C'est quoi les crédits ?",
    a: "Chaque génération de fiche ou de quiz consomme des crédits. Chaque offre donne un nombre de crédits par mois, qui ne se cumulent pas d'un mois à l'autre.",
  },
  {
    q: "Je peux résilier à tout moment ?",
    a: "Oui, en un clic depuis ton compte. L'accès reste actif jusqu'à la fin de la période déjà payée.",
  },
  {
    q: "Mes cours sont-ils privés ?",
    a: "Oui. Tes cours et tes fiches sont liés à ton compte et ne sont visibles par personne d'autre.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {ITEMS.map((item, i) => {
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
