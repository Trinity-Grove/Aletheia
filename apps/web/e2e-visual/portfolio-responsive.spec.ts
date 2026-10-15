import { expect, test } from '@playwright/test';

const familyId = '22222222-2222-4222-a222-222222222222';
const learnerId = '33333333-3333-4333-a333-333333333333';
const userId = '11111111-1111-4111-a111-111111111111';

async function mockPortfolioPage(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { id: userId, email: 'guardian@example.com', fullName: 'Guardião Responsivo', createdAt: '2026-01-01T00:00:00.000Z' },
    });
  });
  await page.route('**/api/v1/families/mine', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [{ id: familyId, name: 'Família Responsiva', countryCode: 'BRA', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', members: [{ id: 'member-1', familyId, userId, role: 'OWNER_GUARDIAN', createdAt: '2026-01-01T00:00:00.000Z' }] }],
    });
  });
  await page.route(`**/api/v1/families/${familyId}/learners`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [{ id: learnerId, familyId, firstName: 'Sofia', preferredName: 'Sofi', stage: 'PRIMARY', avatarColor: '#3B82F6' }],
    });
  });
  await page.route(`**/api/v1/families/${familyId}/curriculum/subjects`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/records`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/curriculum/evidence-types/catalog`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/curriculum/evidence-submissions*`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/portfolio?*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        { id: 'image-1', familyId, learnerId, type: 'IMAGE', title: 'Desenho da Sofia', description: 'Um desenho', textContent: null, fileUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect width="320" height="180" fill="%23d8e8dc"/%3E%3C/svg%3E', mimeType: 'image/svg+xml', fileSizeBytes: 1024, tags: [], isHighlight: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'audio-1', familyId, learnerId, type: 'AUDIO', title: 'Leitura em voz alta', description: null, textContent: null, fileUrl: 'https://storage.example.com/audio-1.mp3', mimeType: 'audio/mpeg', fileSizeBytes: 2048, tags: [], isHighlight: false, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
        { id: 'video-1', familyId, learnerId, type: 'VIDEO', title: 'Experimento', description: null, textContent: null, fileUrl: 'https://storage.example.com/video-1.mp4', mimeType: 'video/mp4', fileSizeBytes: 4096, tags: [], isHighlight: false, createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' },
      ],
    });
  });
  await page.route(`**/api/v1/families/${familyId}/notifications`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
  });
  await page.route(`**/api/v1/families/${familyId}/notifications/unread-count`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', json: { count: 0 } });
  });
  await page.addInitScript((id) => {
    window.localStorage.setItem('familyId', id);
    window.localStorage.setItem('aletheia_locale', 'pt-BR');
  }, familyId);
}

test('portfolio gallery and media dialog remain usable at the configured responsive viewports', async ({ page }) => {
  await mockPortfolioPage(page);
  await page.goto('/portfolio');

  await expect(page.getByTestId('portfolio-gallery-grid')).toBeVisible();
  await expect(page.getByTestId('portfolio-card-image-1')).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const layout = await page.getByTestId('portfolio-gallery-grid').evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      columnCount: style.gridTemplateColumns.split(' ').filter(Boolean).length,
      rightEdge: rect.right,
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowingElements: Array.from(document.querySelectorAll<HTMLElement>('*'))
        .map((element) => ({ element, right: element.getBoundingClientRect().right }))
        .filter(({ right }) => right > document.documentElement.clientWidth + 1)
        .slice(0, 5)
        .map(({ element, right }) => ({ tag: element.tagName, className: element.className, right })),
    };
  });

  expect(layout.rightEdge).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.overflowingElements).toEqual([]);
  if (viewport!.width <= 390) expect(layout.columnCount).toBe(1);

  const previewTrigger = page.getByTestId('preview-media-btn-image-1');
  await previewTrigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Desenho da Sofia' })).toBeVisible();

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport!.width + 1);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(previewTrigger).toBeFocused();
});
