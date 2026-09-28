'use client';

import React from 'react';
import { AdminShell } from '../../src/components/layout/admin-shell';
import { UsersManagement } from '../../src/components/users/users-management';

export default function UsersPage(): React.ReactElement {
  return (
    <AdminShell>
      <UsersManagement />
    </AdminShell>
  );
}
