/** Three little index cards swaying while a fiche is being generated. */
export function FicheLoader() {
  const cards = [
    { tilt: -8, delay: "0s" },
    { tilt: 0, delay: "0.15s" },
    { tilt: 8, delay: "0.3s" },
  ];

  return (
    <div className="flex items-end justify-center gap-2" aria-hidden="true">
      {cards.map((card, i) => (
        <div
          key={i}
          className="fiche-loader-card flex h-16 w-12 flex-col gap-1.5 rounded-md border border-accent/50 bg-bg-elevated p-2 shadow-md"
          style={
            {
              "--fiche-tilt": `${card.tilt}deg`,
              "--fiche-delay": card.delay,
            } as React.CSSProperties
          }
        >
          <div className="h-1 w-full rounded-full bg-accent/70" />
          <div className="h-1 w-3/4 rounded-full bg-text-muted/40" />
          <div className="h-1 w-full rounded-full bg-text-muted/40" />
          <div className="h-1 w-2/3 rounded-full bg-text-muted/40" />
        </div>
      ))}
    </div>
  );
}
