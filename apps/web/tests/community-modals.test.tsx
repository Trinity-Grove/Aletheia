import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CommunityActivityResponseDto } from '@aletheia/contracts';
import { ShareIdeaModal } from '../src/components/community/share-idea-modal';
import { AdoptIdeaModal } from '../src/components/community/adopt-idea-modal';

const mockIdea: CommunityActivityResponseDto = {
  id: 'c1111111-2222-4333-8444-555555555555',
  name: 'Observação Astronômica: Cráteres Lunares',
  description: 'Uso de binóculos ou luneta simples para mapear relevo lunar com desenhos no caderno.',
  ageMin: 7,
  ageMax: 14,
  estimatedDurationMinutes: 40,
  supervisionRequired: true,
  riskLevel: 'LOW',
  evidenceRequirementMode: 'ANY',
  metadata: {
    theme: 'NATURE_STUDY',
    materials: ['Binóculos ou telescópio infantil', 'Caderno preto', 'Giz branco'],
    isSeed: true,
  },
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
};

const mockLearners = [
  { id: 'learner-1', name: 'Ana Silva' },
  { id: 'learner-2', name: 'Pedro Silva' },
];

describe('ShareIdeaModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not render anything when isOpen is false', () => {
    render(<ShareIdeaModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders privacy notice, form fields, and buttons when open', () => {
    render(<ShareIdeaModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    // Dialog & Title
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar Ideia com Outras Famílias')).toBeInTheDocument();

    // Privacy notice
    expect(
      screen.getByText(
        'Garantia de Privacidade: Nenhuma identificação pessoal, nome de crianças ou registros privados são compartilhados.'
      )
    ).toBeInTheDocument();

    // Fields
    expect(screen.getByLabelText('Título da Atividade')).toBeInTheDocument();
    expect(screen.getByLabelText('Como Fazer (Descrição prática)')).toBeInTheDocument();
    expect(screen.getByLabelText('Pilar Pedagógico / Tema')).toBeInTheDocument();
    expect(screen.getByLabelText('Materiais (separados por vírgula)')).toBeInTheDocument();
    expect(screen.getByLabelText('Idade mínima')).toBeInTheDocument();
    expect(screen.getByLabelText('Idade máxima')).toBeInTheDocument();
    expect(screen.getByLabelText('Duração estimada (minutos)')).toBeInTheDocument();
    expect(screen.getByLabelText('Exige supervisão próxima dos pais')).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar Ideia' })).toBeInTheDocument();
  });

  it('does not submit when name or description are empty', () => {
    const onSubmit = vi.fn();
    render(<ShareIdeaModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    const submitBtn = screen.getByRole('button', { name: 'Publicar Ideia' });
    fireEvent.click(submitBtn);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits structured payload with trimmed materials when valid', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<ShareIdeaModal isOpen onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Título da Atividade'), {
      target: { value: 'Caça aos Insetos no Jardim' },
    });
    fireEvent.change(screen.getByLabelText('Como Fazer (Descrição prática)'), {
      target: { value: 'Caminhar no quintal procurando formigas e joaninhas para observar comportamentos.' },
    });
    fireEvent.change(screen.getByLabelText('Pilar Pedagógico / Tema'), {
      target: { value: 'NATURE_STUDY' },
    });
    fireEvent.change(screen.getByLabelText('Materiais (separados por vírgula)'), {
      target: { value: ' Pote transparente , Lupa , Pinça plástica ' },
    });
    fireEvent.change(screen.getByLabelText('Idade mínima'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Idade máxima'), {
      target: { value: '9' },
    });
    fireEvent.change(screen.getByLabelText('Duração estimada (minutos)'), {
      target: { value: '30' },
    });
    // Toggle checkbox (default is true, unchecking sets to false)
    const supervisionCheckbox = screen.getByLabelText('Exige supervisão próxima dos pais');
    fireEvent.click(supervisionCheckbox);

    const submitBtn = screen.getByRole('button', { name: 'Publicar Ideia' });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Caça aos Insetos no Jardim',
      description: 'Caminhar no quintal procurando formigas e joaninhas para observar comportamentos.',
      theme: 'NATURE_STUDY',
      materials: ['Pote transparente', 'Lupa', 'Pinça plástica'],
      ageMin: 4,
      ageMax: 9,
      estimatedDurationMinutes: 30,
      supervisionRequired: false,
    });
  });

  it('normalizes ageMin and ageMax when ageMin is greater than ageMax on submit', () => {
    const onSubmit = vi.fn();
    render(<ShareIdeaModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Título da Atividade'), {
      target: { value: 'Atividade de Teste' },
    });
    fireEvent.change(screen.getByLabelText('Como Fazer (Descrição prática)'), {
      target: { value: 'Descrição prática da atividade de teste.' },
    });
    // Invert ages: min 14, max 6
    fireEvent.change(screen.getByLabelText('Idade mínima'), {
      target: { value: '14' },
    });
    fireEvent.change(screen.getByLabelText('Idade máxima'), {
      target: { value: '6' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Publicar Ideia' });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        ageMin: 6,
        ageMax: 14,
      })
    );
  });

  it('calls onClose when clicking cancel button', () => {
    const onClose = vi.fn();
    render(<ShareIdeaModal isOpen onClose={onClose} onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit button and shows loading state when isSubmitting is true', () => {
    const onSubmit = vi.fn();
    render(
      <ShareIdeaModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isSubmitting
      />
    );

    const submittingBtn = screen.getByRole('button', { name: 'Publicando...' });
    expect(submittingBtn).toBeDisabled();

    fireEvent.click(submittingBtn);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('AdoptIdeaModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not render anything when isOpen is false', () => {
    render(
      <AdoptIdeaModal
        isOpen={false}
        idea={mockIdea}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render anything when idea is null', () => {
    render(
      <AdoptIdeaModal
        isOpen
        idea={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders selected idea name, summary, and learner options', () => {
    render(
      <AdoptIdeaModal
        isOpen
        idea={mockIdea}
        learners={mockLearners}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Adotar Atividade para Nossa Rotina')).toBeInTheDocument();
    expect(screen.getByText('Observação Astronômica: Cráteres Lunares')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Uso de binóculos ou luneta simples para mapear relevo lunar com desenhos no caderno.'
      )
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Vincular a um educando (opcional)')).toBeInTheDocument();
    expect(screen.getByText('Para toda a família / Geral')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Pedro Silva')).toBeInTheDocument();
  });

  it('calls onConfirm with ideaId and undefined learnerId when general option is selected', () => {
    const onConfirm = vi.fn();
    render(
      <AdoptIdeaModal
        isOpen
        idea={mockIdea}
        learners={mockLearners}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Adoção' });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      ideaId: 'c1111111-2222-4333-8444-555555555555',
      learnerId: undefined,
    });
  });

  it('calls onConfirm with ideaId and selected learnerId', () => {
    const onConfirm = vi.fn();
    render(
      <AdoptIdeaModal
        isOpen
        idea={mockIdea}
        learners={mockLearners}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const select = screen.getByLabelText('Vincular a um educando (opcional)');
    fireEvent.change(select, { target: { value: 'learner-2' } });

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Adoção' });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      ideaId: 'c1111111-2222-4333-8444-555555555555',
      learnerId: 'learner-2',
    });
  });

  it('calls onClose when clicking cancel button', () => {
    const onClose = vi.fn();
    render(
      <AdoptIdeaModal
        isOpen
        idea={mockIdea}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and shows loading state when isAdopting is true', () => {
    const onConfirm = vi.fn();
    render(
      <AdoptIdeaModal
        isOpen
        idea={mockIdea}
        learners={mockLearners}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        isAdopting
      />
    );

    const adoptingBtn = screen.getByRole('button', { name: 'Salvando...' });
    expect(adoptingBtn).toBeDisabled();

    fireEvent.click(adoptingBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
