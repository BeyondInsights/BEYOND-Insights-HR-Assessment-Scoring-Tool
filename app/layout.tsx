import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SecurityProtection from "@/components/SecurityProtection";
import { AssessmentProvider } from "@/lib/assessment-context";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Best Companies for Working with Cancer | 2027 Survey",
  description:
    "Assess how your company supports employees affected by cancer. A Cancer and Careers workplace support survey.",
  openGraph: {
    title: "Best Companies for Working with Cancer | 2027 Survey",
    description:
      "Assess how your company supports employees affected by cancer. A Cancer and Careers workplace support survey.",
    siteName: "Best Companies for Working with Cancer",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Companies for Working with Cancer | 2027 Survey",
    description:
      "Assess how your company supports employees affected by cancer. A Cancer and Careers workplace support survey.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SecurityProtection />
        <AssessmentProvider>
          {children}
        </AssessmentProvider>
      </body>
    </html>
  );
}
