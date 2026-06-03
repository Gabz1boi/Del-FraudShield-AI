import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Del-FraudShield AI",
  description:
    "Platform deteksi dini siber-fraud untuk ekosistem akademik dan masyarakat berbasis data mining.",
  keywords: [
    "fraud detection",
    "phishing classifier",
    "data mining",
    "IndoBERT",
    "GEMASTIK",
    "IT Del"
  ],
  authors: [{ name: "Del-FraudShield AI Team" }]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <div className="noise-overlay" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
