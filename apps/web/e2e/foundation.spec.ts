import { expect, test } from '@playwright/test';

test('family-facing shell loads without fabricated data', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('appshell-sidebar')).toContainText('Aletheia');
  await expect(
    page.getByRole('heading', {
      name: 'Faithful learning, thoughtfully guided.',
    }),
  ).toBeVisible();
  await expect(page.getByText(/alunos ativos|progresso médio/i)).toHaveCount(0);
});
