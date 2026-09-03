'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  AccountAuditLogEntryDto,
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
  FamilySettingsResponseDto,
  LearnerSummaryDto,
  NotificationItemResponseDto,
  UpdateFamilySettingsDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { FamilyGeneralSettings } from '../../../src/components/settings/family-general-settings';
import { NotificationPreferences } from '../../../src/components/settings/notification-preferences';
import { DataBackupCard } from '../../../src/components/settings/data-backup-card';
import { AccountSecuritySettings } from '../../../src/components/settings/account-security-settings';
import { AccountActivityLog } from '../../../src/components/settings/account-activity-log';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { api } from '../../../src/lib/api';

type ActiveTab = 'general' | 'notifications' | 'backup' | 'account';

export default function SettingsPage() {
  const { user, changePassword, changeEmail, refreshSession } = useAuth();
  const fetchAuditLog = useCallback(
    () => api.get<AccountAuditLogEntryDto[]>('/auth/audit-log'),
    [],
  );
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<FamilySettingsResponseDto | null>(null);
  const [notifications, setNotifications] = useState<NotificationItemResponseDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [exportJobs, setExportJobs] = useState<DataExportJobResponseDto[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [loading, setLoading] = useState(true);

  // Initial Load: family, learners, settings, notifications
  useEffect(() => {
    async function loadBaseData() {
      try {
        const storedFamilyId = localStorage.getItem('familyId');
        if (!storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Fetch learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          credentials: 'include',
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }

        // Fetch settings
        const settingsRes = await fetch(`/api/v1/families/${storedFamilyId}/settings`, {
          credentials: 'include',
        });
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setSettings(sData);
        }

        // Fetch notifications
        const notifRes = await fetch(`/api/v1/families/${storedFamilyId}/notifications`, {
          credentials: 'include',
        });
        if (notifRes.ok) {
          const nData = await notifRes.json();
          setNotifications(nData);
        }

        // Fetch unread count
        const countRes = await fetch(`/api/v1/families/${storedFamilyId}/notifications/unread-count`, {
          credentials: 'include',
        });
        if (countRes.ok) {
          const cData = await countRes.json();
          setUnreadCount(cData.count ?? 0);
        }

        // Fetch export jobs
        const exportJobsRes = await fetch(`/api/v1/families/${storedFamilyId}/export`, {
          credentials: 'include',
        });
        if (exportJobsRes.ok) {
          const jobsData = await exportJobsRes.json();
          setExportJobs(jobsData);
        }
      } catch {
        // ignore network error in initial load
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!familyId) return;
    try {
      const notifRes = await fetch(`/api/v1/families/${familyId}/notifications`, {
        credentials: 'include',
      });
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setNotifications(nData);
      }

      const countRes = await fetch(`/api/v1/families/${familyId}/notifications/unread-count`, {
        credentials: 'include',
      });
      if (countRes.ok) {
        const cData = await countRes.json();
        setUnreadCount(cData.count ?? 0);
      }
    } catch {
      // ignore
    }
  }, [familyId]);

  // Actions
  const handleSaveSettings = async (dto: UpdateFamilySettingsDto) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao atualizar as configurações da família');
    }

    const updated: FamilySettingsResponseDto = await res.json();
    setSettings(updated);
  };

  const handleExportFullPackage = async (): Promise<FamilyDataExportPackageDto> => {
    if (!familyId) {
      throw new Error('Família não autenticada');
    }
    const res = await fetch(`/api/v1/families/${familyId}/export/package`, {
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao baixar pacote completo de dados');
    }

    return res.json();
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/notifications/${id}/read`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      await refreshNotifications();
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/notifications/read-all`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      await refreshNotifications();
    }
  };

  return (
    <ProductShell
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkNotificationAsRead={handleMarkNotificationAsRead}
      onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Configurações & Painel da Família
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0.375rem 0 0 0' }}>
            Gerencie identidade pedagógica, preferências de notificações da liturgia diária e backup completo de soberania.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '2rem',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            data-testid="tab-general-settings"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'general' ? '2px solid var(--forest)' : '2px solid transparent',
              color: activeTab === 'general' ? 'var(--forest)' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AletheiaIcon name="building-2" size="sm" />
            <span>Identidade & Geral</span>
          </button>

          <button
            type="button"
            data-testid="tab-notification-preferences"
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'notifications' ? '2px solid var(--forest)' : '2px solid transparent',
              color: activeTab === 'notifications' ? 'var(--forest)' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AletheiaIcon name="bell" size="sm" />
            <span>Notificações & Lembretes</span>
          </button>

          <button
            type="button"
            data-testid="tab-data-backup"
            onClick={() => setActiveTab('backup')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'backup' ? '2px solid var(--forest)' : '2px solid transparent',
              color: activeTab === 'backup' ? 'var(--forest)' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AletheiaIcon name="shield-check" size="sm" />
            <span>Backup & Soberania de Dados</span>
          </button>

          <button
            type="button"
            data-testid="tab-account-security"
            onClick={() => setActiveTab('account')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'account' ? '2px solid var(--forest)' : '2px solid transparent',
              color: activeTab === 'account' ? 'var(--forest)' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AletheiaIcon name="lock" size="sm" />
            <span>Conta & Segurança</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando configurações...
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {activeTab === 'general' && (
              <FamilyGeneralSettings
                settings={settings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationPreferences
                settings={settings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'backup' && (
              <DataBackupCard
                exportJobs={exportJobs}
                onExportPackage={handleExportFullPackage}
              />
            )}

            {activeTab === 'account' && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <AccountSecuritySettings
                  currentEmail={user?.email}
                  mfaEnabled={user?.mfaEnabled ?? false}
                  onChangePassword={changePassword}
                  onChangeEmail={changeEmail}
                  onMfaStateChanged={refreshSession}
                />
                <AccountActivityLog fetchAuditLog={fetchAuditLog} />
              </div>
            )}
          </div>
        )}
      </div>
    </ProductShell>
  );
}
