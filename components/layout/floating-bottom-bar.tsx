/** Fixed action bar pinned to the bottom of the viewport — used for a
 * primary call to action that must stay visible at all times while
 * scrolling through long content (e.g. "Débloquer — 9,99€/mois" under a
 * freshly generated fiche). `md:left-64` keeps it clear of the desktop
 * sidebar (16rem wide) instead of centering across the full viewport. */
export function FloatingBottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 md:left-64">
      <div className="relative mx-auto max-w-xl px-4 pb-4 md:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-10 bg-gradient-to-t from-bg to-transparent"
        />
        {children}
      </div>
    </div>
  );
}
