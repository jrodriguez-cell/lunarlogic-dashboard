import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LunarLogic — AR Automation Onboarding',
  description: 'Get started with LunarLogic AR automation. 7-step onboarding wizard — takes less than 10 minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-[#0A0F1E] text-[#F7F9FC]" style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
