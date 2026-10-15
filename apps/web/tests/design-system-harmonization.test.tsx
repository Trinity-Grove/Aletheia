import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@aletheia/ui';

describe('Design System Harmonization (ALET-B05)', () => {
  it('renders @aletheia/ui PageHeader with institutional typography, adornment, and testids', () => {
    render(
      <PageHeader
        eyebrow="Trinity Grove"
        title="Harmonized Title"
        titleAdornment={<span data-testid="custom-adornment">Badge</span>}
        description="Harmonized Subtitle"
        action={<button data-testid="custom-action" type="button">Ação</button>}
      />
    );

    const header = screen.getByTestId('page-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('ui-page-header');

    const eyebrow = screen.getByTestId('page-header-eyebrow');
    expect(eyebrow).toHaveTextContent('Trinity Grove');

    const title = screen.getByTestId('page-header-title');
    expect(title).toHaveTextContent('Harmonized Title');
    expect(title).toHaveClass('ui-page-header__title');

    const adornment = screen.getByTestId('page-header-title-adornment');
    expect(adornment).toContainElement(screen.getByTestId('custom-adornment'));

    const desc = screen.getByTestId('page-header-description');
    expect(desc).toHaveTextContent('Harmonized Subtitle');
    expect(desc).toHaveClass('ui-page-header__description');

    const action = screen.getByTestId('page-header-action');
    expect(action).toContainElement(screen.getByTestId('custom-action'));
  });

  it('defines .page-container with max-width 76rem and 640px responsive breakpoint in globals.css', () => {
    const cssPath = path.resolve(__dirname, '../app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toMatch(/\.page-container\s*\{[^}]*max-width:\s*76rem/);
    expect(cssContent).toMatch(/@media\s*\(\s*min-width:\s*640px\s*\)\s*\{[^}]*\.page-container\s*\{[^}]*padding:\s*2rem\s+1\.5rem/);
  });

  describe('Task 2: Learning & Routine routes harmonization', () => {
    it('uses .page-container and PageHeader in /attendance', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/attendance/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).not.toContain("maxWidth: '1200px'");
    });

    it('uses .page-container and PageHeader in /learners', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/learners/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container learners-page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).toContain('data-testid="add-learner-btn"');
      expect(content).not.toContain("maxWidth: '1200px'");
    });

    it('uses .page-container and PageHeader in /devotional', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/devotional/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container devotional-page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).not.toContain("maxWidth: '1200px'");
    });

    it('uses .page-container and PageHeader with tabs action in /schedule', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/schedule/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).toContain('data-testid="tab-agenda"');
      expect(content).toContain('data-testid="tab-routine"');
      expect(content).not.toContain("maxWidth: '1200px'");
    });
  });

  describe('Task 3: Curriculum & Evaluation routes harmonization', () => {
    it('uses .page-container and PageHeader with titleAdornment in CurriculumView', () => {
      const filePath = path.resolve(__dirname, '../src/components/curriculum/curriculum-view.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).toContain('titleAdornment=');
      expect(content).toContain('data-testid="pedagogical-framework-badge"');
      expect(content).not.toContain("maxWidth: '76rem'");
    });

    it('uses .page-container and PageHeader in /records', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/records/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).not.toContain("maxWidth: '1200px'");
    });

    it('uses .page-container and PageHeader in /portfolio', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/portfolio/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).not.toContain("maxWidth: '1200px'");
    });

    it('uses .page-container and PageHeader in /reports', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/reports/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).not.toContain("maxWidth: '1200px'");
    });
  });

  describe('Task 4: Settings & Support routes harmonization', () => {
    it('uses .page-container and PageHeader in /settings', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/settings/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).toContain('data-testid="settings-sidebar-nav"');
      expect(content).not.toContain("maxWidth: '1200px'");
    });

    it('uses .page-container and PageHeader in /support', () => {
      const filePath = path.resolve(__dirname, '../app/(dashboard)/support/page.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('className="page-container"');
      expect(content).toContain('<PageHeader');
      expect(content).toContain("t('support.pageTitle')");
      expect(content).toContain("t('support.pageSubtitle')");
      expect(content).toContain("t('support.featureFreeAndSovereign')");
      expect(content).not.toContain("maxWidth: '1100px'");
    });
  });
});


