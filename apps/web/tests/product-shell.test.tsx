import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { useState } from 'react';
import type { LearnerSummaryDto, NotificationItemResponseDto } from '@aletheia/contracts';
import { ProductShell, LearnerFocusSwitcher } from '../src/components/product-shell';
import { AuthProvider, useAuthRole } from '../src/lib/auth/rbac-context';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';

const nextNavigation = vi.hoisted(() => ({
  pathname: '/',
  routerReplace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nextNavigation.pathname,
  useRouter: () => ({ replace: nextNavigation.routerReplace, push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} data-next-link="true" />
  ),
}));

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

function AuthContextProbe() {
  const auth = useAuthRole();

  return (
    <output data-testid="auth-context-probe">
      {`${auth?.role ?? 'none'}|${auth?.user?.id ?? 'none'}|${auth?.familyId ?? 'none'}`}
    </output>
  );
}

describe('ProductShell adapter', () => {
  afterEach(() => {
    cleanup();
    nextNavigation.pathname = '/';
    nextNavigation.routerReplace.mockClear();
  });

  it('maps the current path into the shared desktop shell landmarks', () => {
    nextNavigation.pathname = '/learners';

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
    // 'Educandos' is also a primary tab-bar item, so it renders twice (sidebar
    // + tab bar); scope to the desktop sidebar link by testid like the other
    // tests in this file do for items that overlap the tab bar.
    expect(screen.getByTestId('appshell-nav-learners')).not.toHaveAttribute('aria-current');
  });

  it('derives the active route from Next and renders Next-integrated desktop and overflow-sheet links', () => {
    nextNavigation.pathname = '/curriculum';

    render(
      <ProductShell>
        <p>Conteúdo roteado</p>
      </ProductShell>,
    );

    const desktopLink = screen.getByTestId('appshell-nav-curriculum');
    expect(desktopLink).toHaveAttribute('aria-current', 'page');
    expect(desktopLink).toHaveAttribute('data-next-link', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));
    const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
    const overflowLink = within(moreSheet).getByRole('link', { name: 'Currículo' });
    expect(overflowLink).toHaveAttribute('aria-current', 'page');
    expect(overflowLink).toHaveAttribute('data-next-link', 'true');
  });

  it('splits navigation into four primary tab-bar items and the rest as overflow', () => {
    render(
      <ProductShell>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(screen.getByTestId('appshell-tab-bar-home')).toBeInTheDocument();
    expect(screen.getByTestId('appshell-tab-bar-devotional')).toBeInTheDocument();
    expect(screen.getByTestId('appshell-tab-bar-schedule')).toBeInTheDocument();
    expect(screen.getByTestId('appshell-tab-bar-learners')).toBeInTheDocument();
    expect(screen.queryByTestId('appshell-tab-bar-curriculum')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));
    const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
    expect(within(moreSheet).getByRole('link', { name: 'Currículo' })).toBeInTheDocument();
    expect(within(moreSheet).queryByRole('link', { name: 'Início' })).not.toBeInTheDocument();
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

  it('shows an accessible access-denied state instead of page content when a role without permission opens a gated route directly', () => {
    render(
      <ProductShell currentPath="/reports" user={{ name: 'Helena Educadora', role: 'EDUCATOR' }}>
        <p>Dados de relatórios do educando</p>
      </ProductShell>,
    );

    expect(screen.getByTestId('access-denied-state')).toBeInTheDocument();
    expect(screen.getByText('Acesso restrito')).toBeInTheDocument();
    expect(screen.queryByText('Dados de relatórios do educando')).not.toBeInTheDocument();
  });

  it('renders page content as usual for a role that has permission for the gated route', () => {
    render(
      <ProductShell currentPath="/reports" user={{ name: 'Helena Guardiã', role: 'OWNER_GUARDIAN' }}>
        <p>Dados de relatórios do educando</p>
      </ProductShell>,
    );

    expect(screen.queryByTestId('access-denied-state')).not.toBeInTheDocument();
    expect(screen.getByText('Dados de relatórios do educando')).toBeInTheDocument();
  });

  it('uses an explicit user as the descendant auth context over a conflicting outer provider', () => {
    render(
      <AuthProvider
        role="OWNER_GUARDIAN"
        familyId="outer-family"
        user={{
          id: 'outer-user',
          email: 'outer@aletheia.edu',
          fullName: 'Outer Guardian',
          emailVerified: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      >
        <ProductShell user={{ id: 'explicit-user', name: 'Helena Educadora', role: 'EDUCATOR' }}>
          <AuthContextProbe />
        </ProductShell>
      </AuthProvider>,
    );

    expect(screen.queryByRole('link', { name: 'Relatórios' })).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-context-probe')).toHaveTextContent(
      'EDUCATOR|explicit-user|outer-family',
    );
  });

  it('uses an explicit family override without fabricating any other family context', () => {
    render(
      <ProductShell
        familyId="explicit-family"
        user={{ id: 'explicit-user', name: 'Helena Educadora', role: 'EDUCATOR' }}
      >
        <AuthContextProbe />
      </ProductShell>,
    );

    expect(screen.getByTestId('auth-context-probe')).toHaveTextContent(
      'EDUCATOR|explicit-user|explicit-family',
    );
  });

  it('renders profile data from the authenticated context and preserves its active family', () => {
    render(
      <AuthProvider
        role="GUARDIAN"
        familyId="context-family"
        user={{
          id: 'context-user',
          email: 'context@aletheia.edu',
          fullName: 'Guardião do Contexto',
          emailVerified: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      >
        <ProductShell>
          <AuthContextProbe />
        </ProductShell>
      </AuthProvider>,
    );

    expect(screen.getByTestId('auth-context-probe')).toHaveTextContent(
      'GUARDIAN|context-user|context-family',
    );
    expect(screen.getByTestId('appshell-user-profile')).toHaveTextContent('Guardião do Contexto');
    expect(screen.getByTestId('appshell-user-profile')).toHaveTextContent('Guardião');
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

  it('opens the Mais overflow sheet from the tab bar', () => {
    render(
      <ProductShell>
        <p>Conteúdo mobile</p>
      </ProductShell>,
    );

    const moreButton = screen.getByRole('button', { name: 'Mais' });
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(moreButton);

    expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Mais opções' })).toBeInTheDocument();
  });

  it('renders the profile inside the Mais overflow sheet', () => {
    render(
      <ProductShell user={{ name: 'Wendel Silva', email: 'wendel@aletheia.edu', role: 'OWNER_GUARDIAN' }}>
        <p>Conteúdo mobile</p>
      </ProductShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));

    const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
    expect(within(moreSheet).getByText('Wendel Silva')).toBeInTheDocument();
    expect(within(moreSheet).getByText('Guardião Principal')).toBeInTheDocument();
  });

  it('collapses profile details while retaining the desktop avatar', () => {
    render(
      <ProductShell user={{ name: 'Wendel Silva', email: 'wendel@aletheia.edu', role: 'OWNER_GUARDIAN' }}>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Recolher barra lateral' }));

    const profile = screen.getByTestId('appshell-user-profile');
    expect(within(profile).getByText('W')).toBeInTheDocument();
    expect(within(profile).queryByText('Wendel Silva')).not.toBeInTheDocument();
    expect(within(profile).queryByText('Guardião Principal')).not.toBeInTheDocument();
  });

  it('does not fabricate fake user profile or role when unauthenticated', () => {
    render(
      <ProductShell>
        <p>Sem autenticação</p>
      </ProductShell>,
    );

    expect(screen.queryByTestId('appshell-user-profile')).not.toBeInTheDocument();
    expect(screen.queryByText(/Família Santos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/familia@trinitygrove\.org/i)).not.toBeInTheDocument();
  });

  it('renders user details from real AuthProvider context', () => {
    const mockAuthContext: AuthContextValue = {
      status: 'authenticated',
      user: {
        id: 'real-user-1',
        email: 'real.guardian@aletheia.edu',
        fullName: 'Guardião Real',
        emailVerified: false,
        createdAt: '2026-08-30T00:00:00.000Z',
      },
      token: 'jwt-token',
      activeFamilyId: 'real-fam-1',
      activeFamily: {
        id: 'real-fam-1',
        name: 'Família Real',
        countryCode: 'BRA',
        createdAt: '2026-08-30T00:00:00.000Z',
        updatedAt: '2026-08-30T00:00:00.000Z',
      },
      families: [],
      activeRole: 'OWNER_GUARDIAN',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      selectFamily: vi.fn(),
      refreshSession: vi.fn(),
      setActiveFamilyFromCreated: vi.fn(),
      changePassword: vi.fn(),
      changeEmail: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ProductShell>
          <AuthContextProbe />
        </ProductShell>
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('auth-context-probe')).toHaveTextContent(
      'OWNER_GUARDIAN|real-user-1|real-fam-1',
    );
    expect(screen.getByTestId('appshell-user-profile')).toHaveTextContent('Guardião Real');
    expect(screen.getByTestId('appshell-user-profile')).toHaveTextContent('Guardião Principal');
  });

  it('renders a loading shell with aria-busy="true" while auth is loading', () => {
    const mockLoadingContext: AuthContextValue = {
      status: 'loading',
      user: null,
      token: null,
      activeFamilyId: null,
      activeFamily: null,
      families: [],
      activeRole: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      selectFamily: vi.fn(),
      refreshSession: vi.fn(),
      setActiveFamilyFromCreated: vi.fn(),
      changePassword: vi.fn(),
      changeEmail: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockLoadingContext}>
        <ProductShell>
          <p>Conteúdo Carregando</p>
        </ProductShell>
      </AuthContext.Provider>,
    );

    const loadingContainer = screen.getByTestId('product-shell-loading');
    expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Conteúdo Carregando')).toBeInTheDocument();
  });

  it('redirects to /login with a return path and never renders page content when the session resolves to unauthenticated', async () => {
    nextNavigation.pathname = '/learners';

    const mockUnauthenticatedContext: AuthContextValue = {
      status: 'unauthenticated',
      user: null,
      token: null,
      activeFamilyId: null,
      activeFamily: null,
      families: [],
      activeRole: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      selectFamily: vi.fn(),
      refreshSession: vi.fn(),
      setActiveFamilyFromCreated: vi.fn(),
      changePassword: vi.fn(),
      changeEmail: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <ProductShell>
          <p>Dados privados do educando</p>
        </ProductShell>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(nextNavigation.routerReplace).toHaveBeenCalledWith('/login?redirect=%2Flearners');
    });
    expect(screen.queryByText('Dados privados do educando')).not.toBeInTheDocument();
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
