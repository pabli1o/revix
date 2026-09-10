import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-[#191A2E] hover:bg-accent-strong active:bg-accent-strong active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100",
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
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3 rounded-xl gap-2",
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
