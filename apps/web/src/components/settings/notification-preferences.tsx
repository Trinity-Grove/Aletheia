'use client';

import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Input, Switch } from '@aletheia/ui';
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
    <Card data-testid="notification-preferences-card" style={{ padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Central de Notificações & Lembretes da Rotina
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Configure os horários de alerta para a liturgia familiar diária, rotina acadêmica e canais de entrega.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" data-testid="notification-preferences-success-alert" style={{ marginBottom: '1.25rem' }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" data-testid="notification-preferences-error-alert" style={{ marginBottom: '1.25rem' }}>
          {errorMessage}
        </Alert>
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
              <Input
                label="Lembrete do Devocional Familiar"
                type="time"
                data-testid="devotional-reminder-time-input"
                value={devotionalReminderTime}
                onChange={(e) => setDevotionalReminderTime(e.target.value)}
                disabled={isLoading || isSaving}
              />

              <Input
                label="Lembrete do Cronograma de Aulas"
                type="time"
                data-testid="daily-schedule-reminder-time-input"
                value={dailyScheduleReminderTime}
                onChange={(e) => setDailyScheduleReminderTime(e.target.value)}
                disabled={isLoading || isSaving}
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Canais e Tipos de Notificação
            </h3>

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
              <Switch
                data-testid="attendance-reminder-toggle"
                checked={attendanceReminderEnabled}
                onChange={(e) => setAttendanceReminderEnabled(e.target.checked)}
                disabled={isLoading || isSaving}
                label="Lembrete de Frequência Pendente"
                description="Avisar ao final do dia se houver educandos sem registro de presença efetuado."
              />
            </div>

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
              <Switch
                data-testid="in-app-notifications-toggle"
                checked={inAppNotificationsEnabled}
                onChange={(e) => setInAppNotificationsEnabled(e.target.checked)}
                disabled={isLoading || isSaving}
                label="Notificações no Navegador / In-App"
                description="Exibir balão e contador de avisos no sino da barra superior da plataforma."
              />
            </div>

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
              <Switch
                data-testid="email-notifications-toggle"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                disabled={isLoading || isSaving}
                label="Resumo e Notificações por E-mail"
                description="Receber avisos importantes e orações respondidas no e-mail dos pais."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Can action="edit_family_settings">
              <Button type="submit" data-testid="save-notification-preferences-btn" isLoading={isSaving} disabled={isLoading}>
                Salvar Preferências
              </Button>
            </Can>
          </div>
        </div>
      </form>
    </Card>
  );
}
