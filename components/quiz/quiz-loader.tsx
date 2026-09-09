/** A card flipping in place, filling with green and back to transparent,
 * with a "?" on its face — shown while a quiz is being prepared. */
export function QuizLoader() {
  return (
    <div className="[perspective:600px]" aria-hidden="true">
      <div
        className="quiz-loader-card flex size-20 items-center justify-center rounded-2xl border-2 border-success text-4xl font-bold text-success [transform-style:preserve-3d]"
      >
        ?
      </div>
    </div>
  );
}
