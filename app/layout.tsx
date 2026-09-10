import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SessionTimerProvider } from "@/components/timer/session-timer-context";
import { NavigationHistoryProvider } from "@/components/navigation/navigation-history-provider";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Revix — Fiches de révision",
  description: "Crée des fiches de révision, un planning et des quiz à partir de tes cours.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">
        <NavigationHistoryProvider>
          <SessionTimerProvider>{children}</SessionTimerProvider>
        </NavigationHistoryProvider>
      </body>
    </html>
  );
}
