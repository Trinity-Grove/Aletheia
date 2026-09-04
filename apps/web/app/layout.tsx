import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Lora } from 'next/font/google';
import type { ReactNode } from 'react';
import { ToastProvider } from '@aletheia/ui';
import { AuthProvider } from '../src/lib/auth/auth-context';
import '@aletheia/ui/css';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans-next',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif-next',
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aletheia — Faithful learning, thoughtfully guided.',
  description: 'A parent-first platform for faithful, thoughtful home education by Trinity Grove.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${lora.variable}`}
    >
      <body suppressHydrationWarning className="font-sans antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
