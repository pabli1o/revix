import clsx from "clsx";
import type { Locale } from "@/lib/i18n/locale";

interface FlagProps {
  className?: string;
}

/**
 * Small, hand-drawn SVG national flags for the language switcher
 * (components/i18n/language-switcher.tsx) — no emoji, no library, no
 * image file, so they render identically everywhere. Each fills its own
 * 30x20 viewBox (a 3:2 flag ratio); the rounded corners and thin border
 * come from the wrapping <span> in FlagIcon below, not the SVGs
 * themselves — SVG roots clip to their viewBox by default, which is what
 * keeps the Union Jack's diagonals from spilling out.
 */
function FlagFR({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#0055A4" />
      <rect x="20" width="10" height="20" fill="#EF4135" />
    </svg>
  );
}

function FlagES({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </svg>
  );
}

/** A simplified Union Jack (for English) — centered saltire + cross
 * rather than the real flag's offset stripes, legible at icon size. */
function FlagGB({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#00247D" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#CF142B" strokeWidth="1.6" />
      <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="6.5" />
      <path d="M15 0V20M0 10H30" stroke="#CF142B" strokeWidth="3.6" />
    </svg>
  );
}

const FLAGS: Record<Locale, (props: FlagProps) => React.ReactElement> = {
  fr: FlagFR,
  en: FlagGB,
  es: FlagES,
};

/** The rounded, thin-bordered flag chip every call site actually renders. */
export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  const Flag = FLAGS[locale];
  return (
    <span
      className={clsx("inline-block aspect-[3/2] shrink-0 overflow-hidden rounded-[3px] border border-border", className)}
    >
      <Flag className="block h-full w-full" />
    </span>
  );
}
