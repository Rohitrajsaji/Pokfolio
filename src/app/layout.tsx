import type { Metadata, Viewport } from "next";
import { Pixelify_Sans } from "next/font/google";
import { profile, site } from "@content";
import { personJsonLd, serializeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./game.css";
import "./print.css";

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s · ${profile.name}` },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: profile.name, url: profile.links.linkedin }],
  creator: profile.name,
  alternates: { canonical: "/" },
  // Added to an iPhone's home screen, it opens full-screen like an app.
  appleWebApp: { capable: true, title: profile.shortName, statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: profile.name,
    title: site.title,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#10131f",
  // Reaches under a phone's notch; the game keeps clear of it (see the safe-area padding).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixelify.variable} h-full antialiased`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd(siteUrl)) }}
        />
      </body>
    </html>
  );
}
