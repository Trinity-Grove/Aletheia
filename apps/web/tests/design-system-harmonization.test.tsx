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
});
