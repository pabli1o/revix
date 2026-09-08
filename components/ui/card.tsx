import clsx from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-border bg-bg-card p-5 shadow-sm", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
