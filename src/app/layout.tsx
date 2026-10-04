import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { authLocalization, globalClerkAppearance } from "@/components/authAppearance";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeReady: Internship-ready resumes in 10 minutes",
  description:
    "AI resume builder for Indian college students. Pick your role, answer a few questions, and get an ATS-friendly resume with strong, quantified bullets.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      localization={authLocalization}
      appearance={globalClerkAppearance}
    >
      <html lang="en" className={interTight.variable}>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
