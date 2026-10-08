'use client';

import React, { use } from 'react';
import { useLocale } from '../../../src/lib/i18n/locale-context';
import { InvitationAcceptView } from '../../../src/components/invitations/invitation-accept-view';

export interface ConvitePageProps {
  params?: Promise<{ token: string }> | { token: string };
}

export default function ConvitePage({ params }: ConvitePageProps = {}) {
  const { t: _t } = useLocale();
  const resolvedParams =
    params && typeof (params as Promise<{ token: string }>).then === 'function'
      ? use(params as Promise<{ token: string }>)
      : (params as { token: string } | undefined);

  return <InvitationAcceptView token={resolvedParams?.token ?? ''} />;
}
