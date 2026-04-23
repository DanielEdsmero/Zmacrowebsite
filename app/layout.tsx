import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { THEME } from "@/lib/theme";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Z Macro",
  description: "Macro downloads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme={THEME} className={mono.variable}>
      <body className="min-h-screen bg-black font-mono text-lime-term antialiased">
        {children}
      </body>
    </html>
  );
}
