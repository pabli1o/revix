import { forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-text placeholder:text-text-muted",
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
      "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-text placeholder:text-text-muted",
      "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
