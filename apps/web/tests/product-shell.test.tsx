import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { useState } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell, LearnerFocusSwitcher } from '../src/components/product-shell';

const mockLearners: LearnerSummaryDto[] = [
  {
    id: 'l-001',
    firstName: 'Clara',
    lastName: 'Silva',
    preferredName: 'Clarinha',
    stage: 'PRIMARY_GRAMMAR',
    avatarColor: '#3B82F6',
  },
  {
    id: 'l-002',
    firstName: 'Pedro',
    lastName: 'Silva',
    preferredName: null,
    stage: 'MIDDLE_LOGIC',
    avatarColor: '#10B981',
  },
];

describe('ProductShell', () => {
  afterEach(() => {
    cleanup();
  });
  it('identifies the product and main landmark', () => {
    render(
      <ProductShell>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Aletheia');
    expect(screen.getByRole('main')).toHaveTextContent('Conteúdo');
  });

  it('renders header with learner focus switcher when learners provided', () => {
    function ShellWrapper() {
      const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
      return (
        <ProductShell
          learners={mockLearners}
          activeLearnerId={activeLearnerId}
          onSelectLearner={setActiveLearnerId}
        >
          <div>Conteúdo Principal</div>
        </ProductShell>
      );
    }

    render(<ShellWrapper />);

    expect(screen.getByRole('banner')).toHaveTextContent('Aletheia');
    expect(screen.getByTestId('learner-focus-select')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo Principal')).toBeInTheDocument();

    const select = screen.getByTestId('learner-focus-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'l-002' } });
    expect(select.value).toBe('l-002');
  });
});

describe('LearnerFocusSwitcher', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders default "Toda a Família" and learner options', () => {
    const onSelectLearner = vi.fn();
    render(
      <LearnerFocusSwitcher
        learners={mockLearners}
        activeLearnerId={null}
        onSelectLearner={onSelectLearner}
      />
    );

    const select = screen.getByTestId('learner-focus-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent(/Toda a Família/i);
    expect(options[1]).toHaveTextContent(/Clarinha/i);
    expect(options[2]).toHaveTextContent(/Pedro/i);
  });

  it('triggers onSelectLearner when a learner is selected', () => {
    const onSelectLearner = vi.fn();
    render(
      <LearnerFocusSwitcher
        learners={mockLearners}
        activeLearnerId={null}
        onSelectLearner={onSelectLearner}
      />
    );

    const select = screen.getByTestId('learner-focus-select');
    fireEvent.change(select, { target: { value: 'l-001' } });

    expect(onSelectLearner).toHaveBeenCalledWith('l-001');
  });

  it('triggers onSelectLearner with null when "Toda a Família" is selected', () => {
    const onSelectLearner = vi.fn();
    render(
      <LearnerFocusSwitcher
        learners={mockLearners}
        activeLearnerId="l-001"
        onSelectLearner={onSelectLearner}
      />
    );

    const select = screen.getByTestId('learner-focus-select') as HTMLSelectElement;
    expect(select.value).toBe('l-001');

    fireEvent.change(select, { target: { value: '' } });
    expect(onSelectLearner).toHaveBeenCalledWith(null);
  });
});

