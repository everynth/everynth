import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everynth.vercel.app";
const DESCRIPTION = "Launch and sell digital products on Solana. Encrypted in your browser, paid wallet-to-wallet, 95% straight to the creator.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "EVERYNTH — The Private Commerce Layer", template: "%s · EVERYNTH" },
  description: DESCRIPTION,
  applicationName: "EVERYNTH",
  openGraph: {
    type: "website",
    siteName: "EVERYNTH",
    title: "EVERYNTH — The Private Commerce Layer",
    description: DESCRIPTION,
    url: SITE,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "EVERYNTH — The Private Commerce Layer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVERYNTH — The Private Commerce Layer",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

// Root shell only: fonts and global CSS. The app chrome lives in app/(app)/layout.tsx,
// the docs chrome in app/docs/layout.tsx.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
