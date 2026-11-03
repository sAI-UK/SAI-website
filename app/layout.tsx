import type { Metadata } from "next";
import { Caveat, Fraunces, Inter } from "next/font/google";

import { NightSky } from "@/components/ballpoint/night-sky";
import { modeBootScript } from "@/components/mode-toggle";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "SAI | Character, Creativity and Responsible AI",
    template: "%s | SAI",
  },
  description:
    "SAI is a UK-based education and social impact initiative developing a thoughtful, values-led approach to children’s character, creativity and responsible AI awareness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable} ${hand.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeBootScript }} />
      </head>
      <body>
        <NightSky />
        {/* Maps paper to moonlit navy and blue ink to pale chalk, keeping transparency. See --art-filter in globals.css. */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
          <filter id="night-pen" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="-.2156 -.7252 -.0732 0 1.106  -.2158 -.7259 -.0733 0 1.146  -.196 -.6594 -.0666 0 1.242  0 0 0 1 0" />
          </filter>
        </svg>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <div className="min-h-screen">
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
