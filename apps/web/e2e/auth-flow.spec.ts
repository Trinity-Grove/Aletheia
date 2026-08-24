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

  test('navigates to /onboarding and creates family aggregate', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByTestId('onboarding-page')).toBeVisible();
    await page.getByTestId('family-name-input').fill('Família Santos');
    await page.getByTestId('create-family-button').click();
    await expect(page.getByTestId('success-message')).toBeVisible();
  });
});
