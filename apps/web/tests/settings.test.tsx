import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  FamilyDataExportPackageDto,
  FamilySettingsResponseDto,
  NotificationItemResponseDto,
} from '@aletheia/contracts';
import { FamilyGeneralSettings } from '../src/components/settings/family-general-settings';
import { NotificationPreferences } from '../src/components/settings/notification-preferences';
import { DataBackupCard } from '../src/components/settings/data-backup-card';
import { NotificationBell } from '../src/components/layout/notification-bell';
import { AuthProvider } from '../src/lib/auth/rbac-context';

const mockSettings: FamilySettingsResponseDto = {
  id: '00000000-0000-0000-0000-000000000001',
  familyId: '11111111-1111-1111-1111-111111111111',
  homeschoolName: 'Academia Familiar Silva',
  defaultGradingScale: 'MASTERY_QUALITATIVE',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  devotionalReminderTime: '07:00',
  dailyScheduleReminderTime: '08:30',
  attendanceReminderEnabled: true,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockNotifications: NotificationItemResponseDto[] = [
  {
    id: 'notif-1',
    familyId: '11111111-1111-1111-1111-111111111111',
    userId: 'user-1',
    type: 'DEVOTIONAL_REMINDER',
    title: 'Hora do Devocional Familiar',
    message: 'Salmos 119:105 - Lâmpada para os meus pés é tua palavra.',
    linkUrl: '/devotional',
    isRead: false,
    readAt: null,
    metadata: null,
    createdAt: '2026-08-26T07:00:00.000Z',
    updatedAt: '2026-08-26T07:00:00.000Z',
  },
  {
    id: 'notif-2',
    familyId: '11111111-1111-1111-1111-111111111111',
    userId: 'user-1',
    type: 'ATTENDANCE_MISSING_REMINDER',
    title: 'Frequência do Dia Pendente',
    message: 'Lembre-se de registrar a frequência dos educandos hoje.',
    linkUrl: '/attendance',
    isRead: false,
    readAt: null,
    metadata: null,
    createdAt: '2026-08-26T17:00:00.000Z',
    updatedAt: '2026-08-26T17:00:00.000Z',
  },
  {
    id: 'notif-3',
    familyId: '11111111-1111-1111-1111-111111111111',
    userId: 'user-1',
    type: 'PRAYER_ANSWERED_ALERT',
    title: 'Oração Respondida!',
    message: 'A oração pela saúde da vovó foi marcada como respondida.',
    linkUrl: '/devotional',
    isRead: true,
    readAt: '2026-08-26T18:00:00.000Z',
    metadata: null,
    createdAt: '2026-08-26T12:00:00.000Z',
    updatedAt: '2026-08-26T18:00:00.000Z',
  },
];

const mockBackupPackage: FamilyDataExportPackageDto = {
  exportedAt: '2026-08-26T18:00:00.000Z',
  version: '1.0.0',
  family: { id: '11111111-1111-1111-1111-111111111111', name: 'Família Silva' },
  settings: mockSettings,
  learners: [{ id: 'l-1', firstName: 'Samuel' }],
  devotionals: [{ id: 'd-1', scriptureReference: 'Salmos 23' }],
  prayerRequests: [],
  academicYears: [],
  subjects: [],
  curriculumPlans: [],
  lessonPlans: [],
  scheduleSlots: [],
  learningRecords: [],
  portfolioItems: [],
  attendanceRecords: [],
  complianceRequirements: [],
  officialReports: [],
};

describe('Settings Hub, Notification Center & Data Backup Web Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('FamilyGeneralSettings', () => {
    it('renders organization name, timezone, default pedagogical framework and language, and updates values', async () => {
      const onSaveMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyGeneralSettings
            settings={mockSettings}
            onSave={onSaveMock}
          />
        </AuthProvider>
      );

      // Verify Initial Render
      const homeschoolInput = screen.getByTestId('homeschool-name-input') as HTMLInputElement;
      expect(homeschoolInput.value).toBe('Academia Familiar Silva');

      const timezoneSelect = screen.getByTestId('timezone-select') as HTMLSelectElement;
      expect(timezoneSelect.value).toBe('America/Sao_Paulo');

      const scaleSelect = screen.getByTestId('default-grading-scale-select') as HTMLSelectElement;
      expect(scaleSelect.value).toBe('MASTERY_QUALITATIVE');

      const languageSelect = screen.getByTestId('language-select') as HTMLSelectElement;
      expect(languageSelect.value).toBe('pt-BR');

      // Update values
      fireEvent.change(homeschoolInput, {
        target: { value: 'Colégio Clássico Alvorada' },
      });
      fireEvent.change(timezoneSelect, {
        target: { value: 'America/Manaus' },
      });
      fireEvent.change(scaleSelect, {
        target: { value: 'LETTER_A_F' },
      });
      fireEvent.change(languageSelect, {
        target: { value: 'en-US' },
      });

      // Submit Form
      fireEvent.click(screen.getByTestId('save-family-settings-btn'));

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith({
          homeschoolName: 'Colégio Clássico Alvorada',
          timezone: 'America/Manaus',
          defaultGradingScale: 'LETTER_A_F',
          language: 'en-US',
        });
      });

      // Verify success feedback
      expect(await screen.findByTestId('family-settings-success-alert')).toBeDefined();
    });

    it('displays read-only notice and disables save for EDUCATOR role', () => {
      render(
        <AuthProvider role="EDUCATOR">
          <FamilyGeneralSettings
            settings={mockSettings}
            onSave={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getByTestId('educator-settings-notice')).toBeDefined();
      expect(screen.queryByTestId('save-family-settings-btn')).toBeNull();
      const input = screen.getByTestId('homeschool-name-input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe('NotificationPreferences', () => {
    it('toggles reminder switches and reminder times', async () => {
      const onSaveMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <NotificationPreferences
            settings={mockSettings}
            onSave={onSaveMock}
          />
        </AuthProvider>
      );

      // Verify Initial Times
      const devTimeInput = screen.getByTestId('devotional-reminder-time-input') as HTMLInputElement;
      expect(devTimeInput.value).toBe('07:00');

      const schedTimeInput = screen.getByTestId('daily-schedule-reminder-time-input') as HTMLInputElement;
      expect(schedTimeInput.value).toBe('08:30');

      // Verify Initial Toggles
      const attendanceToggle = screen.getByTestId('attendance-reminder-toggle') as HTMLInputElement;
      expect(attendanceToggle.checked).toBe(true);

      const inAppToggle = screen.getByTestId('in-app-notifications-toggle') as HTMLInputElement;
      expect(inAppToggle.checked).toBe(true);

      const emailToggle = screen.getByTestId('email-notifications-toggle') as HTMLInputElement;
      expect(emailToggle.checked).toBe(true);

      // Change Times
      fireEvent.change(devTimeInput, { target: { value: '06:45' } });
      fireEvent.change(schedTimeInput, { target: { value: '09:00' } });

      // Toggle Switches
      fireEvent.click(attendanceToggle); // -> false
      fireEvent.click(emailToggle); // -> false

      // Submit
      fireEvent.click(screen.getByTestId('save-notification-preferences-btn'));

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith({
          devotionalReminderTime: '06:45',
          dailyScheduleReminderTime: '09:00',
          attendanceReminderEnabled: false,
          inAppNotificationsEnabled: true,
          emailNotificationsEnabled: false,
        });
      });

      expect(await screen.findByTestId('notification-preferences-success-alert')).toBeDefined();
    });
  });

  describe('DataBackupCard', () => {
    it('triggers backup export package and handles JSON download', async () => {
      const onExportMock = vi.fn().mockResolvedValue(mockBackupPackage);

      // Mock URL methods & link click
      const createObjectURLMock = vi.fn().mockReturnValue('blob:aletheia-backup-url');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <DataBackupCard
            onExportPackage={onExportMock}
            exportJobs={[
              {
                id: 'job-1',
                familyId: '11111111-1111-1111-1111-111111111111',
                requestedById: 'user-1',
                status: 'COMPLETED',
                createdAt: '2026-08-26T12:00:00.000Z',
                updatedAt: '2026-08-26T12:01:00.000Z',
              },
            ]}
          />
        </AuthProvider>
      );

      // Verify Card elements
      expect(screen.getByTestId('data-backup-card')).toBeDefined();
      expect(screen.getByTestId('export-job-item-job-1')).toBeDefined();

      // Trigger Export
      fireEvent.click(screen.getByTestId('export-full-data-btn'));

      await waitFor(() => {
        expect(onExportMock).toHaveBeenCalled();
      });

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();

      // Verify Success Message
      expect(await screen.findByTestId('backup-export-success')).toBeDefined();

      clickSpy.mockRestore();
    });

    it('hides export button for EDUCATOR and shows guardian-only notice', () => {
      render(
        <AuthProvider role="EDUCATOR">
          <DataBackupCard
            onExportPackage={vi.fn()}
            exportJobs={[]}
          />
        </AuthProvider>
      );

      expect(screen.queryByTestId('export-full-data-btn')).toBeNull();
      expect(screen.getByText(/Apenas responsáveis podem exportar o pacote integral de dados/i)).toBeDefined();
    });
  });

  describe('NotificationBell', () => {
    it('displays badge count, dropdown list with notifications, and mark-as-read triggers', async () => {
      const onMarkAsReadMock = vi.fn().mockResolvedValue(undefined);
      const onMarkAllAsReadMock = vi.fn().mockResolvedValue(undefined);

      render(
        <NotificationBell
          notifications={mockNotifications}
          unreadCount={2}
          onMarkAsRead={onMarkAsReadMock}
          onMarkAllAsRead={onMarkAllAsReadMock}
        />
      );

      // Verify Badge Count rendered
      const badge = screen.getByTestId('notification-badge');
      expect(badge.textContent).toBe('2');

      // Dropdown should initially be closed
      expect(screen.queryByTestId('notification-dropdown')).toBeNull();

      // Click Bell to open dropdown
      fireEvent.click(screen.getByTestId('notification-bell-btn'));
      expect(screen.getByTestId('notification-dropdown')).toBeDefined();

      // Verify Notification Items
      expect(screen.getByTestId('notification-item-notif-1')).toBeDefined();
      expect(screen.getByText('Hora do Devocional Familiar')).toBeDefined();
      expect(screen.getByTestId('notification-item-notif-2')).toBeDefined();
      expect(screen.getByText('Frequência do Dia Pendente')).toBeDefined();
      expect(screen.getByTestId('notification-item-notif-3')).toBeDefined();

      // Click single mark as read
      const markBtn1 = screen.getByTestId('mark-read-btn-notif-1');
      fireEvent.click(markBtn1);

      await waitFor(() => {
        expect(onMarkAsReadMock).toHaveBeenCalledWith('notif-1');
      });

      // Click mark all as read
      const markAllBtn = screen.getByTestId('mark-all-read-btn');
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(onMarkAllAsReadMock).toHaveBeenCalled();
      });
    });

    it('renders empty notification state properly when notifications list is empty', () => {
      const onMarkAsReadMock = vi.fn().mockResolvedValue(undefined);

      render(
        <NotificationBell
          notifications={[]}
          unreadCount={0}
          onMarkAsRead={onMarkAsReadMock}
        />
      );

      // No badge when unreadCount is 0
      expect(screen.queryByTestId('notification-badge')).toBeNull();

      // Open dropdown
      fireEvent.click(screen.getByTestId('notification-bell-btn'));
      expect(screen.getByTestId('notifications-empty')).toBeDefined();
      expect(screen.getByText(/Nenhuma notificação no momento/i)).toBeDefined();
    });
  });
});
