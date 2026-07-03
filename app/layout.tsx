import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Barlow_Condensed } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/app-shell/service-worker-registration";

import "./globals.css";

const bodyFont = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const displayFont = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Site Logger",
    template: "%s · Site Logger",
  },
  description: "GPS-evidenced attendance for active construction sites.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#173f35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
