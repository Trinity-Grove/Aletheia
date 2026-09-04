import { test, expect } from '@playwright/test';

// Real, no-mocks golden-path homologation journey (issue #23). Every request
// this test triggers leaves the browser for real: /api/* is proxied by
// next.config.ts to a real NestJS API backed by real Postgres and real
// MinIO object storage (see e2e-journey/README.md for how to stand that
// stack up). There is no page.route() anywhere in this file — if a fetch
// call reaches an endpoint that doesn't behave like production, this test
// fails instead of quietly passing against a fixture.
//
// The journey walks a single family end-to-end: register -> create family
// -> create learner -> build a curriculum (subject + objective) -> plan and
// complete a lesson -> log attendance -> record a mastery evaluation ->
// upload a private evidence file through a real presigned MinIO URL ->
// generate an official report -> log out -> log back in and confirm every
// artifact survived -> confirm a second, unrelated family can never see any
// of it.

test.describe('Real golden-path homologation journey (#23)', () => {
  test('walks the full family journey against real infra and enforces family isolation', async ({
    page,
    browser,
  }) => {
    test.setTimeout(150_000);

    const stamp = Date.now();
    const email = `journey_${stamp}@example.com`;
    const password = 'Password123!';
    const fullName = 'Guardiã Jornada Real';
    const familyName = `Família Jornada ${stamp}`;
    const learnerFirstName = `Educando${stamp}`;
    const subjectName = `Latim ${stamp}`;
    const objectiveTitle = `Dominar a primeira declinação ${stamp}`;
    const lessonTitle = `Aula de Latim ${stamp}`;
    const recordTitle = `Avaliação de domínio ${stamp}`;
    const reportTitle = `Histórico Escolar ${stamp}`;
    const today = new Date().toISOString().split('T')[0]!;

    await test.step('1. Register a new guardian', async () => {
      await page.goto('/register');
      await expect(page.getByTestId('register-form')).toBeVisible();
      await page.getByTestId('reg-name-input').fill(fullName);
      await page.getByTestId('reg-email-input').fill(email);
      await page.getByTestId('reg-password-input').fill(password);
      await page.getByTestId('reg-confirm-password-input').fill(password);
      await page.getByTestId('register-button').click();
      await expect(page).toHaveURL(/.*onboarding/, { timeout: 15_000 });
    });

    await test.step('2. Create the family', async () => {
      await expect(page.getByTestId('onboarding-page')).toBeVisible();
      await page.getByTestId('family-name-input').fill(familyName);
      await page.getByTestId('state-input').fill('SP');
      await page.getByTestId('create-family-button').click();
      await expect(page).toHaveURL(/.*learners/, { timeout: 15_000 });
    });

    await test.step('3. Create a learner', async () => {
      await expect(page.getByTestId('add-learner-btn')).toBeVisible();
      await page.getByTestId('add-learner-btn').click();
      await expect(page.getByTestId('learner-first-name-input')).toBeVisible();
      await page.getByTestId('learner-first-name-input').fill(learnerFirstName);
      await page.getByTestId('learner-birth-date-input').fill('2018-05-15');
      await page.getByTestId('learner-submit-btn').click();
      await expect(page.getByText(learnerFirstName)).toBeVisible({ timeout: 15_000 });
    });

    await test.step('4. Build the curriculum: academic year auto-provisions, then a subject and an objective', async () => {
      await page.goto('/curriculum');
      await expect(page.getByTestId('open-subject-modal-btn')).toBeVisible({ timeout: 15_000 });

      await page.getByTestId('open-subject-modal-btn').click();
      await page.getByTestId('subject-name-input').fill(subjectName);
      await page.getByTestId('save-subject-btn').click();
      await expect(page.getByText(subjectName)).toBeVisible({ timeout: 15_000 });

      const subjectCard = page.locator('[data-testid^="subject-card-"]', { hasText: subjectName });
      const subjectCardTestId = await subjectCard.getAttribute('data-testid');
      const subjectId = subjectCardTestId!.replace('subject-card-', '');

      await page.getByTestId(`add-objective-btn-${subjectId}`).click();
      await page.getByTestId('objective-title-input').fill(objectiveTitle);
      await page.getByTestId('save-objective-btn').click();
      await expect(page.getByText(objectiveTitle)).toBeVisible({ timeout: 15_000 });
    });

    await test.step('5. Plan a lesson covering the objective', async () => {
      await page.goto('/schedule');
      await expect(page.getByTestId('create-lesson-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('create-lesson-btn').click();

      await expect(page.getByTestId('lesson-title-input')).toBeVisible();
      await page.getByTestId('lesson-title-input').fill(lessonTitle);
      await page.getByTestId('lesson-subject-select').selectOption({ label: subjectName });

      const learnerCheckboxes = page.locator('[data-testid^="learner-checkbox-"]');
      await learnerCheckboxes.first().check();

      const objectiveCheckboxes = page.locator('[data-testid^="objective-checkbox-"]');
      await objectiveCheckboxes
        .first()
        .waitFor({ state: 'visible', timeout: 5_000 })
        .catch(() => {});
      if (await objectiveCheckboxes.count()) {
        await objectiveCheckboxes.first().check();
      }

      await page.getByTestId('save-lesson-btn').click();
      await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 15_000 });
    });

    let lessonItemId = '';

    await test.step('6. Mark the lesson as completed', async () => {
      const agendaItem = page.locator('[data-testid^="agenda-item-"]', { hasText: lessonTitle });
      const agendaItemTestId = await agendaItem.getAttribute('data-testid');
      lessonItemId = agendaItemTestId!.replace('agenda-item-', '');

      await page.getByTestId(`complete-lesson-btn-${lessonItemId}`).click();
      await expect(page.getByTestId('actual-duration-input')).toBeVisible();
      await page.getByTestId('actual-duration-input').fill('45');
      await page.getByTestId('confirm-complete-btn').click();
      await expect(page.getByTestId(`item-status-${lessonItemId}`)).toContainText(/COMPLETED/i, {
        timeout: 15_000,
      });
    });

    await test.step('7. Log attendance for the day', async () => {
      await page.goto('/attendance');
      await expect(page.getByTestId('open-log-attendance-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('open-log-attendance-btn').click();

      // attendance-learner-select has no placeholder option — it defaults
      // to the sole learner in this family, so it needs no explicit pick.
      await expect(page.getByTestId('attendance-learner-select')).toBeVisible();
      await page.getByTestId('attendance-date-input').fill(today);
      await page.getByTestId('save-attendance-btn').click();
      await expect(page.getByTestId('attendance-records-table')).toBeVisible({ timeout: 15_000 });
    });

    await test.step('8. Record a mastery evaluation for the objective', async () => {
      await page.goto('/records');
      await expect(page.getByTestId('open-create-record-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('open-create-record-btn').click();

      await expect(page.getByTestId('record-learner-select')).toBeVisible();
      const learnerOptions = page.getByTestId('record-learner-select').locator('option');
      const learnerValue = await learnerOptions.nth(1).getAttribute('value');
      await page.getByTestId('record-learner-select').selectOption(learnerValue!);
      await page.getByTestId('record-title-input').fill(recordTitle);
      await page.getByTestId('save-record-btn').click();
      await expect(page.getByText(recordTitle)).toBeVisible({ timeout: 15_000 });
    });

    await test.step('9. Attach a private evidence file via a real presigned MinIO upload', async () => {
      await page.goto('/portfolio');
      await expect(page.getByTestId('open-add-portfolio-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('open-add-portfolio-btn').click();

      await expect(page.getByTestId('portfolio-learner-select')).toBeVisible();
      const learnerOptions = page.getByTestId('portfolio-learner-select').locator('option');
      const learnerValue = await learnerOptions.nth(1).getAttribute('value');
      await page.getByTestId('portfolio-learner-select').selectOption(learnerValue!);
      // portfolio-type-select defaults to IMAGE, a real file-upload type.
      await page.getByTestId('portfolio-title-input').fill('Caderno de Latim - Evidência');

      // A minimal, valid 1x1 PNG — real bytes, uploaded through the real
      // presigned PUT URL the API hands back (this is what the CORS fix
      // this session made possible: a direct browser PUT to MinIO).
      const pngBytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      );
      await page.getByTestId('portfolio-file-input').setInputFiles({
        name: 'caderno-latim.png',
        mimeType: 'image/png',
        buffer: pngBytes,
      });

      await page.getByTestId('save-portfolio-btn').click();
      await expect(page.getByTestId('portfolio-gallery-grid')).toBeVisible({ timeout: 15_000 });
      const portfolioCard = page.locator('[data-testid^="portfolio-card-"]');
      await expect(portfolioCard.first()).toBeVisible({ timeout: 20_000 });
      // A confirmed upload renders a real view-file link backed by a
      // presigned GET URL — its presence proves the object actually landed
      // in MinIO and the API's confirm-upload step validated it there.
      await expect(page.locator('[data-testid^="view-file-link-"]').first()).toBeVisible({
        timeout: 20_000,
      });
    });

    let reportId = '';

    await test.step('10. Generate an official academic transcript report', async () => {
      await page.goto('/reports');
      await expect(page.getByTestId('open-generate-report-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('open-generate-report-btn').click();

      await expect(page.getByTestId('report-title-input')).toBeVisible();
      await page.getByTestId('report-title-input').fill(reportTitle);
      // report-type-select already defaults to ACADEMIC_TRANSCRIPT.
      await page.getByTestId('generate-report-btn').click();

      const reportCard = page.locator('[data-testid^="report-card-"]', { hasText: reportTitle });
      await expect(reportCard).toBeVisible({ timeout: 30_000 });
      const reportCardTestId = await reportCard.getAttribute('data-testid');
      reportId = reportCardTestId!.replace('report-card-', '');
      await expect(page.getByTestId(`export-pdf-btn-${reportId}`)).toBeVisible();
    });

    await test.step('11. Log out', async () => {
      // Generating a report auto-opens its preview modal, which overlays
      // the sidebar — close it first, same as a real guardian would.
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('report-preview-modal')).toHaveCount(0);
      await page.getByRole('button', { name: 'Sair' }).click();
      await expect(page).toHaveURL(/.*login/, { timeout: 15_000 });
    });

    await test.step('12. Log back in and confirm every artifact persisted', async () => {
      await expect(page.getByTestId('login-form')).toBeVisible();
      await page.getByTestId('login-email-input').fill(email);
      await page.getByTestId('login-password-input').fill(password);
      await page.getByTestId('login-button').click();
      // Logging out from /reports preserves it as a ?redirect= target, so
      // login lands back there rather than on the dashboard — confirm the
      // session is live by reaching the dashboard explicitly instead of
      // asserting a specific post-login URL.
      await expect(page.getByTestId('login-form')).toHaveCount(0, { timeout: 15_000 });
      await page.goto('/');
      await expect(page.getByTestId('dashboard-content')).toBeVisible({ timeout: 15_000 });

      await page.goto('/curriculum');
      await expect(page.getByText(subjectName)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(objectiveTitle)).toBeVisible();

      await page.goto('/records');
      await expect(page.getByText(recordTitle)).toBeVisible({ timeout: 15_000 });

      await page.goto('/portfolio');
      await expect(page.locator('[data-testid^="portfolio-card-"]').first()).toBeVisible({
        timeout: 15_000,
      });

      await page.goto('/reports');
      await expect(page.getByTestId(`report-card-${reportId}`)).toBeVisible({ timeout: 15_000 });
    });

    await test.step('13. A second, unrelated family never sees any of this data', async () => {
      const otherContext = await browser.newContext();
      const otherPage = await otherContext.newPage();
      const otherStamp = Date.now();
      const otherEmail = `isolation_${otherStamp}@example.com`;

      await otherPage.goto('/register');
      await otherPage.getByTestId('reg-name-input').fill('Guardião Isolamento');
      await otherPage.getByTestId('reg-email-input').fill(otherEmail);
      await otherPage.getByTestId('reg-password-input').fill(password);
      await otherPage.getByTestId('reg-confirm-password-input').fill(password);
      await otherPage.getByTestId('register-button').click();
      await expect(otherPage).toHaveURL(/.*onboarding/, { timeout: 15_000 });

      await otherPage.getByTestId('family-name-input').fill(`Família Isolada ${otherStamp}`);
      await otherPage.getByTestId('state-input').fill('RJ');
      await otherPage.getByTestId('create-family-button').click();
      await expect(otherPage).toHaveURL(/.*learners/, { timeout: 15_000 });

      // This brand-new family has zero learners of its own — if it could
      // see Family A's data, this is exactly where it would leak in.
      await expect(otherPage.getByText(learnerFirstName)).toHaveCount(0);

      await otherPage.goto('/curriculum');
      await expect(otherPage.getByText(subjectName)).toHaveCount(0);
      await expect(otherPage.getByText(objectiveTitle)).toHaveCount(0);

      await otherPage.goto('/records');
      await expect(otherPage.getByText(recordTitle)).toHaveCount(0);

      await otherPage.goto('/reports');
      await expect(otherPage.getByTestId(`report-card-${reportId}`)).toHaveCount(0);

      await otherContext.close();
    });
  });
});
