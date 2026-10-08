'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  AccountAuditLogEntryDto,
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
  FamilyInvitationDto,
  FamilyMemberDto,
  FamilySettingsResponseDto,
  InviteGuardianDto,
  LearnerSummaryDto,
  NotificationItemResponseDto,
  UpdateFamilySettingsDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { FamilyGeneralSettings } from '../../../src/components/settings/family-general-settings';
import { FamilyMembersSettings } from '../../../src/components/settings/family-members-settings';
import { NotificationPreferences } from '../../../src/components/settings/notification-preferences';
import { DataBackupCard } from '../../../src/components/settings/data-backup-card';
import { SupporterSettingsCard } from '../../../src/components/settings/supporter-settings-card';
import { AccountSecuritySettings } from '../../../src/components/settings/account-security-settings';
import { AccountActivityLog } from '../../../src/components/settings/account-activity-log';
import { PedagogicalTheologicalProfileSettings } from '../../../src/components/settings/pedagogical-theological-profile-settings';
import { PrivacyConsentSettings } from '../../../src/components/settings/privacy-consent-settings';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';
import { api } from '../../../src/lib/api';

type ActiveTab = 'general' | 'family' | 'profile' | 'notifications' | 'backup' | 'account' | 'privacy' | 'support';
const VALID_TABS: ActiveTab[] = [
  'general',
  'family',
  'profile',
  'notifications',
  'backup',
  'account',
  'privacy',
  'support',
];

function getTabButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: isActive ? 'var(--forest-50, #f0fdf4)' : 'transparent',
    color: isActive ? 'var(--forest)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  };
}

function SettingsPageContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as ActiveTab | null;
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'general';
  });

  const { user, changePassword, changeEmail, refreshSession } = useAuth();
  const fetchAuditLog = useCallback(async () => {
    return api.get<AccountAuditLogEntryDto[]>('/auth/audit-log');
  }, []);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<FamilySettingsResponseDto | null>(null);
  const [members, setMembers] = useState<FamilyMemberDto[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitationDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationItemResponseDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [exportJobs, setExportJobs] = useState<DataExportJobResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL search parameter if changed externally or on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ActiveTab | null;
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

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

        // Fetch family members
        const familyRes = await fetch(`/api/v1/families/${storedFamilyId}`, {
          credentials: 'include',
        });
        if (familyRes.ok) {
          const fData = await familyRes.json();
          setMembers(fData.members ?? []);
        }

        // Fetch pending invitations
        const invitationsRes = await fetch(`/api/v1/families/${storedFamilyId}/invitations`, {
          credentials: 'include',
        });
        if (invitationsRes.ok) {
          const iData = await invitationsRes.json();
          setInvitations(iData);
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

  const handleInviteGuardian = async (dto: InviteGuardianDto) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao enviar o convite');
    }

    const invitation: FamilyInvitationDto = await res.json();
    setInvitations((prev) => [...prev, invitation]);
  };

  const handleCancelInvitation = async (id: string) => {
    const res = await fetch(`/api/v1/invitations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao cancelar o convite');
    }

    setInvitations((prev) => prev.filter((invitation) => invitation.id !== id));
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {t('settings.pageTitle')}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0.375rem 0 0 0' }}>
            {t('settings.pageDescription')}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('settings.loading')}
          </div>
        ) : (
          <div className="settings-page-grid">
            {/* Sidebar Navigation */}
            <aside
              data-testid="settings-sidebar-nav"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 0.75rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Group 1: Família & Liturgia */}
              <div>
                <div
                  data-testid="settings-group-family"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    paddingLeft: '0.75rem',
                  }}
                >
                  {t('settings.groups.family')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    type="button"
                    data-testid="tab-general-settings"
                    onClick={() => handleSelectTab('general')}
                    style={getTabButtonStyle(activeTab === 'general')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="building-2" size="sm" />
                      <span>{t('settings.tabs.general')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="tab-family-members"
                    onClick={() => handleSelectTab('family')}
                    style={getTabButtonStyle(activeTab === 'family')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="users" size="sm" />
                      <span>{t('settings.tabs.family')}</span>
                    </span>
                    {members.length > 0 && (
                      <span
                        data-testid="family-members-count-badge"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-slate-100, #f1f5f9)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {members.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="tab-profile-settings"
                    onClick={() => handleSelectTab('profile')}
                    style={getTabButtonStyle(activeTab === 'profile')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="graduation-cap" size="sm" />
                      <span>{t('settings.tabs.profile')}</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Group 2: Comunicação */}
              <div>
                <div
                  data-testid="settings-group-communication"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    paddingLeft: '0.75rem',
                  }}
                >
                  {t('settings.groups.communication')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    type="button"
                    data-testid="tab-notification-preferences"
                    onClick={() => handleSelectTab('notifications')}
                    style={getTabButtonStyle(activeTab === 'notifications')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="bell" size="sm" />
                      <span>{t('settings.tabs.notifications')}</span>
                    </span>
                    {unreadCount > 0 && (
                      <span
                        data-testid="settings-notifications-badge"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--forest)',
                          color: '#fff',
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Group 3: Segurança & Soberania */}
              <div>
                <div
                  data-testid="settings-group-security"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    paddingLeft: '0.75rem',
                  }}
                >
                  {t('settings.groups.security')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    type="button"
                    data-testid="tab-account-security"
                    onClick={() => handleSelectTab('account')}
                    style={getTabButtonStyle(activeTab === 'account')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="lock" size="sm" />
                      <span>{t('settings.tabs.account')}</span>
                    </span>
                    <span
                      data-testid="mfa-status-badge"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: user?.mfaEnabled ? '#dcfce7' : '#fef3c7',
                        color: user?.mfaEnabled ? '#166534' : '#92400e',
                      }}
                    >
                      {user?.mfaEnabled ? t('settings.badges.mfaActive') : t('settings.badges.mfaRecommended')}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="tab-privacy-settings"
                    onClick={() => handleSelectTab('privacy')}
                    style={getTabButtonStyle(activeTab === 'privacy')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="file-text" size="sm" />
                      <span>{t('settings.tabs.privacy')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="tab-data-backup"
                    onClick={() => handleSelectTab('backup')}
                    style={getTabButtonStyle(activeTab === 'backup')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="shield-check" size="sm" />
                      <span>{t('settings.tabs.backup')}</span>
                    </span>
                    {exportJobs.length > 0 && (
                      <span
                        data-testid="backup-status-badge"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#f1f5f9',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {exportJobs.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Group 4: Comunidade */}
              <div>
                <div
                  data-testid="settings-group-community"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    paddingLeft: '0.75rem',
                  }}
                >
                  {t('settings.groups.community')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    type="button"
                    data-testid="tab-supporter-settings"
                    onClick={() => handleSelectTab('support')}
                    style={getTabButtonStyle(activeTab === 'support')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <AletheiaIcon name="heart" size="sm" />
                      <span>{t('settings.tabs.support')}</span>
                    </span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main
              data-testid="settings-content-area"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)',
                minHeight: '480px',
              }}
            >
              {activeTab === 'general' && (
                <FamilyGeneralSettings
                  settings={settings}
                  onSave={handleSaveSettings}
                />
              )}

              {activeTab === 'family' && (
                <FamilyMembersSettings
                  members={members}
                  invitations={invitations}
                  onInvite={handleInviteGuardian}
                  onCancelInvitation={handleCancelInvitation}
                />
              )}

              {activeTab === 'profile' && familyId && (
                <PedagogicalTheologicalProfileSettings familyId={familyId} />
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

              {activeTab === 'privacy' && familyId && (
                <PrivacyConsentSettings
                  familyId={familyId}
                  learners={learners}
                />
              )}

              {activeTab === 'support' && (
                <SupporterSettingsCard familyId={familyId} />
              )}
            </main>
          </div>
        )}
      </div>
    </ProductShell>
  );
}

export default function SettingsPage() {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {t('settings.loading')}
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
