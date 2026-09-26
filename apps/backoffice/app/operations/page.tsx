'use client';

import React from 'react';
import { AdminShell } from '../../src/components/layout/admin-shell';
import { OperationalDashboard } from '../../src/components/operations/operational-dashboard';

export default function OperationsPage(): React.ReactElement {
  return (
    <AdminShell>
      <OperationalDashboard />
    </AdminShell>
  );
}
