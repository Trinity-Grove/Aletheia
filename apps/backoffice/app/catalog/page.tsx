'use client';

import React from 'react';
import { AdminShell } from '../../src/components/layout/admin-shell';
import { AdminCatalog } from '../../src/components/catalog/admin-catalog';

export default function CatalogPage() {
  return (
    <AdminShell>
      <AdminCatalog />
    </AdminShell>
  );
}
