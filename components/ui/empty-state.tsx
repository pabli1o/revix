import clsx from "clsx";

/** Dashed-border box used across every "nothing here yet" screen (fiches,
 * examens, planning, quiz…) per the validated design spec. */
export function EmptyState({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}
