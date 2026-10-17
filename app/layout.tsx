import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeFloaters } from "@/components/theme-floaters";
import { ThemeProvider, themeBootScript } from "@/components/theme-provider";

import "./globals.css";

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
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* This App Router root layout shares the font stylesheet across every route. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <ThemeProvider>
          <div className="site-shell min-h-screen">
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
            <ThemeFloaters />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
