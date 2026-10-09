'use client';

import React from 'react';
import { useLocale } from '../../src/lib/i18n/locale-context';
import VerificarPage from '../verificar/page';

export default function VerifyPage() {
  const { t: _t } = useLocale();
  return <VerificarPage />;
}
