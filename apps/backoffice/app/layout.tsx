import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminAuthProvider } from '../src/lib/auth/admin-auth-context';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import '@aletheia/ui/css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aletheia Backoffice — Administração da Plataforma',
  description: 'Painel corporativo e operacional da plataforma Aletheia.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="admin-body">
        <AdminAuthProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
