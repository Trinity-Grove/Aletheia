import { test, expect } from '@playwright/test';

// Real, no-mocks coverage of edit and delete across every domain — issue
// #21's "Playwright cobre criar, editar, listar e remover onde aplicável"
// criterion. golden-path.spec.ts already covers create+list end to end; this
// spec builds its own minimal fixture and focuses on the update/destroy half
// of each domain's lifecycle, against the same real Postgres + MinIO API.
//
// Every destructive action in this app gates on a native window.confirm() —
// accept every dialog up front so the flow reads the same as a guardian
// clicking "OK".
//
// Attendance intentionally has no edit/delete affordance in the UI (it's an
// append-only compliance log), so it is out of scope here — "onde
// aplicável" excludes it. Official reports are immutable once generated
// (no edit), so only their delete path is covered.

test.describe('Real CRUD edit/delete coverage (#21)', () => {
  test('edits and deletes across curriculum, learners, lessons, records, portfolio, and reports', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    page.on('dialog', (dialog) => dialog.accept());

    const stamp = Date.now();
    const email = `crud_${stamp}@example.com`;
    const password = 'Password123!';
    const fullName = 'Guardião CRUD Real';
    const familyName = `Família CRUD ${stamp}`;
    const learnerFirstName = `Educando${stamp}`;
    const subjectName = `Grego Koiné ${stamp}`;
    const subjectNameEdited = `Grego Koiné (Revisado) ${stamp}`;
    const objectiveTitle = `Ler o alfabeto grego ${stamp}`;
    const objectiveTitleEdited = `Ler e escrever o alfabeto grego ${stamp}`;
    const lessonTitle = `Aula de Grego ${stamp}`;
    const recordTitle = `Avaliação de grego ${stamp}`;
    const recordTitleEdited = `Avaliação de grego (revisada) ${stamp}`;
    const portfolioTitle = `Carta em grego ${stamp}`;
    const portfolioTitleEdited = `Carta em grego (revisada) ${stamp}`;
    const reportTitle = `Relatório CRUD ${stamp}`;

    await test.step('Setup: register, family, learner, subject, objective', async () => {
      await page.goto('/register');
      await page.getByTestId('reg-name-input').fill(fullName);
      await page.getByTestId('reg-email-input').fill(email);
      await page.getByTestId('reg-password-input').fill(password);
      await page.getByTestId('reg-confirm-password-input').fill(password);
      await page.getByTestId('register-button').click();
      await expect(page).toHaveURL(/.*onboarding/, { timeout: 15_000 });

      await page.getByTestId('family-name-input').fill(familyName);
      await page.getByTestId('state-input').fill('MG');
      await page.getByTestId('create-family-button').click();
      await expect(page).toHaveURL(/.*learners/, { timeout: 15_000 });

      await page.getByTestId('add-learner-btn').click();
      await page.getByTestId('learner-first-name-input').fill(learnerFirstName);
      await page.getByTestId('learner-birth-date-input').fill('2017-03-10');
      await page.getByTestId('learner-submit-btn').click();
      await expect(page.getByText(learnerFirstName)).toBeVisible({ timeout: 15_000 });

      await page.goto('/curriculum');
      await expect(page.getByTestId('open-subject-modal-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('open-subject-modal-btn').click();
      await page.getByTestId('subject-name-input').fill(subjectName);
      await page.getByTestId('save-subject-btn').click();
      await expect(page.getByText(subjectName)).toBeVisible({ timeout: 15_000 });
    });

    let subjectId = '';
    let objectiveId = '';

    await test.step('Curriculum: edit the subject, create + edit + delete the objective, then archive the subject', async () => {
      const subjectCard = page.locator('[data-testid^="subject-card-"]', { hasText: subjectName });
      subjectId = (await subjectCard.getAttribute('data-testid'))!.replace('subject-card-', '');

      // Edit subject
      await page.getByTestId(`edit-subject-btn-${subjectId}`).click();
      await expect(page.getByTestId('subject-name-input')).toHaveValue(subjectName);
      await page.getByTestId('subject-name-input').fill(subjectNameEdited);
      await page.getByTestId('save-subject-btn').click();
      await expect(page.getByText(subjectNameEdited)).toBeVisible({ timeout: 15_000 });

      // Create an objective to edit and delete
      await page.getByTestId(`add-objective-btn-${subjectId}`).click();
      await page.getByTestId('objective-title-input').fill(objectiveTitle);
      await page.getByTestId('save-objective-btn').click();
      await expect(page.getByText(objectiveTitle)).toBeVisible({ timeout: 15_000 });

      const objectiveItem = page.locator('[data-testid^="objective-item-"]', { hasText: objectiveTitle });
      objectiveId = (await objectiveItem.getAttribute('data-testid'))!.replace('objective-item-', '');

      // Edit objective
      await page.getByTestId(`edit-objective-btn-${objectiveId}`).click();
      await expect(page.getByTestId('objective-title-input')).toHaveValue(objectiveTitle);
      await page.getByTestId('objective-title-input').fill(objectiveTitleEdited);
      await page.getByTestId('save-objective-btn').click();
      await expect(page.getByText(objectiveTitleEdited)).toBeVisible({ timeout: 15_000 });

      // Delete objective (confirm auto-accepted)
      await page.getByTestId(`delete-objective-btn-${objectiveId}`).click();
      await expect(page.getByTestId(`objective-item-${objectiveId}`)).toHaveCount(0, { timeout: 15_000 });

      // Archive subject (confirm auto-accepted) — removes it from the active curriculum view
      await page.getByTestId(`archive-subject-btn-${subjectId}`).click();
      await expect(page.getByTestId(`subject-card-${subjectId}`)).toHaveCount(0, { timeout: 15_000 });
    });

    await test.step('Learners: edit the learner, then archive and reactivate', async () => {
      await page.goto('/learners');
      const learnerCard = page.locator('[data-testid^="learner-card-"]', { hasText: learnerFirstName });
      const learnerId = (await learnerCard.getAttribute('data-testid'))!.replace('learner-card-', '');

      await page.getByTestId(`edit-learner-btn-${learnerId}`).click();
      await expect(page.getByTestId('learner-first-name-input')).toHaveValue(learnerFirstName);
      await page.getByTestId('learner-first-name-input').fill(`${learnerFirstName}Editado`);
      await page.getByTestId('learner-submit-btn').click();
      await expect(page.getByText(`${learnerFirstName}Editado`)).toBeVisible({ timeout: 15_000 });

      // Archive moves the learner out of the active tab into the archived one
      await page.getByTestId(`archive-learner-btn-${learnerId}`).click();
      await expect(page.getByTestId(`learner-card-${learnerId}`)).toHaveCount(0, { timeout: 15_000 });
      await page.getByTestId('tab-archived-learners').click();
      await expect(page.getByTestId(`learner-card-${learnerId}`)).toBeVisible({ timeout: 15_000 });

      // Reactivate restores it to the active tab, needed for the rest of this journey
      await page.getByTestId(`archive-learner-btn-${learnerId}`).click();
      await page.getByTestId('tab-active-learners').click();
      await expect(page.getByTestId(`learner-card-${learnerId}`)).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Schedule: create then delete a lesson', async () => {
      await page.goto('/curriculum');
      await page.getByTestId('open-subject-modal-btn').click();
      await page.getByTestId('subject-name-input').fill(subjectName);
      await page.getByTestId('save-subject-btn').click();
      await expect(page.getByText(subjectName)).toBeVisible({ timeout: 15_000 });

      await page.goto('/schedule');
      await expect(page.getByTestId('create-lesson-btn')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('create-lesson-btn').click();
      await page.getByTestId('lesson-title-input').fill(lessonTitle);
      await page.getByTestId('lesson-subject-select').selectOption({ label: subjectName });
      await page.locator('[data-testid^="learner-checkbox-"]').first().check();
      await page.getByTestId('save-lesson-btn').click();
      await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 15_000 });

      const agendaItem = page.locator('[data-testid^="agenda-item-"]', { hasText: lessonTitle });
      const lessonItemId = (await agendaItem.getAttribute('data-testid'))!.replace('agenda-item-', '');

      await page.getByTestId(`delete-lesson-btn-${lessonItemId}`).click();
      await expect(page.getByTestId(`agenda-item-${lessonItemId}`)).toHaveCount(0, { timeout: 15_000 });
    });

    await test.step('Records: create, edit, then delete a learning record', async () => {
      await page.goto('/records');
      await page.getByTestId('open-create-record-btn').click();
      const learnerOptions = page.getByTestId('record-learner-select').locator('option');
      const learnerValue = await learnerOptions.nth(1).getAttribute('value');
      await page.getByTestId('record-learner-select').selectOption(learnerValue!);
      await page.getByTestId('record-title-input').fill(recordTitle);
      await page.getByTestId('save-record-btn').click();
      await expect(page.getByText(recordTitle)).toBeVisible({ timeout: 15_000 });

      const editBtn = page.locator(`[data-testid^="edit-record-btn-"]`).first();
      await editBtn.click();
      await expect(page.getByTestId('record-title-input')).toHaveValue(recordTitle);
      await page.getByTestId('record-title-input').fill(recordTitleEdited);
      await page.getByTestId('save-record-btn').click();
      await expect(page.getByText(recordTitleEdited)).toBeVisible({ timeout: 15_000 });

      const deleteBtn = page.locator(`[data-testid^="delete-record-btn-"]`).first();
      const recordTestId = await deleteBtn.getAttribute('data-testid');
      const recordId = recordTestId!.replace('delete-record-btn-', '');
      await deleteBtn.click();
      await expect(page.getByTestId(`delete-record-btn-${recordId}`)).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByText(recordTitleEdited)).toHaveCount(0);
    });

    await test.step('Portfolio: create a link-type item, edit it, then delete it', async () => {
      await page.goto('/portfolio');
      await page.getByTestId('open-add-portfolio-btn').click();
      const learnerOptions = page.getByTestId('portfolio-learner-select').locator('option');
      const learnerValue = await learnerOptions.nth(1).getAttribute('value');
      await page.getByTestId('portfolio-learner-select').selectOption(learnerValue!);
      await page.getByTestId('portfolio-type-select').selectOption('LINK');
      await page.getByTestId('portfolio-title-input').fill(portfolioTitle);
      await page.getByTestId('portfolio-file-url-input').fill('https://example.com/carta-em-grego.pdf');
      await page.getByTestId('save-portfolio-btn').click();
      await expect(page.getByText(portfolioTitle)).toBeVisible({ timeout: 15_000 });

      const portfolioCard = page.locator('[data-testid^="portfolio-card-"]', { hasText: portfolioTitle });
      const portfolioId = (await portfolioCard.getAttribute('data-testid'))!.replace('portfolio-card-', '');

      await page.getByTestId(`edit-portfolio-btn-${portfolioId}`).click();
      await expect(page.getByTestId('portfolio-title-input')).toHaveValue(portfolioTitle);
      await page.getByTestId('portfolio-title-input').fill(portfolioTitleEdited);
      await page.getByTestId('save-portfolio-btn').click();
      await expect(page.getByText(portfolioTitleEdited)).toBeVisible({ timeout: 15_000 });

      await page.getByTestId(`delete-portfolio-btn-${portfolioId}`).click();
      await expect(page.getByTestId(`portfolio-card-${portfolioId}`)).toHaveCount(0, { timeout: 15_000 });
    });

    await test.step('Reports: generate then delete an official report', async () => {
      await page.goto('/reports');
      await page.getByTestId('open-generate-report-btn').click();
      await page.getByTestId('report-title-input').fill(reportTitle);
      await page.getByTestId('generate-report-btn').click();

      const reportCard = page.locator('[data-testid^="report-card-"]', { hasText: reportTitle });
      await expect(reportCard).toBeVisible({ timeout: 30_000 });
      const reportId = (await reportCard.getAttribute('data-testid'))!.replace('report-card-', '');

      // Generating opens a preview modal that overlays the delete button.
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('report-preview-modal')).toHaveCount(0);

      await page.getByTestId(`delete-report-btn-${reportId}`).click();
      await expect(page.getByTestId(`report-card-${reportId}`)).toHaveCount(0, { timeout: 15_000 });
    });
  });
});
