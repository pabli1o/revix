import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  // Pill shape (rounded-full, see SIZE_CLASSES) + a soft ambre glow instead
  // of a plain gray shadow. Disabled uses a distinct matte/dark-gold fill
  // rather than just fading the vivid ambre, so a not-yet-available action
  // (e.g. "Générer le quiz" before any fiche exists) visibly reads as such
  // rather than looking like a temporary loading state.
  primary:
    "bg-accent text-[#191A2E] shadow-[0_4px_24px_-4px_rgba(232,163,61,0.55)] hover:bg-accent-strong hover:shadow-[0_4px_28px_-2px_rgba(232,163,61,0.7)] active:bg-accent-strong active:scale-[0.96] disabled:bg-[#8a6b3a] disabled:text-black/40 disabled:shadow-none disabled:active:scale-100",
  secondary:
    "bg-bg-card border border-border text-text hover:border-accent active:border-accent active:bg-bg-elevated active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-bg-card active:bg-bg-elevated active:scale-[0.96]",
  danger:
    "bg-danger/90 text-white hover:bg-danger active:bg-danger active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100",
  /** Just a colored outline, no fill — used for secondary calls to action
   * that shouldn't compete visually with the main ambre "primary" button
   * (e.g. "+ Ajouter un examen"). */
  outline:
    "bg-transparent border-2 border-accent text-accent hover:bg-accent/10 active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-full gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-full gap-2",
  lg: "text-base px-6 py-3 rounded-full gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
