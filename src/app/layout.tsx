import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InnerPeace — Yoga • Meditation • Mantra",
  description:
    "A premium wellness sanctuary: guided yoga, meditation timers with ambient soundscapes, and a digital mala mantra counter. Breathe. Meditate. Grow.",
  keywords: ["yoga", "meditation", "mantra", "wellness", "mindfulness", "InnerPeace"],
  authors: [{ name: "InnerPeace" }],
  icons: {
    icon: "/images/lake-quotes.png",
  },
  openGraph: {
    title: "InnerPeace Wellness",
    description: "Breathe. Meditate. Grow. A premium yoga, meditation and mantra chanting companion.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#12211f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
