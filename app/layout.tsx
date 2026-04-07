import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
    <html lang="en-GB">
      <body>
        <div className="min-h-screen bg-mist">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
