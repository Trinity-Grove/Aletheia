import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { useState } from 'react';
import type { LearnerSummaryDto, NotificationItemResponseDto } from '@aletheia/contracts';
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

const mockNotifications: NotificationItemResponseDto[] = [
  {
    id: 'notif-1',
    familyId: 'fam-1',
    userId: 'usr-1',
    type: 'DEVOTIONAL_REMINDER',
    title: 'Hora do Devocional',
    message: 'Momento de leitura em Provérbios',
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('ProductShell adapter', () => {
  afterEach(cleanup);

  it('maps the current path into the shared desktop shell landmarks', () => {
    render(
      <ProductShell currentPath="/curriculum">
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Navegação principal' })).toHaveTextContent(
      'Aletheia',
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Conteúdo');
    expect(screen.getByRole('link', { name: 'Currículo' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Educandos' })).not.toHaveAttribute('aria-current');
  });

  it('filters guardian-only navigation items using the active role permissions', () => {
    render(
      <ProductShell user={{ name: 'Helena Educadora', role: 'EDUCATOR' }}>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(screen.getByRole('link', { name: 'Diário de Aprendizagem' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Relatórios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Configurações' })).not.toBeInTheDocument();
  });

  it('forwards learner, notification, and profile content without React warnings', () => {
    const onSelectLearner = vi.fn();
    const onMarkAsRead = vi.fn().mockResolvedValue(undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(
        <ProductShell
          learners={mockLearners}
          activeLearnerId="l-001"
          onSelectLearner={onSelectLearner}
          notifications={mockNotifications}
          unreadCount={1}
          onMarkNotificationAsRead={onMarkAsRead}
          user={{ name: 'Wendel Silva', email: 'wendel@aletheia.edu', role: 'OWNER_GUARDIAN' }}
        >
          <p>Painel Inicial</p>
        </ProductShell>,
      );

      expect(screen.getByTestId('learner-focus-btn')).toHaveTextContent('Clarinha');
      fireEvent.change(screen.getByTestId('learner-focus-select'), { target: { value: 'l-002' } });
      expect(onSelectLearner).toHaveBeenCalledWith('l-002');
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1');
      expect(screen.getByTestId('appshell-user-profile')).toHaveTextContent('Wendel Silva');
      expect(screen.getByTestId('appshell-user-profile')).toHaveTextContent('Guardião Principal');
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('opens the shared mobile navigation from the topbar control', () => {
    render(
      <ProductShell>
        <p>Conteúdo mobile</p>
      </ProductShell>,
    );

    const menuButton = screen.getByRole('button', { name: 'Abrir navegação' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Navegação móvel' })).toBeInTheDocument();
  });
});

describe('ProductShell compatibility', () => {
  afterEach(cleanup);

  it('keeps controlled learner selection compatible with current page call sites', () => {
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
    const select = screen.getByTestId('learner-focus-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'l-002' } });
    expect(select.value).toBe('l-002');
  });
});

describe('LearnerFocusSwitcher', () => {
  afterEach(cleanup);

  it('renders the family default and learner options', () => {
    render(
      <LearnerFocusSwitcher
        learners={mockLearners}
        activeLearnerId={null}
        onSelectLearner={vi.fn()}
      />,
    );

    const select = screen.getByTestId('learner-focus-select') as HTMLSelectElement;
    expect(select.value).toBe('');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent(/Toda a Família/i);
    expect(options[1]).toHaveTextContent(/Clarinha/i);
    expect(options[2]).toHaveTextContent(/Pedro/i);
  });

  it('selects one learner or the whole family', () => {
    const onSelectLearner = vi.fn();
    render(
      <LearnerFocusSwitcher
        learners={mockLearners}
        activeLearnerId="l-001"
        onSelectLearner={onSelectLearner}
      />,
    );

    fireEvent.change(screen.getByTestId('learner-focus-select'), { target: { value: 'l-002' } });
    expect(onSelectLearner).toHaveBeenCalledWith('l-002');

    fireEvent.change(screen.getByTestId('learner-focus-select'), { target: { value: '' } });
    expect(onSelectLearner).toHaveBeenCalledWith(null);
  });
});
