import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackAuthorSupportModal } from '../src/components/curriculum/pack-author-support-modal';

describe('PackAuthorSupportModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('renders author voluntary support details and options', () => {
    const onClose = vi.fn();
    render(
      <PackAuthorSupportModal
        isOpen={true}
        authorName="Professor Silva"
        packName="Trivium Clássico"
        pixKey="prof.silva@exemplo.com"
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/Apoiar o Autor Voluntariamente/i)).toBeInTheDocument();
    expect(screen.getByText('Professor Silva')).toBeInTheDocument();
    expect(screen.getByText('prof.silva@exemplo.com')).toBeInTheDocument();
  });
});
