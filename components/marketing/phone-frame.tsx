import clsx from "clsx";

/**
 * A plain CSS iPhone frame — dark bezel, dynamic-island pill, rounded
 * screen — no images, so it's as cheap as any other block on the page.
 * `children` fill the screen area and own their own background/scroll.
 */
export function PhoneFrame({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  /** "lg" for the hero showcase, "md" (default) for the feature tabs. */
  size?: "md" | "lg";
}) {
  return (
    <div
      className={clsx(
        "relative mx-auto shrink-0",
        size === "lg" ? "w-[280px] sm:w-[320px]" : "w-[240px] sm:w-[260px]",
        className,
      )}
    >
      <div className="rounded-[2.75rem] bg-[#1b1b1f] p-2 shadow-[0_30px_60px_-20px_rgba(23,24,27,0.45)]">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.25rem] bg-white">
          <div
            aria-hidden
            className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1b1b1f]"
          />
          <div className="h-full w-full overflow-hidden pt-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
