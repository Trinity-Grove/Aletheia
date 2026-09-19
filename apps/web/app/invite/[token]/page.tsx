'use client';

import React, { use } from 'react';
import { InvitationAcceptView } from '../../../src/components/invitations/invitation-accept-view';

export interface InvitePageProps {
  params?: Promise<{ token: string }> | { token: string };
}

export default function InvitePage({ params }: InvitePageProps = {}) {
  const resolvedParams =
    params && typeof (params as Promise<{ token: string }>).then === 'function'
      ? use(params as Promise<{ token: string }>)
      : (params as { token: string } | undefined);

  return <InvitationAcceptView token={resolvedParams?.token ?? ''} />;
}
