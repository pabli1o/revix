"use client";

import { useState } from "react";
import clsx from "clsx";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

/**
 * A click-only date picker (no keyboard date entry) used for exam dates,
 * per the spec.
 */
export function CalendarPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (isoDate: string) => void;
}) {
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const today = toIso(new Date());
  const cells = buildMonthGrid(viewYear, viewMonth);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-md px-2 py-1 text-sm hover:bg-bg-card"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <span className="font-mono text-sm font-medium">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-md px-2 py-1 text-sm hover:bg-bg-card"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="py-1 font-mono text-[10px] uppercase text-text-muted">
            {w}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const iso = toIso(date);
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(iso)}
              className={clsx(
                "rounded-md py-1.5 text-sm transition-colors",
                selected
                  ? "bg-accent font-semibold text-[#191A2E]"
                  : isToday
                    ? "border border-accent/60 text-text"
                    : "text-text hover:bg-bg-card",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
