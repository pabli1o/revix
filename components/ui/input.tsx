import { forwardRef } from "react";
import clsx from "clsx";

// Blue-violet field background — distinct from the surrounding card so
// text fields read as clearly interactive, per the design spec.
const FIELD_BG = "bg-[#2A2B52]";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-xl border border-border px-4 py-3 text-text placeholder:text-text-muted",
        FIELD_BG,
        "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(
      "w-full rounded-xl border border-border px-4 py-3 text-text placeholder:text-text-muted",
      FIELD_BG,
      "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
