/** Generic route-transition indicator, shown instantly via loading.tsx
 * (a Suspense boundary Next.js inserts automatically per route segment)
 * while a page's server-side data fetch is still in flight — makes
 * navigation feel immediate instead of appearing frozen. */
export function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-accent/25 border-t-accent" />
    </div>
  );
}
