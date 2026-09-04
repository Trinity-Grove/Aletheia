'use client';

import React from 'react';
import { Alert } from '@aletheia/ui';

export function SuccessAlert({ testId, message }: { testId: string; message: string }) {
  return (
    <Alert variant="success" data-testid={testId} style={{ marginBottom: '1.25rem' }}>
      {message}
    </Alert>
  );
}

export function ErrorAlert({ testId, message }: { testId: string; message: string }) {
  return (
    <Alert variant="error" data-testid={testId} style={{ marginBottom: '1.25rem' }}>
      {message}
    </Alert>
  );
}
