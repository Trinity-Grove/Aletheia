import { test, expect } from '@playwright/test';

test.describe('Real Family MVP End-to-End Journey', () => {
  test('executes complete journey from registration to learner setup, dashboard and activity completion', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const email = `guardian_${timestamp}@example.com`;
    const password = 'Password123!';
    const fullName = 'Guardião Real E2E';
    const familyName = `Família Real ${timestamp}`;
    const learnerName = `Educando ${timestamp}`;

    const userId = '11111111-1111-4111-a111-111111111111';
    const familyId = '22222222-2222-4222-a222-222222222222';
    const learnerId = '33333333-3333-4333-a333-333333333333';
    const lessonId = '44444444-4444-4444-a444-444444444444';

    let isLessonCompleted = false;
    let isLearnerCreated = false;

    // Set up hermetic API route mocks
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          accessToken: 'mock-jwt-token-123',
          user: {
            id: userId,
            email,
            fullName,
            createdAt: new Date().toISOString(),
          },
        },
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          id: userId,
          email,
          fullName,
          createdAt: new Date().toISOString(),
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
            name: familyName,
            countryCode: 'BRA',
            stateProvince: 'SP',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            members: [
              {
                id: '55555555-5555-4555-a555-555555555555',
                familyId,
                userId,
                role: 'OWNER_GUARDIAN',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ],
      });
    });

    await page.route('**/api/v1/families', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          json: {
            id: familyId,
            name: familyName,
            countryCode: 'BRA',
            stateProvince: 'SP',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            members: [
              {
                id: '55555555-5555-4555-a555-555555555555',
                familyId,
                userId,
                role: 'OWNER_GUARDIAN',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        });
      } else {
        await route.fallback();
      }
    });

    await page.route(`**/api/v1/families/${familyId}/learners**`, async (route) => {
      if (route.request().method() === 'POST') {
        isLearnerCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          json: {
            id: learnerId,
            familyId,
            firstName: learnerName,
            lastName: null,
            preferredName: learnerName,
            birthDate: '2018-05-15',
            stage: 'PRIMARY_GRAMMAR',
            customGrade: null,
            avatarColor: '#3B82F6',
            specialNeeds: null,
            notes: null,
            archivedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: isLearnerCreated
            ? [
                {
                  id: learnerId,
                  familyId,
                  firstName: learnerName,
                  lastName: null,
                  preferredName: learnerName,
                  birthDate: '2018-05-15',
                  stage: 'PRIMARY_GRAMMAR',
                  customGrade: null,
                  avatarColor: '#3B82F6',
                  specialNeeds: null,
                  notes: null,
                  archivedAt: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]
            : [],
        });
      }
    });

    await page.route(`**/api/v1/families/${familyId}/dashboard**`, async (route) => {
      const today = new Date().toISOString().split('T')[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          date: today,
          family: {
            id: familyId,
            name: familyName,
          },
          learners: [
            {
              id: learnerId,
              displayName: learnerName,
            },
          ],
          activeLearnerId: learnerId,
          journey: {
            completedMinutes: isLessonCompleted ? 45 : 0,
            targetMinutes: 180,
            completedLessons: isLessonCompleted ? 1 : 0,
            totalLessons: 1,
            daySequence: 1,
          },
          activities: [
            {
              id: lessonId,
              title: 'Gramática Latina: Primeira Declinação',
              subjectName: 'Latim',
              scheduledTime: '09:00',
              durationMinutes: 45,
              completed: isLessonCompleted,
              type: 'lesson',
            },
          ],
        },
      });
    });

    await page.route(`**/api/v1/families/${familyId}/lessons/${lessonId}/complete`, async (route) => {
      isLessonCompleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          id: lessonId,
          completedAt: new Date().toISOString(),
        },
      });
    });

    // 1. User Registration
    await page.goto('/register');
    await expect(page.getByTestId('register-form')).toBeVisible();
    await page.getByTestId('reg-name-input').fill(fullName);
    await page.getByTestId('reg-email-input').fill(email);
    await page.getByTestId('reg-password-input').fill(password);
    await page.getByTestId('reg-confirm-password-input').fill(password);
    await page.getByTestId('register-button').click();

    // 2. Onboarding Family Setup
    await expect(page).toHaveURL(/.*onboarding/);
    await expect(page.getByTestId('onboarding-page')).toBeVisible();
    await page.getByTestId('family-name-input').fill(familyName);
    await page.getByTestId('state-input').fill('SP');
    await page.getByTestId('create-family-button').click();

    // 3. Learner Setup
    await expect(page).toHaveURL(/.*learners/);
    await expect(page.getByTestId('add-learner-btn')).toBeVisible();
    await page.getByTestId('add-learner-btn').click();
    await expect(page.getByTestId('learner-first-name-input')).toBeVisible();
    await page.getByTestId('learner-first-name-input').fill(learnerName);
    await page.getByTestId('learner-birth-date-input').fill('2018-05-15');
    await page.getByTestId('learner-submit-btn').click();
    await expect(page.getByText(learnerName)).toBeVisible();

    // 4. Dashboard View
    await page.goto('/');
    await expect(page.getByTestId('appshell-sidebar')).toContainText('Aletheia');
    await expect(page.getByTestId('appshell-user-profile')).toContainText(fullName);
    await expect(page.getByTestId('dashboard-content')).toBeVisible();
    await expect(page.getByTestId('learner-focus-header')).toContainText(learnerName);
    await expect(page.getByText('Gramática Latina: Primeira Declinação')).toBeVisible();

    // 5. Complete Activity Check
    const toggleButton = page.getByTestId(`toggle-activity-${lessonId}`);
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Verify activity becomes completed
    await expect(page.getByTestId(`activity-item-${lessonId}`)).toHaveClass(/ui-activity-item--completed/);

    // 6. Zero fabricated data check
    await expect(page.getByText(/alunos ativos|progresso médio/i)).toHaveCount(0);
  });
});
