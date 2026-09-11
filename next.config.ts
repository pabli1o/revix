import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Every route under app/(app)/** reads cookies() (via Supabase SSR),
    // which makes it fully dynamic — combined with Next 15+'s default of
    // NOT reusing the client-side Router Cache for dynamic routes
    // (staleTimes.dynamic defaults to 0 since v15), this meant every single
    // Link click re-ran the whole server render (and every Supabase query
    // on that page) from scratch, even when re-visiting a tab clicked
    // seconds earlier. Raising this lets the browser reuse the previous
    // RSC payload for a route without a server round trip at all, for
    // `dynamic` seconds after leaving it — router.refresh() (already
    // called after every mutation in this app: renaming/deleting a
    // matière or chapitre, saving fiches, updating settings, etc.)
    // explicitly clears this cache for the current route, so mutations
    // still show fresh data immediately regardless of this setting.
    staleTimes: {
      dynamic: 60,
    },
  },
};

export default nextConfig;
