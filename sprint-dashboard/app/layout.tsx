import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LunarLogic Sprint Dashboard",
  description: "AI-Powered Accounting Automation — June 2026 Sales Sprint Command Center",
  openGraph: {
    description: "AI-Powered Accounting Automation — June 2026 Sales Sprint Command Center",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
