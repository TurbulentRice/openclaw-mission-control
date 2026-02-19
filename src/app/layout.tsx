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

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Local-first Mission Control overlay for OpenClaw.",
  icons: {
    icon: [
      { url: "/icon/claw-mc-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon/claw-mc-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/claw-mc-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon/claw-mc-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon/claw-mc-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon/claw-mc-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/icon/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
