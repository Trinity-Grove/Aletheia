'use client';

import React from 'react';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { DesignSystemShowcase } from '../../../src/components/design-system/design-system-showcase';

export default function DesignSystemPage() {
  return (
    <ProductShell currentPath="/design-system">
      <DesignSystemShowcase />
    </ProductShell>
  );
}
