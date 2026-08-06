import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RACE｜興櫃主力戰情室",
  description: "分點主力的建倉、出貨、庫存與健康度排行。",
  openGraph: {
    title: "RACE｜興櫃主力戰情室",
    description: "分點主力的建倉、出貨、庫存與健康度排行。",
    images: ["/race-social-card.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="stylesheet" href="/race.css" />
        <link rel="stylesheet" href="/mobile.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script src="/auth.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
