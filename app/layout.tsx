import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionTimerProvider } from "@/components/timer/session-timer-context";
import { NavigationHistoryProvider } from "@/components/navigation/navigation-history-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import "./globals.css";

// Single font for the whole site (headings, body, buttons, tabs, labels,
// fiche content) — app/globals.css aliases --font-heading/--font-body/
// --font-mono all to this same instance, so weight/size are the only
// levers, never a different family.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// viewportFit: "cover" lets content draw under the iPhone status bar/home
// indicator so env(safe-area-inset-*) reports real values instead of 0 —
// used by the sticky bottom action bar (floating-bottom-bar.tsx) to clear
// the home indicator instead of sitting under it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.root.siteTagline,
    description: t.root.siteDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen bg-bg text-text antialiased">
        <LocaleProvider initialLocale={locale}>
          <NavigationHistoryProvider>
            <SessionTimerProvider>{children}</SessionTimerProvider>
          </NavigationHistoryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
