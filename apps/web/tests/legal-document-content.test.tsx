import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LegalDocumentContent } from '../src/components/shared/legal-document-content';

describe('LegalDocumentContent', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders # and ## headings and paragraphs, dropping a leading # (already shown as the modal title)', () => {
    render(
      <LegalDocumentContent
        content={`# Termos de Uso

## 1. Objeto
Estes Termos regem o uso da plataforma.

## 2. Cadastro
Você declara ser responsável legal.`}
      />,
    );

    // The leading "# Termos de Uso" is dropped -- callers already show it.
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '1. Objeto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2. Cadastro' })).toBeInTheDocument();
    expect(screen.getByText('Estes Termos regem o uso da plataforma.')).toBeInTheDocument();
    expect(screen.getByText('Você declara ser responsável legal.')).toBeInTheDocument();
  });

  it('renders plain paragraph content with no headings at all (e.g. learner data consent text)', () => {
    render(<LegalDocumentContent content="Declaro ser o pai, a mãe ou o responsável legal por este estudante." />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(
      screen.getByText('Declaro ser o pai, a mãe ou o responsável legal por este estudante.'),
    ).toBeInTheDocument();
  });

  it('does not render literal "#" characters', () => {
    const { container } = render(
      <LegalDocumentContent content={`# Título\n\n## Seção\nConteúdo aqui.`} />,
    );

    expect(container.textContent).not.toContain('#');
  });
});
