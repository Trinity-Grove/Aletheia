import type { Metadata } from 'next';
import { DM_Sans, Libre_Caslon_Display } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const libreCaslon = Libre_Caslon_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aletheia — Faithful learning, thoughtfully guided.',
  description: 'A parent-first platform for faithful, thoughtful home education by Trinity Grove.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${libreCaslon.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

