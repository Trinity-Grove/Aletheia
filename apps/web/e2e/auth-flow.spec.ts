import { test, expect } from '@playwright/test';

test.describe('Authentication & Onboarding Web Smoke Tests', () => {
  test('navigates to /login and verifies presence of login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('navigates to /register and verifies presence of registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByTestId('register-form')).toBeVisible();
    await expect(page.getByTestId('reg-name-input')).toBeVisible();
    await expect(page.getByTestId('reg-email-input')).toBeVisible();
    await expect(page.getByTestId('reg-password-input')).toBeVisible();
    await expect(page.getByTestId('reg-confirm-password-input')).toBeVisible();
  });

  test('navigates to /onboarding and creates family aggregate with authenticated session', async ({ page }) => {
    const mockUser = {
      id: '11111111-1111-4111-a111-111111111111',
      email: 'guardian@example.com',
      fullName: 'Guardião Silva',
      createdAt: '2026-08-30T00:00:00.000Z',
    };

    const mockCreatedFamily = {
      id: '22222222-2222-4222-a222-222222222222',
      name: 'Família Santos',
      countryCode: 'BRA',
      stateProvince: 'SP',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
      members: [
        {
          id: '55555555-5555-4555-a555-555555555555',
          familyId: '22222222-2222-4222-a222-222222222222',
          userId: '11111111-1111-4111-a111-111111111111',
          role: 'OWNER_GUARDIAN',
          createdAt: '2026-08-30T00:00:00.000Z',
        },
      ],
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ json: mockUser });
    });

    await page.route('**/api/v1/families/mine', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/v1/families', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: mockCreatedFamily });
      } else {
        await route.fallback();
      }
    });

    await page.addInitScript(() => {
      localStorage.setItem('aletheia_token', 'mock-valid-token');
      localStorage.setItem('token', 'mock-valid-token');
    });

    await page.goto('/onboarding');
    await expect(page.getByTestId('onboarding-page')).toBeVisible();

    await page.getByTestId('family-name-input').fill('Família Santos');
    await page.getByTestId('create-family-button').click();

    await expect(page).toHaveURL(/.*learners/);
  });

  test('navigates to /learners and opens learner creation modal with authenticated session', async ({ page }) => {
    const mockUser = {
      id: '11111111-1111-4111-a111-111111111111',
      email: 'guardian@example.com',
      fullName: 'Guardião Silva',
      createdAt: '2026-08-30T00:00:00.000Z',
    };

    const mockFamily = {
      id: '22222222-2222-4222-a222-222222222222',
      name: 'Família Santos',
      countryCode: 'BRA',
      stateProvince: 'SP',
      createdAt: '2026-08-30T00:00:00.000Z',
      updatedAt: '2026-08-30T00:00:00.000Z',
      members: [
        {
          id: '55555555-5555-4555-a555-555555555555',
          familyId: '22222222-2222-4222-a222-222222222222',
          userId: '11111111-1111-4111-a111-111111111111',
          role: 'OWNER_GUARDIAN',
          createdAt: '2026-08-30T00:00:00.000Z',
        },
      ],
    };

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ json: mockUser });
    });

    await page.route('**/api/v1/families/mine', async (route) => {
      await route.fulfill({ json: [mockFamily] });
    });

    await page.addInitScript(() => {
      localStorage.setItem('aletheia_token', 'mock-valid-token');
      localStorage.setItem('token', 'mock-valid-token');
      localStorage.setItem('aletheia_active_family_id', '22222222-2222-4222-a222-222222222222');
      localStorage.setItem('familyId', '22222222-2222-4222-a222-222222222222');
    });

    await page.goto('/learners');
    await expect(page.getByTestId('add-learner-btn')).toBeVisible();

    await page.getByTestId('add-learner-btn').click();
    await expect(page.getByTestId('learner-first-name-input')).toBeVisible();
    await expect(page.getByTestId('learner-birth-date-input')).toBeVisible();
    await expect(page.getByTestId('learner-submit-btn')).toBeVisible();
  });
});
