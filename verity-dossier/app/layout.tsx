import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Verity Site Dossier — Terra Verity Ledger",
  description:
    "Enter a site. Verity assembles the fragmented public record into a single, cited, evidence-graded dossier — responsible parties, documented damage, and a rectification deliverable — from EPA and SEC EDGAR records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
