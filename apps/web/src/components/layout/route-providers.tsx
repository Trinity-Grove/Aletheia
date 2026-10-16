'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../../lib/auth/auth-context';
import { LocaleProvider } from '../../lib/i18n/locale-context';

// The family session provider eagerly fetches /families/mine. Mentor pages
// authenticate through their own scoped endpoints instead.
export function RouteProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mentor = pathname === '/mentor' || pathname?.startsWith('/mentor/');
  return <LocaleProvider key={mentor ? 'mentor' : 'family'} syncFamily={!mentor}>
    {mentor ? children : <AuthProvider>{children}</AuthProvider>}
  </LocaleProvider>;
}
