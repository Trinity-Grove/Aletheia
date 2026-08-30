'use client';

import React, { useState, useEffect } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  FamilySettingsResponseDto,
  UpdateFamilySettingsDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface NotificationPreferencesProps {
  settings: FamilySettingsResponseDto | null;
  onSave: (dto: UpdateFamilySettingsDto) => Promise<void>;
  isLoading?: boolean;
}

export function NotificationPreferences({
  settings,
  onSave,
  isLoading = false,
}: NotificationPreferencesProps) {
  const [devotionalReminderTime, setDevotionalReminderTime] = useState('07:30');
  const [dailyScheduleReminderTime, setDailyScheduleReminderTime] = useState('08:00');
  const [attendanceReminderEnabled, setAttendanceReminderEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDevotionalReminderTime(settings.devotionalReminderTime ?? '07:30');
      setDailyScheduleReminderTime(settings.dailyScheduleReminderTime ?? '08:00');
      setAttendanceReminderEnabled(settings.attendanceReminderEnabled ?? true);
      setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? true);
      setInAppNotificationsEnabled(settings.inAppNotificationsEnabled ?? true);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await onSave({
        devotionalReminderTime: devotionalReminderTime.trim() ? devotionalReminderTime.trim() : null,
        dailyScheduleReminderTime: dailyScheduleReminderTime.trim() ? dailyScheduleReminderTime.trim() : null,
        attendanceReminderEnabled,
        emailNotificationsEnabled,
        inAppNotificationsEnabled,
      });
      setSuccessMessage('Preferências de notificações salvas com sucesso!');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="notification-preferences-card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Central de Notificações & Lembretes da Rotina
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Configure os horários de alerta para a liturgia familiar diária, rotina acadêmica e canais de entrega.
        </p>
      </div>

      {successMessage && (
        <div
          data-testid="notification-preferences-success-alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-emerald-50)',
            border: '1px solid var(--color-emerald-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-emerald-700)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AletheiaIcon name="check" size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="notification-preferences-error-alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-rose-50)',
            border: '1px solid var(--color-rose-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-rose-700)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AletheiaIcon name="alert-circle" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form data-testid="notification-preferences-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Reminder Times Section */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--sage-soft)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>
              Horários de Lembretes Diários
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label
                  htmlFor="devotionalReminderTime"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
                >
                  <AletheiaIcon name="book-open" size={14} style={{ color: 'var(--color-amber-600)' }} />
                  <span>Lembrete do Devocional Familiar</span>
                </label>
                <input
                  id="devotionalReminderTime"
                  data-testid="devotional-reminder-time-input"
                  type="time"
                  value={devotionalReminderTime}
                  onChange={(e) => setDevotionalReminderTime(e.target.value)}
                  disabled={isLoading || isSaving}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-surface)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="dailyScheduleReminderTime"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
                >
                  <AletheiaIcon name="clock" size={14} style={{ color: 'var(--color-indigo-600)' }} />
                  <span>Lembrete do Cronograma de Aulas</span>
                </label>
                <input
                  id="dailyScheduleReminderTime"
                  data-testid="daily-schedule-reminder-time-input"
                  type="time"
                  value={dailyScheduleReminderTime}
                  onChange={(e) => setDailyScheduleReminderTime(e.target.value)}
                  disabled={isLoading || isSaving}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-surface)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Canais e Tipos de Notificação
            </h3>

            {/* Attendance Reminder Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Lembrete de Frequência Pendente
                </span>
                <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Avisar ao final do dia se houver educandos sem registro de presença efetuado.
                </p>
              </div>
              <input
                type="checkbox"
                data-testid="attendance-reminder-toggle"
                checked={attendanceReminderEnabled}
                onChange={(e) => setAttendanceReminderEnabled(e.target.checked)}
                disabled={isLoading || isSaving}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>

            {/* In-App Notifications Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Notificações no Navegador / In-App
                </span>
                <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Exibir balão e contador de avisos no sino da barra superior da plataforma.
                </p>
              </div>
              <input
                type="checkbox"
                data-testid="in-app-notifications-toggle"
                checked={inAppNotificationsEnabled}
                onChange={(e) => setInAppNotificationsEnabled(e.target.checked)}
                disabled={isLoading || isSaving}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>

            {/* Email Notifications Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Resumo e Notificações por E-mail
                </span>
                <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Receber avisos importantes e orações respondidas no e-mail dos pais.
                </p>
              </div>
              <input
                type="checkbox"
                data-testid="email-notifications-toggle"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                disabled={isLoading || isSaving}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Can action="edit_family_settings">
              <button
                type="submit"
                data-testid="save-notification-preferences-btn"
                disabled={isLoading || isSaving}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: isSaving ? 'var(--text-muted)' : 'var(--forest)',
                  color: 'var(--text-inverse)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isSaving ? 'Salvando...' : 'Salvar Preferências'}
              </button>
            </Can>
          </div>
        </div>
      </form>
    </div>
  );
}
