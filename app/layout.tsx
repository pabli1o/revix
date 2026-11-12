import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionTimerProvider } from "@/components/timer/session-timer-context";
import { NavigationHistoryProvider } from "@/components/navigation/navigation-history-provider";
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

export const metadata: Metadata = {
  title: "Reviix — Tes fiches de révision en moins de 2 min",
  description: "Tes fiches de révision en moins de 2 min à partir de tes cours — planning et quiz inclus.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-bg text-text antialiased">
        <NavigationHistoryProvider>
          <SessionTimerProvider>{children}</SessionTimerProvider>
        </NavigationHistoryProvider>
      </body>
    </html>
  );
}
