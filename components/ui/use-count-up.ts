"use client";

import { useEffect, useState } from "react";

/** Counts a number up from 0 to `target` over `durationMs`, re-triggering
 * whenever `target` changes — the "compteurs animés" shared by the
 * "Objectif de note" wizard's result step and the onboarding flow's own
 * general estimate result step. */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(from + (target - from) * progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}
