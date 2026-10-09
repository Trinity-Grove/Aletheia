'use client';

import React from 'react';
import { useLocale } from '../../../src/lib/i18n/locale-context';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { DesignSystemShowcase } from '../../../src/components/design-system/design-system-showcase';

export default function DesignSystemPage() {
  const { t: _t } = useLocale();

  return (
    <ProductShell currentPath="/design-system">
      <DesignSystemShowcase />
    </ProductShell>
  );
}
