"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Site colors only — navy accent, the fiche highlighter's yellow at full
 * opacity, and the danger token (a soft terracotta red, not a harsh
 * alert red) — see app/globals.css's --color-accent/--color-danger and
 * the --color-highlight this yellow matches the hue of. */
const COLORS = ["#1e3a5f", "#fde047", "#a8402a"];

const PIECE_COUNT = 28;
/** ~2s total burst, per the spec ("environ 2 secondes") — each piece's
 * own fall takes 1.6-2.2s with a small randomized head start so they
 * don't all move in lockstep. */
const MIN_DURATION_S = 1.6;
const MAX_DURATION_S = 2.2;
const MAX_DELAY_S = 0.3;

interface Piece {
  id: number;
  leftPercent: number;
  color: string;
  durationS: number;
  delayS: number;
  rotateDeg: number;
  width: number;
  height: number;
}

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    leftPercent: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    durationS: MIN_DURATION_S + Math.random() * (MAX_DURATION_S - MIN_DURATION_S),
    delayS: Math.random() * MAX_DELAY_S,
    rotateDeg: 180 + Math.random() * 540,
    width: 6 + Math.random() * 4,
    height: 10 + Math.random() * 6,
  }));
}

/**
 * A light, site-colored confetti burst (~2s) for a goal result screen —
 * the "Objectif de note" wizards (onboarding and the exam wizard) and
 * the landing page's live demo all mount this once when their result
 * appears. Pure decoration: `pointer-events-none` so it never intercepts
 * a tap on the buttons underneath, and it renders nothing at all under
 * prefers-reduced-motion rather than a toned-down version — the
 * reduced-motion contract is "no motion", not "less motion". CSS-only
 * animation (no JS per-frame work), so it costs nothing on a phone.
 *
 * The reduced-motion check itself is a direct DOM mutation in a layout
 * effect (same pattern as components/marketing/reveal.tsx), not React
 * state: a layout effect runs synchronously before the browser paints,
 * so a reduced-motion viewer never sees even a single frame of the
 * burst before it's hidden — a state-driven "hide after mount" would
 * both risk that one-frame flash and fight a hydration mismatch (the
 * server has no `window` to check the preference with).
 */
export function Confetti() {
  const [pieces] = useState(() => generatePieces(PIECE_COUNT));
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.display = "none";
    }
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.leftPercent}%`,
              width: `${p.width}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              animationDuration: `${p.durationS}s`,
              animationDelay: `${p.delayS}s`,
              "--confetti-rotate": `${p.rotateDeg}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
