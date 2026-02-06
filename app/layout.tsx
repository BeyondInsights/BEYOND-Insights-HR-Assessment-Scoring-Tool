import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SavedToast from "@/components/SavedToast";
import AutoDataSync from "@/lib/supabase/auto-data-sync";
import SyncConflictBanner from "@/components/SyncConflictBanner";
// REMOVED: SilentDataRecovery - auto-sync handles all syncing now

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Best Companies Index",
  description: "Cancer and Careers Workplace Support Assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AutoDataSync />
        <SyncConflictBanner />
        {children}
        <SavedToast />
      </body>
    </html>
  );
}
