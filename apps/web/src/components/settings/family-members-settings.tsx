'use client';

import React, { useState } from 'react';
import { AletheiaIcon, Button, Card, Input, Select } from '@aletheia/ui';
import type {
  FamilyInvitationDto,
  FamilyMemberDto,
  FamilyRole,
  InviteGuardianDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { RoleBadge, ROLE_LABELS } from '../auth/role-badge';
import { SuccessAlert, ErrorAlert } from './settings-form-kit';

export interface FamilyMembersSettingsProps {
  members: FamilyMemberDto[];
  invitations: FamilyInvitationDto[];
  onInvite: (dto: InviteGuardianDto) => Promise<void>;
  onCancelInvitation: (id: string) => Promise<void>;
}

const INVITABLE_ROLES: FamilyRole[] = ['GUARDIAN', 'CO_GUARDIAN', 'EDUCATOR'];

export function FamilyMembersSettings({
  members,
  invitations,
  onInvite,
  onCancelInvitation,
}: FamilyMembersSettingsProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FamilyRole>('GUARDIAN');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteEmail.trim()) {
      setInviteError('Informe o e-mail do responsável a convidar.');
      return;
    }

    try {
      setInviteSaving(true);
      await onInvite({ email: inviteEmail.trim(), role: inviteRole });
      setInviteSuccess(`Convite enviado para ${inviteEmail.trim()}.`);
      setInviteEmail('');
      setInviteRole('GUARDIAN');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Falha ao enviar o convite.');
    } finally {
      setInviteSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await onCancelInvitation(id);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card data-testid="family-members-card" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Responsáveis & Educadores
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Pessoas com acesso a esta família e seu nível de permissão.
          </p>
        </div>

        <ul data-testid="family-members-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {members.map((member) => (
            <li
              key={member.id}
              data-testid={`family-member-${member.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {member.user?.fullName ?? member.user?.email ?? 'Membro'}
                </div>
                {member.user?.email && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{member.user.email}</div>
                )}
              </div>
              <RoleBadge role={member.role} size="sm" />
            </li>
          ))}
        </ul>
      </Card>

      {invitations.length > 0 && (
        <Card data-testid="pending-invitations-card" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Convites Pendentes
            </h2>
          </div>

          <ul data-testid="pending-invitations-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                data-testid={`pending-invitation-${invitation.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {invitation.email}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Convidado como {ROLE_LABELS[invitation.role]}
                  </div>
                </div>
                <Can action="invite_guardian">
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`cancel-invitation-${invitation.id}`}
                    onClick={() => handleCancel(invitation.id)}
                    isLoading={cancellingId === invitation.id}
                    style={{ color: 'var(--color-rose-700)' }}
                  >
                    Cancelar convite
                  </Button>
                </Can>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Can action="invite_guardian">
        <Card data-testid="invite-guardian-card" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Convidar Responsável ou Educador
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Enviamos um link de convite por e-mail com expiração.
            </p>
          </div>

          {inviteSuccess && <SuccessAlert testId="invite-guardian-success" message={inviteSuccess} />}
          {inviteError && <ErrorAlert testId="invite-guardian-error" message={inviteError} />}

          <form data-testid="invite-guardian-form" onSubmit={handleInvite}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <Input
                label="E-mail"
                type="email"
                data-testid="invite-guardian-email-input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviteSaving}
              />
              <Select
                label="Papel na família"
                data-testid="invite-guardian-role-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as FamilyRole)}
                disabled={inviteSaving}
                options={INVITABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Button
                type="submit"
                data-testid="invite-guardian-submit-button"
                isLoading={inviteSaving}
                leftIcon={<AletheiaIcon name="user-plus" size={16} />}
              >
                Enviar Convite
              </Button>
            </div>
          </form>
        </Card>
      </Can>
    </div>
  );
}
