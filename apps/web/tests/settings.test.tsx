import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  AccountAuditLogEntryDto,
  FamilyDataExportPackageDto,
  FamilyInvitationDto,
  FamilyMemberDto,
  FamilySettingsResponseDto,
  NotificationItemResponseDto,
} from '@aletheia/contracts';
import { FamilyGeneralSettings } from '../src/components/settings/family-general-settings';
import { FamilyMembersSettings } from '../src/components/settings/family-members-settings';
import { NotificationPreferences } from '../src/components/settings/notification-preferences';
import { DataBackupCard } from '../src/components/settings/data-backup-card';
import { AccountSecuritySettings } from '../src/components/settings/account-security-settings';
import { AccountActivityLog } from '../src/components/settings/account-activity-log';
import { NotificationBell } from '../src/components/layout/notification-bell';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { api } from '../src/lib/api';
import QRCode from 'qrcode';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn() },
}));

const mockQrToDataURL = QRCode.toDataURL as ReturnType<typeof vi.fn>;

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

  describe('AccountSecuritySettings', () => {
    it('validates and submits a password change, showing success feedback', async () => {
      const onChangePassword = vi.fn().mockResolvedValue(undefined);
      const onChangeEmail = vi.fn();

      render(
        <AccountSecuritySettings
          currentEmail="guardian@aletheia.edu"
          onChangePassword={onChangePassword}
          onChangeEmail={onChangeEmail}
        />,
      );

      fireEvent.click(screen.getByTestId('change-password-button'));
      expect(screen.getByTestId('change-password-error')).toHaveTextContent(
        'Por favor, preencha todos os campos obrigatórios.',
      );
      expect(onChangePassword).not.toHaveBeenCalled();

      fireEvent.change(screen.getByTestId('current-password-for-pw-input'), {
        target: { value: 'oldPassword123' },
      });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'short' } });
      fireEvent.change(screen.getByTestId('confirm-new-password-input'), { target: { value: 'short' } });
      fireEvent.click(screen.getByTestId('change-password-button'));
      expect(screen.getByTestId('change-password-error')).toHaveTextContent(
        'A nova senha deve conter no mínimo 8 caracteres.',
      );

      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'newPassword456' } });
      fireEvent.change(screen.getByTestId('confirm-new-password-input'), { target: { value: 'mismatch456' } });
      fireEvent.click(screen.getByTestId('change-password-button'));
      expect(screen.getByTestId('change-password-error')).toHaveTextContent('As senhas não conferem.');

      fireEvent.change(screen.getByTestId('confirm-new-password-input'), { target: { value: 'newPassword456' } });
      fireEvent.click(screen.getByTestId('change-password-button'));

      await waitFor(() => {
        expect(onChangePassword).toHaveBeenCalledWith({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword456',
        });
      });
      expect(await screen.findByTestId('change-password-success')).toBeDefined();
    });

    it('shows an error when the password change fails', async () => {
      const onChangePassword = vi.fn().mockRejectedValue(new Error('Senha atual incorreta.'));

      render(
        <AccountSecuritySettings
          currentEmail="guardian@aletheia.edu"
          onChangePassword={onChangePassword}
          onChangeEmail={vi.fn()}
        />,
      );

      fireEvent.change(screen.getByTestId('current-password-for-pw-input'), { target: { value: 'wrong' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'newPassword456' } });
      fireEvent.change(screen.getByTestId('confirm-new-password-input'), { target: { value: 'newPassword456' } });
      fireEvent.click(screen.getByTestId('change-password-button'));

      expect(await screen.findByTestId('change-password-error')).toHaveTextContent('Senha atual incorreta.');
    });

    it('validates and submits an email change, showing success feedback', async () => {
      const onChangeEmail = vi.fn().mockResolvedValue(undefined);

      render(
        <AccountSecuritySettings
          currentEmail="guardian@aletheia.edu"
          onChangePassword={vi.fn()}
          onChangeEmail={onChangeEmail}
        />,
      );

      expect(screen.getByTestId('change-email-card')).toHaveTextContent('guardian@aletheia.edu');

      fireEvent.click(screen.getByTestId('change-email-button'));
      expect(screen.getByTestId('change-email-error')).toHaveTextContent(
        'Por favor, preencha todos os campos obrigatórios.',
      );

      fireEvent.change(screen.getByTestId('current-password-for-email-input'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByTestId('new-email-input'), { target: { value: 'new@aletheia.edu' } });
      fireEvent.click(screen.getByTestId('change-email-button'));

      await waitFor(() => {
        expect(onChangeEmail).toHaveBeenCalledWith({
          currentPassword: 'password123',
          newEmail: 'new@aletheia.edu',
        });
      });
      expect(await screen.findByTestId('change-email-success')).toBeDefined();
    });

    it('shows an error when the email change fails', async () => {
      const onChangeEmail = vi.fn().mockRejectedValue(new Error('E-mail já está em uso.'));

      render(
        <AccountSecuritySettings
          onChangePassword={vi.fn()}
          onChangeEmail={onChangeEmail}
        />,
      );

      fireEvent.change(screen.getByTestId('current-password-for-email-input'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByTestId('new-email-input'), { target: { value: 'taken@aletheia.edu' } });
      fireEvent.click(screen.getByTestId('change-email-button'));

      expect(await screen.findByTestId('change-email-error')).toHaveTextContent('E-mail já está em uso.');
    });
  });

  describe('AccountSecuritySettings MFA (two-factor authentication)', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      mockQrToDataURL.mockImplementation(
        (_text: unknown, _opts: unknown, cb: (err: null, url: string) => void) => {
          cb(null, 'data:image/png;base64,FAKE');
        },
      );
    });

    const mockSetupResponse = {
      otpauthUri: 'otpauth://totp/Aletheia:guardian@aletheia.edu?secret=MOCKSECRET&issuer=Aletheia',
      recoveryCodes: [
        'ABCD-EFGH',
        'WXYZ-2345',
        'ABCD-2345',
        'WXYZ-EFGH',
        'ABCD-5678',
        'WXYZ-9012',
        'ABCD-1234',
        'WXYZ-3456',
        'ABCD-7890',
        'WXYZ-0123',
      ],
    };

    it('enables 2FA through password confirm, QR + recovery codes, then code confirm', async () => {
      const onMfaStateChanged = vi.fn().mockResolvedValue(undefined);
      const postSpy = vi
        .spyOn(api, 'post')
        .mockResolvedValueOnce(mockSetupResponse)
        .mockResolvedValueOnce(undefined);

      render(
        <AccountSecuritySettings
          currentEmail="guardian@aletheia.edu"
          mfaEnabled={false}
          onChangePassword={vi.fn()}
          onChangeEmail={vi.fn()}
          onMfaStateChanged={onMfaStateChanged}
        />,
      );

      expect(screen.getByTestId('mfa-status')).toHaveTextContent('Desativado');

      fireEvent.click(screen.getByTestId('mfa-enable-button'));
      fireEvent.change(screen.getByTestId('mfa-setup-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('mfa-setup-submit-button'));

      expect(await screen.findByTestId('mfa-qr-image')).toHaveAttribute(
        'src',
        'data:image/png;base64,FAKE',
      );
      expect(screen.getByTestId('mfa-recovery-codes')).toHaveTextContent('ABCD-EFGH');

      fireEvent.change(screen.getByTestId('mfa-confirm-code-input'), { target: { value: '123456' } });
      fireEvent.click(screen.getByTestId('mfa-confirm-button'));

      await waitFor(() => {
        expect(postSpy).toHaveBeenNthCalledWith(1, '/auth/mfa/setup', { password: 'password123' });
        expect(postSpy).toHaveBeenNthCalledWith(2, '/auth/mfa/confirm', { code: '123456' });
      });
      await waitFor(() => expect(onMfaStateChanged).toHaveBeenCalled());
      expect(await screen.findByTestId('mfa-success')).toBeDefined();
    });

    it('shows the recovery codes and an error when the confirmation code is rejected', async () => {
      const postSpy = vi
        .spyOn(api, 'post')
        .mockResolvedValueOnce(mockSetupResponse)
        .mockRejectedValueOnce(new Error('Código inválido.'));

      render(
        <AccountSecuritySettings
          currentEmail="guardian@aletheia.edu"
          onChangePassword={vi.fn()}
          onChangeEmail={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId('mfa-enable-button'));
      fireEvent.change(screen.getByTestId('mfa-setup-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('mfa-setup-submit-button'));

      await screen.findByTestId('mfa-confirm-code-input');
      expect(screen.getByTestId('mfa-recovery-codes').children.length).toBe(10);

      fireEvent.change(screen.getByTestId('mfa-confirm-code-input'), { target: { value: '000000' } });
      fireEvent.click(screen.getByTestId('mfa-confirm-button'));

      expect(await screen.findByTestId('mfa-confirm-error')).toHaveTextContent('Código inválido.');
      expect(postSpy).toHaveBeenCalledWith('/auth/mfa/confirm', { code: '000000' });
    });

    it('disables 2FA after confirming the current password', async () => {
      const onMfaStateChanged = vi.fn().mockResolvedValue(undefined);
      const postSpy = vi.spyOn(api, 'post').mockResolvedValue(undefined);

      render(
        <AccountSecuritySettings
          currentEmail="guardian@aletheia.edu"
          mfaEnabled
          onChangePassword={vi.fn()}
          onChangeEmail={vi.fn()}
          onMfaStateChanged={onMfaStateChanged}
        />,
      );

      expect(screen.getByTestId('mfa-status')).toHaveTextContent('Ativo');

      fireEvent.change(screen.getByTestId('mfa-disable-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('mfa-disable-button'));

      await waitFor(() =>
        expect(postSpy).toHaveBeenCalledWith('/auth/mfa/disable', { password: 'password123' }),
      );
      await waitFor(() => expect(onMfaStateChanged).toHaveBeenCalled());
      expect(await screen.findByTestId('mfa-success')).toBeDefined();
    });
  });

  describe('FamilyMembersSettings', () => {
    const mockMembers: FamilyMemberDto[] = [
      {
        id: 'member-1',
        familyId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        role: 'OWNER_GUARDIAN',
        user: {
          id: 'user-1',
          email: 'guardian@aletheia.edu',
          fullName: 'Jane Doe',
          emailVerified: true,
          mfaEnabled: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const mockInvitations: FamilyInvitationDto[] = [
      {
        id: 'invitation-1',
        familyId: '11111111-1111-1111-1111-111111111111',
        email: 'pending@aletheia.edu',
        role: 'EDUCATOR',
        invitedBy: 'user-1',
        expiresAt: '2026-02-01T00:00:00.000Z',
        createdAt: '2026-01-15T00:00:00.000Z',
      },
    ];

    it('renders members and pending invitations', () => {
      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyMembersSettings
            members={mockMembers}
            invitations={mockInvitations}
            onInvite={vi.fn()}
            onCancelInvitation={vi.fn()}
          />
        </AuthProvider>,
      );

      expect(screen.getByTestId('family-member-member-1')).toHaveTextContent('Jane Doe');
      expect(screen.getByTestId('pending-invitation-invitation-1')).toHaveTextContent('pending@aletheia.edu');
    });

    it('sends an invitation and shows success feedback', async () => {
      const onInvite = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyMembersSettings
            members={mockMembers}
            invitations={[]}
            onInvite={onInvite}
            onCancelInvitation={vi.fn()}
          />
        </AuthProvider>,
      );

      fireEvent.change(screen.getByTestId('invite-guardian-email-input'), {
        target: { value: 'new-guardian@aletheia.edu' },
      });
      fireEvent.change(screen.getByTestId('invite-guardian-role-select'), {
        target: { value: 'CO_GUARDIAN' },
      });
      fireEvent.click(screen.getByTestId('invite-guardian-submit-button'));

      await waitFor(() =>
        expect(onInvite).toHaveBeenCalledWith({ email: 'new-guardian@aletheia.edu', role: 'CO_GUARDIAN' }),
      );
      expect(await screen.findByTestId('invite-guardian-success')).toBeDefined();
    });

    it('shows an error when the invitation fails', async () => {
      const onInvite = vi.fn().mockRejectedValue(new Error('E-mail já convidado.'));

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyMembersSettings
            members={mockMembers}
            invitations={[]}
            onInvite={onInvite}
            onCancelInvitation={vi.fn()}
          />
        </AuthProvider>,
      );

      fireEvent.change(screen.getByTestId('invite-guardian-email-input'), {
        target: { value: 'dup@aletheia.edu' },
      });
      fireEvent.click(screen.getByTestId('invite-guardian-submit-button'));

      expect(await screen.findByTestId('invite-guardian-error')).toHaveTextContent('E-mail já convidado.');
    });

    it('cancels a pending invitation', async () => {
      const onCancelInvitation = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyMembersSettings
            members={mockMembers}
            invitations={mockInvitations}
            onInvite={vi.fn()}
            onCancelInvitation={onCancelInvitation}
          />
        </AuthProvider>,
      );

      fireEvent.click(screen.getByTestId('cancel-invitation-invitation-1'));

      await waitFor(() => expect(onCancelInvitation).toHaveBeenCalledWith('invitation-1'));
    });

    it('hides invite form and cancel action for EDUCATOR role', () => {
      render(
        <AuthProvider role="EDUCATOR">
          <FamilyMembersSettings
            members={mockMembers}
            invitations={mockInvitations}
            onInvite={vi.fn()}
            onCancelInvitation={vi.fn()}
          />
        </AuthProvider>,
      );

      expect(screen.queryByTestId('invite-guardian-card')).toBeNull();
      expect(screen.queryByTestId('cancel-invitation-invitation-1')).toBeNull();
    });
  });

  describe('AccountActivityLog', () => {
    const mockEntries: AccountAuditLogEntryDto[] = [
      { id: 'audit-1', eventType: 'LOGIN_SUCCEEDED', createdAt: '2026-08-30T10:00:00.000Z' },
      { id: 'audit-2', eventType: 'PASSWORD_CHANGED', createdAt: '2026-08-29T08:30:00.000Z' },
    ];

    it('shows a loading state, then renders entries with human-readable labels', async () => {
      let resolveFetch!: (value: AccountAuditLogEntryDto[]) => void;
      const fetchAuditLog = vi.fn(
        () => new Promise<AccountAuditLogEntryDto[]>((resolve) => { resolveFetch = resolve; }),
      );

      render(<AccountActivityLog fetchAuditLog={fetchAuditLog} />);

      expect(screen.getByTestId('account-activity-log-loading')).toBeInTheDocument();

      resolveFetch(mockEntries);

      await waitFor(() => {
        expect(screen.getByTestId('account-activity-item-audit-1')).toHaveTextContent('Login realizado');
      });
      expect(screen.getByTestId('account-activity-item-audit-2')).toHaveTextContent('Senha alterada');
      expect(screen.queryByTestId('account-activity-log-loading')).not.toBeInTheDocument();
    });

    it('shows an empty state when there are no entries', async () => {
      const fetchAuditLog = vi.fn().mockResolvedValue([]);

      render(<AccountActivityLog fetchAuditLog={fetchAuditLog} />);

      expect(await screen.findByText('Nenhuma atividade registrada')).toBeInTheDocument();
    });

    it('shows an error message when the fetch fails', async () => {
      const fetchAuditLog = vi.fn().mockRejectedValue(new Error('Falha de rede.'));

      render(<AccountActivityLog fetchAuditLog={fetchAuditLog} />);

      expect(await screen.findByTestId('account-activity-log-error')).toHaveTextContent('Falha de rede.');
    });
  });
});
