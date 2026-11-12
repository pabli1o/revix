import clsx from "clsx";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={clsx(
          "w-full cursor-pointer appearance-none rounded-xl border border-border bg-bg-elevated px-4 py-3 pr-9 text-sm font-medium text-text transition-colors hover:border-accent focus:border-accent focus:outline-none",
          className,
        )}
        {...props}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">▾</span>
    </div>
  );
}
