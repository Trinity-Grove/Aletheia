import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LearnerSummaryDto, NotificationItemResponseDto } from '@aletheia/contracts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Modal,
} from '../src/components/ui';
import { ProductShell } from '../src/components/layout/product-shell';
import { RecordsJournalView } from '../src/components/records/records-journal-view';
import { AttendanceTrackerView } from '../src/components/reports/attendance-tracker-view';
import { AuthProvider } from '../src/lib/auth/rbac-context';

const mockLearners: LearnerSummaryDto[] = [
  {
    id: 'l-001',
    firstName: 'Clara',
    lastName: 'Silva',
    preferredName: 'Clarinha',
    stage: 'PRIMARY_GRAMMAR',
    avatarColor: '#4338CA',
  },
  {
    id: 'l-002',
    firstName: 'Pedro',
    lastName: 'Silva',
    preferredName: null,
    stage: 'MIDDLE_LOGIC',
    avatarColor: '#059669',
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

describe('UI Primitives: Card', () => {
  afterEach(cleanup);

  it('renders card header, title, description, content and footer', () => {
    render(
      <Card variant="bordered" shadow="md">
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
          <CardDescription>Descrição auxiliar</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo principal do card</p>
        </CardContent>
        <CardFooter>
          <button type="button">Ação</button>
        </CardFooter>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-variant', 'bordered');
    expect(card).toHaveAttribute('data-shadow', 'md');
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Título do Card');
    expect(screen.getByTestId('card-description')).toHaveTextContent('Descrição auxiliar');
    expect(screen.getByTestId('card-content')).toHaveTextContent('Conteúdo principal do card');
    expect(screen.getByTestId('card-footer')).toHaveTextContent('Ação');
  });

  it('supports shadow and border variants (flat, elevated, glass, default)', () => {
    const { rerender } = render(<Card variant="glass" shadow="lg">Glass Card</Card>);
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'glass');
    expect(screen.getByTestId('card')).toHaveAttribute('data-shadow', 'lg');

    rerender(<Card variant="elevated" shadow="sm">Elevated Card</Card>);
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'elevated');
    expect(screen.getByTestId('card')).toHaveAttribute('data-shadow', 'sm');

    rerender(<Card variant="flat" shadow="none">Flat Card</Card>);
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'flat');
    expect(screen.getByTestId('card')).toHaveAttribute('data-shadow', 'none');
  });
});

describe('UI Primitives: Button', () => {
  afterEach(cleanup);

  it('renders button with variants and sizes', () => {
    const { rerender } = render(<Button variant="primary" size="md">Salvar</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveTextContent('Salvar');

    rerender(<Button variant="danger" size="lg">Excluir</Button>);
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).toHaveAttribute('data-size', 'lg');

    rerender(<Button variant="outline" size="sm">Cancelar</Button>);
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-size', 'sm');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(button).toHaveAttribute('data-variant', 'ghost');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(button).toHaveAttribute('data-variant', 'secondary');
  });

  it('supports loading state with spinner and disabled state', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button isLoading onClick={onClick}>
        Carregando
      </Button>
    );

    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button disabled onClick={onClick}>
        Desabilitado
      </Button>
    );
    expect(button).toBeDisabled();
    expect(screen.queryByTestId('button-spinner')).not.toBeInTheDocument();
  });

  it('supports left and right icons', () => {
    render(
      <Button leftIcon={<ChevronLeft data-testid="left-icon" size={16} />} rightIcon={<ChevronRight data-testid="right-icon" size={16} />}>
        Com Ícones
      </Button>
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});

describe('UI Primitives: Badge', () => {
  afterEach(cleanup);

  it('renders badge with color variants (indigo, amber, emerald, slate, rose)', () => {
    const { rerender } = render(<Badge variant="indigo">Gramática</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'indigo');
    expect(badge).toHaveTextContent('Gramática');

    rerender(<Badge variant="amber">Pendente</Badge>);
    expect(badge).toHaveAttribute('data-variant', 'amber');

    rerender(<Badge variant="emerald">Concluído</Badge>);
    expect(badge).toHaveAttribute('data-variant', 'emerald');

    rerender(<Badge variant="rose">Atenção</Badge>);
    expect(badge).toHaveAttribute('data-variant', 'rose');

    rerender(<Badge variant="slate">Geral</Badge>);
    expect(badge).toHaveAttribute('data-variant', 'slate');
  });

  it('supports dot indicator and sizes (sm, md, lg)', () => {
    render(<Badge variant="emerald" size="lg" dot>Ativo</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-size', 'lg');
    expect(screen.getByTestId('badge-dot')).toBeInTheDocument();
  });
});

describe('UI Primitives: Modal', () => {
  afterEach(cleanup);

  it('renders modal when isOpen is true with title, description, body and footer', () => {
    const onClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Novo Registro"
        description="Preencha os dados da atividade"
        footer={<Button onClick={onClose}>Fechar</Button>}
      >
        <div data-testid="modal-content">Formulário</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Novo Registro');
    expect(screen.getByTestId('modal-description')).toHaveTextContent('Preencha os dados da atividade');
    expect(screen.getByTestId('modal-content')).toHaveTextContent('Formulário');
    expect(screen.getByTestId('modal-footer')).toHaveTextContent('Fechar');
  });

  it('does not render modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Conteúdo oculto</div>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles close on escape key and backdrop click', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Teste de Fechamento">
        <div>Corpo</div>
      </Modal>
    );

    // Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Close button click
    const closeBtn = screen.getByTestId('modal-close-button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);

    // Backdrop click
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('ProductShell Integration', () => {
  afterEach(cleanup);

  it('renders sidebar with navigation items, active link highlights and collapse toggle', () => {
    render(
      <ProductShell currentPath="/curriculum">
        <p>Visão de Currículo</p>
      </ProductShell>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    const curriculumNav = screen.getByTestId('nav-item-curriculum');
    expect(curriculumNav).toHaveAttribute('data-active', 'true');

    const learnersNav = screen.getByTestId('nav-item-learners');
    expect(learnersNav).toHaveAttribute('data-active', 'false');

    // Test collapse toggle
    const collapseBtn = screen.getByTestId('sidebar-collapse-toggle');
    fireEvent.click(collapseBtn);
    expect(collapseBtn).toHaveAttribute('aria-label', 'Expandir barra lateral');
  });

  it('renders learner focus switcher, notification bell and user profile with RoleBadge', () => {
    const onSelectLearner = vi.fn();
    const onMarkAsRead = vi.fn();

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
        <div>Painel Inicial</div>
      </ProductShell>
    );

    // Learner focus switcher
    expect(screen.getByTestId('learner-focus-btn')).toHaveTextContent('Clarinha');
    expect(screen.getByTestId('learner-avatar')).toBeInTheDocument();

    // Notification bell
    expect(screen.getByTestId('notification-bell-btn')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('1');

    // User profile and RoleBadge
    expect(screen.getByTestId('user-profile-summary')).toHaveTextContent('Wendel Silva');
    expect(screen.getAllByTestId('role-badge').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Guardião Principal')[0]).toBeInTheDocument();
  });

  it('supports mobile responsive toggle and backdrop', () => {
    render(
      <ProductShell>
        <div>Mobile Content</div>
      </ProductShell>
    );

    const mobileToggle = screen.getByTestId('mobile-sidebar-toggle');
    fireEvent.click(mobileToggle);
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});

describe('Native select option safety', () => {
  afterEach(cleanup);

  it('renders record and attendance options as text-only content without console warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <RecordsJournalView
            records={[]}
            learners={mockLearners}
            subjects={[]}
            activeLearnerId={null}
            onOpenCreateRecord={vi.fn()}
            onEditRecord={vi.fn()}
            onDeleteRecord={vi.fn()}
            onAddEvidence={vi.fn()}
          />
        </AuthProvider>,
      );

      const recordOption = screen.getByRole('option', { name: 'Lição Planejada' });
      expect(recordOption.querySelector('svg')).toBeNull();

      cleanup();

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <AttendanceTrackerView
            records={[]}
            learners={mockLearners}
            activeLearnerId={null}
            onLogAttendance={vi.fn().mockResolvedValue(undefined)}
            onBulkLogAttendance={vi.fn().mockResolvedValue(undefined)}
          />
        </AuthProvider>,
      );

      const attendanceOption = screen.getByRole('option', { name: 'Presente' });
      expect(attendanceOption.querySelector('svg')).toBeNull();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
