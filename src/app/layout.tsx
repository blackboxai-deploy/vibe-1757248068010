import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subway Surfers - Endless Runner Game",
  description: "Experience the thrill of an endless running adventure! Dodge trains, collect coins, and surf through the subway in this action-packed game.",
  keywords: "subway surfers, endless runner, game, arcade, mobile game, browser game",
  authors: [{ name: "Game Developer" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#1a1a2e",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Subway Surfers - Endless Runner Game",
    description: "Experience the thrill of an endless running adventure!",
    type: "website",
    images: [
      {
        url: "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3ecdabb0-e4e8-453e-a71a-7d27914b4f08.png",
        width: 1200,
        height: 630,
        alt: "Subway Surfers Game Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subway Surfers - Endless Runner Game",
    description: "Experience the thrill of an endless running adventure!",
    images: ["https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/03fa299d-5fda-471f-9499-0ed8edc4c55b.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preload" as="font" href="/fonts/game-font.woff2" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden`}
        style={{
          fontFamily: 'var(--font-geist-sans)',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {children}
      </body>
    </html>
  );
}