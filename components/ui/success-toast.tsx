"use client";

import { useEffect, useState } from "react";

const DISPLAY_MS = 4000;
const FADE_MS = 300;

/**
 * Ephemeral bottom notification — shown, held for DISPLAY_MS, then fades
 * out over FADE_MS before calling onDismiss (which the caller uses to
 * unmount it). Self-contained: callers don't manage timers, just render
 * it and provide onDismiss.
 */
export function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), DISPLAY_MS);
    const dismissTimer = setTimeout(onDismiss, DISPLAY_MS + FADE_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(dismissTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 transition-all duration-300 md:left-64 ${
        leaving ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 rounded-full border border-success bg-[#123424] px-5 py-3 text-sm font-medium text-success shadow-lg">
        <span aria-hidden>✓</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
