'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Bell, ShieldCheck } from 'lucide-react';
import type {
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

type ActiveTab = 'general' | 'notifications' | 'backup';

export default function SettingsPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<FamilySettingsResponseDto | null>(null);
  const [notifications, setNotifications] = useState<NotificationItemResponseDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [exportJobs, setExportJobs] = useState<DataExportJobResponseDto[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [loading, setLoading] = useState(true);

  // Initial Load: token, family, learners, settings, notifications
  useEffect(() => {
    async function loadBaseData() {
      try {
        const token = localStorage.getItem('token');
        const storedFamilyId = localStorage.getItem('familyId');
        if (!token || !storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Fetch learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }

        // Fetch settings
        const settingsRes = await fetch(`/api/v1/families/${storedFamilyId}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setSettings(sData);
        }

        // Fetch notifications
        const notifRes = await fetch(`/api/v1/families/${storedFamilyId}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const nData = await notifRes.json();
          setNotifications(nData);
        }

        // Fetch unread count
        const countRes = await fetch(`/api/v1/families/${storedFamilyId}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (countRes.ok) {
          const cData = await countRes.json();
          setUnreadCount(cData.count ?? 0);
        }

        // Fetch export jobs
        const exportJobsRes = await fetch(`/api/v1/families/${storedFamilyId}/export`, {
          headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem('token');
      const notifRes = await fetch(`/api/v1/families/${familyId}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setNotifications(nData);
      }

      const countRes = await fetch(`/api/v1/families/${familyId}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
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
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/export/package`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao baixar pacote completo de dados');
    }

    return res.json();
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await refreshNotifications();
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
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
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Configurações & Painel da Família
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#6B7280', margin: '0.375rem 0 0 0' }}>
            Gerencie identidade pedagógica, preferências de notificações da liturgia diária e backup completo de soberania.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E5E7EB',
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
              borderBottom: activeTab === 'general' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'general' ? '#2563EB' : '#6B7280',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Building2 size={16} />
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
              borderBottom: activeTab === 'notifications' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'notifications' ? '#2563EB' : '#6B7280',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Bell size={16} />
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
              borderBottom: activeTab === 'backup' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'backup' ? '#2563EB' : '#6B7280',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldCheck size={16} />
            <span>Backup & Soberania de Dados</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
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
          </div>
        )}
      </div>
    </ProductShell>
  );
}
