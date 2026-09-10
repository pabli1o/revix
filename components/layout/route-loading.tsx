import { FicheLoader } from "@/components/ui/fiche-loader";

/** Generic route-transition indicator, shown instantly via loading.tsx
 * (a Suspense boundary Next.js inserts automatically per route segment)
 * while a page's server-side data fetch is still in flight — makes
 * navigation feel immediate instead of appearing frozen. Uses the same
 * swaying-cards animation as every other loading state in the app, with
 * no accompanying text. */
export function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <FicheLoader />
    </div>
  );
}
