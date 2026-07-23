import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Footer from "@/components/Footer";
import LinkedInPill from "@/components/LinkedInPill";

export const metadata: Metadata = {
  title: "Sentinel",
  description: "Fraud prediction API with model monitoring, drift detection, and a live operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        <LinkedInPill />
        <Analytics />
      </body>
    </html>
  );
}
