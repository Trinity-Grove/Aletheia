'use client';

import React from 'react';
import { AdminShell } from '../../src/components/layout/admin-shell';
import { PackModerationDashboard } from '../../src/components/moderation/pack-moderation-dashboard';

export default function ModerationPage() {
  return (
    <AdminShell>
      <PackModerationDashboard />
    </AdminShell>
  );
}
