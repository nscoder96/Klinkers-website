import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/chat/ChatWidget";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klinkers & Co | Hovenier & Stratenmaker Gouda",
  description: "De slimste hovenier van Gouda. Specialist in tuinaanleg, bestrating en beplanting op verzakkingsgevoelige grond. Snelle offertes, vakwerk gegarandeerd.",
  keywords: ["hovenier Gouda", "tuinaanleg Gouda", "bestrating Gouda", "stratenmaker", "tuinontwerp"],
  openGraph: {
    title: "Klinkers & Co | Hovenier & Stratenmaker Gouda",
    description: "De slimste hovenier van Gouda. Specialist in tuinaanleg en bestrating.",
    locale: "nl_NL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
