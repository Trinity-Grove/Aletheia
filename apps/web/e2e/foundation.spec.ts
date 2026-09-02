import { expect, test } from '@playwright/test';

test('redirects an anonymous visitor away from the home route to /login with a return path', async ({ page }) => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { statusCode: 401, message: 'Missing session cookie or Authorization header.' } });
  });

  await page.goto('/');

  await expect(page).toHaveURL(/\/login\?redirect=%2F$/);
  await expect(page.getByTestId('login-form')).toBeVisible();
});
