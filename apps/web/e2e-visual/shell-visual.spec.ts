import { test, expect } from '@playwright/test';

// Visual-regression coverage for the shell (issue #24): the dashboard and
// settings pages, each authenticated via mocked routes so the screenshot is
// deterministic and never depends on a real backend. Runs only against the
// shell-visual-{1440,1024,390} projects in playwright.config.ts.

const userId = '11111111-1111-4111-a111-111111111111';
const familyId = '22222222-2222-4222-a222-222222222222';
const learnerId = '33333333-3333-4333-a333-333333333333';

async function mockAuthenticatedFamily(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: userId,
        email: 'guardian@aletheia.edu',
        fullName: 'Guardiã Visual',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  await page.route('**/api/v1/families/mine', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: familyId,
          name: 'Família Visual',
          countryCode: 'BRA',
          stateProvince: 'SP',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          members: [
            { id: 'member-1', familyId, userId, role: 'OWNER_GUARDIAN', createdAt: '2026-01-01T00:00:00.000Z' },
          ],
        },
      ],
    });
  });

  await page.route(`**/api/v1/families/${familyId}/learners**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: learnerId,
          familyId,
          firstName: 'Educando',
          lastName: 'Visual',
          preferredName: 'Educando Visual',
          birthDate: '2018-05-15',
          stage: 'PRIMARY_GRAMMAR',
          customGrade: null,
          avatarColor: '#3B82F6',
          specialNeeds: null,
          notes: null,
          archivedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  await page.route(`**/api/v1/families/${familyId}/dashboard**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        date: '2026-01-05',
        family: { id: familyId, name: 'Família Visual' },
        learners: [{ id: learnerId, displayName: 'Educando Visual' }],
        activeLearnerId: learnerId,
        journey: { completedMinutes: 45, targetMinutes: 180, completedLessons: 1, totalLessons: 2, daySequence: 1 },
        activities: [
          {
            id: 'lesson-1',
            title: 'Gramática Latina: Primeira Declinação',
            subjectName: 'Latim',
            scheduledTime: '09:00',
            durationMinutes: 45,
            completed: true,
            type: 'lesson',
          },
        ],
      },
    });
  });

  await page.route(`**/api/v1/families/${familyId}/notifications`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/notifications/unread-count`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: { count: 0 } });
  });
  await page.route(`**/api/v1/families/${familyId}/settings`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: 'settings-1',
        familyId,
        homeschoolName: 'Academia Visual',
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
      },
    });
  });
  await page.route(`**/api/v1/families/${familyId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        id: familyId,
        name: 'Família Visual',
        countryCode: 'BRA',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        members: [
          { id: 'member-1', familyId, userId, role: 'OWNER_GUARDIAN', createdAt: '2026-01-01T00:00:00.000Z' },
        ],
      },
    });
  });
  await page.route(`**/api/v1/families/${familyId}/invitations`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/export`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route('**/api/v1/auth/audit-log', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });

  await page.addInitScript((id) => {
    window.localStorage.setItem('familyId', id);
  }, familyId);
}

test.describe('Shell visual regression', () => {
  test('dashboard shell', async ({ page }) => {
    await mockAuthenticatedFamily(page);
    await page.goto('/');
    await expect(page.getByTestId('dashboard-content')).toBeVisible();
    await expect(page).toHaveScreenshot('dashboard-shell.png', { fullPage: true });
  });

  test('settings shell', async ({ page }) => {
    await mockAuthenticatedFamily(page);
    await page.goto('/settings');
    await expect(page.getByTestId('tab-general-settings')).toBeVisible();
    await expect(page).toHaveScreenshot('settings-shell.png', { fullPage: true });
  });
});
