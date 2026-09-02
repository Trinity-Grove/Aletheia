import { act, cleanup, render, screen, fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import {
  Drawer,
  Dropdown,
  Tooltip,
  SectionHeader,
  DataList,
  AppShell,
  Sidebar,
  Topbar,
  MobileNavigation,
  TabBar,
  DailyJourney,
  ActivityList,
} from '../src/index.js';

describe('New UI Components & Patterns', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  describe('Drawer', () => {
    it('renders Drawer when isOpen is true and handles close', () => {
      const handleClose = vi.fn();
      render(
        <Drawer
          isOpen={true}
          onClose={handleClose}
          title="Título da Gaveta"
          description="Descrição da gaveta lateral"
          footer={<button type="button">Ação</button>}
        >
          <p>Conteúdo do Drawer</p>
        </Drawer>
      );

      expect(screen.getByTestId('drawer-container')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Título da Gaveta');
      expect(screen.getByTestId('drawer-description')).toHaveTextContent('Descrição da gaveta lateral');
      expect(screen.getByText('Conteúdo do Drawer')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('drawer-close-btn'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <Drawer isOpen={false} onClose={() => {}}>
          <p>Hidden</p>
        </Drawer>
      );
      expect(screen.queryByTestId('drawer-container')).not.toBeInTheDocument();
    });

    it('uses an accessible fallback name when rendered without a title', () => {
      render(
        <Drawer isOpen={true} onClose={() => {}}>
          <p>Conteúdo sem título</p>
        </Drawer>
      );

      expect(screen.getByRole('dialog', { name: 'Gaveta lateral' })).toBeInTheDocument();
    });

    it('uses an explicit accessible label when rendered without a title', () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} ariaLabel="Filtros de atividades">
          <p>Filtros</p>
        </Drawer>
      );

      expect(screen.getByRole('dialog', { name: 'Filtros de atividades' })).toBeInTheDocument();
    });

    it('traps Tab focus and restores the opener focus when it closes', () => {
      const onClose = vi.fn();
      document.body.style.overflow = 'scroll';
      const { rerender } = render(
        <>
          <button type="button">Abrir gaveta</button>
          <Drawer isOpen={false} onClose={onClose} footer={<button type="button">Última ação</button>}>
            <button type="button">Primeira ação</button>
          </Drawer>
        </>
      );
      const opener = screen.getByRole('button', { name: 'Abrir gaveta' });
      opener.focus();

      rerender(
        <>
          <button type="button">Abrir gaveta</button>
          <Drawer isOpen={true} onClose={onClose} footer={<button type="button">Última ação</button>}>
            <button type="button">Primeira ação</button>
          </Drawer>
        </>
      );

      const closeButton = screen.getByTestId('drawer-close-btn');
      const lastAction = screen.getByRole('button', { name: 'Última ação' });
      expect(document.body.style.overflow).toBe('hidden');
      lastAction.focus();
      fireEvent.keyDown(lastAction, { key: 'Tab' });
      expect(closeButton).toHaveFocus();

      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
      expect(lastAction).toHaveFocus();

      rerender(
        <>
          <button type="button">Abrir gaveta</button>
          <Drawer isOpen={false} onClose={onClose} footer={<button type="button">Última ação</button>}>
            <button type="button">Primeira ação</button>
          </Drawer>
        </>
      );
      expect(opener).toHaveFocus();
      expect(document.body.style.overflow).toBe('scroll');
    });

    it('closes when Escape is unhandled inside the drawer', () => {
      function DrawerHarness() {
        const [isOpen, setIsOpen] = React.useState(true);
        return (
          <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <button type="button">Ação da gaveta</button>
          </Drawer>
        );
      }

      render(<DrawerHarness />);
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes when its scrim is clicked', () => {
      function DrawerHarness() {
        const [isOpen, setIsOpen] = React.useState(true);
        return <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>Conteúdo</Drawer>;
      }

      render(<DrawerHarness />);
      fireEvent.click(screen.getByTestId('drawer-backdrop'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders a bottom-anchored variant with a stable id when requested', () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} position="bottom" id="more-sheet-test">
          <p>Conteúdo do painel inferior</p>
        </Drawer>
      );

      const container = screen.getByTestId('drawer-container');
      expect(container).toHaveClass('ui-drawer--bottom');
      expect(container).toHaveAttribute('id', 'more-sheet-test');
    });
  });

  describe('TabBar', () => {
    const primaryItems = [
      { id: 'home', label: 'Início', href: '/', icon: <span aria-hidden="true">H</span>, active: true },
      { id: 'devotional', label: 'Devocional', href: '/devotional', icon: <span aria-hidden="true">D</span> },
    ];

    it('renders the primary items as links and a Mais button reflecting sheet state', () => {
      const onOpenMore = vi.fn();
      const { rerender } = render(
        <TabBar
          items={primaryItems}
          moreActive={false}
          moreOpen={false}
          onOpenMore={onOpenMore}
          moreControlsId="more-sheet-id"
        />
      );

      expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Devocional' })).not.toHaveAttribute('aria-current');

      const moreButton = screen.getByRole('button', { name: 'Mais' });
      expect(moreButton).toHaveAttribute('aria-haspopup', 'dialog');
      expect(moreButton).toHaveAttribute('aria-expanded', 'false');
      expect(moreButton).toHaveAttribute('aria-controls', 'more-sheet-id');
      expect(moreButton).not.toHaveClass('ui-tab-bar-link--active');

      fireEvent.click(moreButton);
      expect(onOpenMore).toHaveBeenCalledTimes(1);

      rerender(
        <TabBar
          items={primaryItems}
          moreActive={true}
          moreOpen={true}
          onOpenMore={onOpenMore}
          moreControlsId="more-sheet-id"
        />
      );
      expect(screen.getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Mais' })).toHaveClass('ui-tab-bar-link--active');
    });

    it('forwards an injected navigation link renderer', () => {
      render(
        <TabBar
          items={primaryItems}
          moreActive={false}
          moreOpen={false}
          onOpenMore={() => {}}
          renderNavigationLink={({ href, ...linkProps }) => (
            <a {...linkProps} href={`/adapted${href}`} data-adapted-link="true" />
          )}
        />
      );

      const link = screen.getByRole('link', { name: 'Início' });
      expect(link).toHaveAttribute('href', '/adapted/');
      expect(link).toHaveAttribute('data-adapted-link', 'true');
    });
  });

  describe('Dropdown', () => {
    it('opens dropdown on trigger click and calls action on item select', () => {
      const handleClick = vi.fn();
      render(
        <Dropdown
          trigger={<button type="button">Opções</button>}
          items={[
            { id: 'edit', label: 'Editar', onClick: handleClick },
            { id: 'delete', label: 'Excluir', danger: true },
          ]}
        />
      );

      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Opções'));
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('dropdown-item-edit'));
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });

    it('links its trigger and menu, moves focus with ArrowDown, and restores it on Escape', () => {
      const onEdit = vi.fn();
      render(
        <Dropdown
          trigger={<button type="button">Opções</button>}
          items={[
            { id: 'edit', label: 'Editar', onClick: onEdit },
            { id: 'delete', label: 'Excluir' },
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: 'Opções' });
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });

      const menu = screen.getByRole('menu');
      expect(trigger).toHaveAttribute('aria-controls', menu.id);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
      expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus();
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
      expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(trigger).toHaveFocus();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('activates the focused item with Space', () => {
      const onEdit = vi.fn();
      render(
        <Dropdown
          trigger={<button type="button">Opções</button>}
          items={[{ id: 'edit', label: 'Editar', onClick: onEdit }]}
        />
      );

      const trigger = screen.getByRole('button', { name: 'Opções' });
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      fireEvent.keyDown(document.activeElement!, { key: ' ' });

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes when a pointer interaction occurs outside the disclosure', () => {
      render(
        <Dropdown trigger={<button type="button">Opções</button>} items={[{ id: 'edit', label: 'Editar' }]} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Opções' }));
      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('leaves a containing drawer open when its Escape event handles the dropdown first', () => {
      function DrawerWithDropdown() {
        const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
        return (
          <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
            <Dropdown trigger={<button type="button">Opções da gaveta</button>} items={[{ label: 'Editar' }]} />
          </Drawer>
        );
      }

      render(<DrawerWithDropdown />);
      const trigger = screen.getByRole('button', { name: 'Opções da gaveta' });
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();

      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('normalizes a non-button element trigger to keyboard-accessible button semantics', () => {
      render(
        <Dropdown
          trigger={<span>Mais opções</span>}
          items={[{ id: 'edit', label: 'Editar' }]}
        />
      );

      const trigger = screen.getByRole('button', { name: 'Mais opções' });
      expect(trigger).toHaveAttribute('tabindex', '0');

      trigger.focus();
      fireEvent.keyDown(trigger, { key: ' ' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
    });
  });

  describe('Tooltip', () => {
    it('describes the trigger with the tooltip after hover', async () => {
      render(
        <Tooltip content="Informação auxiliar">
          <button type="button">Passe o mouse</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Passe o mouse' });
      fireEvent.mouseEnter(trigger);

      const tooltip = await screen.findByRole('tooltip');
      expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    });

    it('describes the trigger with the visible tooltip on keyboard focus', () => {
      render(
        <Tooltip content="Informação auxiliar">
          <button type="button">Passe o mouse</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Passe o mouse' });
      trigger.focus();
      fireEvent.focus(trigger);

      const tooltip = screen.getByRole('tooltip');
      expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    });

    it('stays visible when hover ends while keyboard focus remains active', () => {
      render(
        <Tooltip content="Informação auxiliar">
          <button type="button">Ajuda persistente</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Ajuda persistente' });
      trigger.focus();
      fireEvent.focus(trigger);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('stays visible when focus ends while hover remains active', async () => {
      render(
        <Tooltip content="Informação auxiliar" delayMs={0}>
          <button type="button">Ajuda persistente</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Ajuda persistente' });
      fireEvent.mouseEnter(trigger);
      await screen.findByRole('tooltip');

      trigger.focus();
      fireEvent.focus(trigger);
      fireEvent.blur(trigger);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('SectionHeader', () => {
    it('renders title, description and action', () => {
      render(
        <SectionHeader
          title="Seção Acadêmica"
          description="Gerencie as metas da família"
          action={<button type="button">Adicionar</button>}
        />
      );

      expect(screen.getByTestId('section-header-title')).toHaveTextContent('Seção Acadêmica');
      expect(screen.getByTestId('section-header-description')).toHaveTextContent('Gerencie as metas da família');
      expect(screen.getByText('Adicionar')).toBeInTheDocument();
    });
  });

  describe('DataList', () => {
    it('renders list items with label and value', () => {
      render(
        <DataList
          items={[
            { id: '1', label: 'Educando', value: 'Samuel' },
            { id: '2', label: 'Etapa', value: 'Gramática', helperText: 'Fase inicial' },
          ]}
        />
      );

      expect(screen.getByTestId('data-list-item-1')).toHaveTextContent('Educando');
      expect(screen.getByTestId('data-list-item-1')).toHaveTextContent('Samuel');
      expect(screen.getByTestId('data-list-item-2')).toHaveTextContent('Fase inicial');
    });
  });

  describe('AppShell', () => {
    const navigationItems = [
      { id: 'home', label: 'Início', href: '/', icon: <span aria-hidden="true">H</span>, active: true },
      { id: 'learners', label: 'Educandos', href: '/learners', icon: <span aria-hidden="true">L</span> },
    ];

    it('exports a named sidebar landmark with active and collapsed navigation semantics', () => {
      const onCollapse = vi.fn();
      const { rerender } = render(
        <Sidebar
          brandTitle="Aletheia Test"
          items={navigationItems}
          collapsed={false}
          onCollapse={onCollapse}
          footer={<span>Família Santos</span>}
        />
      );

      expect(screen.getByRole('complementary', { name: 'Navegação principal' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText('Família Santos')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Recolher barra lateral' }));
      expect(onCollapse).toHaveBeenCalledWith(true);

      rerender(
        <Sidebar
          brandTitle="Aletheia Test"
          items={navigationItems}
          collapsed={true}
          onCollapse={onCollapse}
        />
      );
      expect(screen.queryByText('Início')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toBeInTheDocument();
    });

    it('exports a topbar banner with a named mobile navigation control and actions', () => {
      const onOpenNavigation = vi.fn();
      render(
        <Topbar onOpenNavigation={onOpenNavigation} actions={<button type="button">Perfil</button>} />
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Abrir navegação' }));
      expect(onOpenNavigation).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'Perfil' })).toBeInTheDocument();
    });

    it('exports mobile navigation that is absent when closed and closes from its controls', () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <MobileNavigation
          items={navigationItems}
          open={false}
          onClose={onClose}
          label="Navegação móvel"
        />
      );

      expect(screen.queryByRole('dialog', { name: 'Navegação móvel' })).not.toBeInTheDocument();

      rerender(
        <MobileNavigation
          items={navigationItems}
          open={true}
          onClose={onClose}
          label="Navegação móvel"
        />
      );
      expect(screen.getByRole('dialog', { name: 'Navegação móvel' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Navegação móvel' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');

      fireEvent.click(screen.getByRole('button', { name: 'Fechar navegação' }));
      expect(onClose).toHaveBeenCalledTimes(1);

      const learnersLink = screen.getByRole('link', { name: 'Educandos' });
      learnersLink.addEventListener('click', (event) => event.preventDefault());
      fireEvent.click(learnersLink);
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('moves focus into mobile navigation, closes on Escape, and restores the opener', () => {
      function MobileNavigationHarness() {
        const [open, setOpen] = React.useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>Abrir painel</button>
            <MobileNavigation
              items={navigationItems}
              open={open}
              onClose={() => setOpen(false)}
              label="Navegação móvel"
            />
          </>
        );
      }

      document.body.style.overflow = 'scroll';
      render(<MobileNavigationHarness />);
      const opener = screen.getByRole('button', { name: 'Abrir painel' });
      opener.focus();
      fireEvent.click(opener);

      const closeButton = screen.getByRole('button', { name: 'Fechar navegação' });
      const lastLink = screen.getByRole('link', { name: 'Educandos' });
      expect(document.body.style.overflow).toBe('hidden');
      expect(closeButton).toHaveFocus();
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
      expect(lastLink).toHaveFocus();
      fireEvent.keyDown(lastLink, { key: 'Tab' });
      expect(closeButton).toHaveFocus();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Navegação móvel' })).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(document.body.style.overflow).toBe('scroll');
    });

    it('composes responsive navigation, topbar, and content while owning their UI state', () => {
      render(
        <AppShell
          brandTitle="Aletheia Test"
          navigationItems={navigationItems}
          topbarActions={<button type="button">Perfil</button>}
        >
          <div>Conteúdo Principal</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-topbar')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-nav-home')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText('Conteúdo Principal')).toBeInTheDocument();

      const openButton = screen.getByRole('button', { name: 'Abrir navegação' });
      fireEvent.click(openButton);
      const mobileNavigation = screen.getByRole('dialog', { name: 'Navegação móvel' });
      expect(openButton).toHaveAttribute('aria-controls', mobileNavigation.id);
      fireEvent.click(screen.getByRole('button', { name: 'Fechar navegação' }));
      expect(screen.queryByRole('dialog', { name: 'Navegação móvel' })).not.toBeInTheDocument();
    });

    it('forwards an injected navigation link renderer to desktop and mobile navigation', () => {
      render(
        <AppShell
          navigationItems={navigationItems}
          renderNavigationLink={({ href, ...linkProps }) => (
            <a {...linkProps} href={`/adapted${href}`} data-adapted-link="true" />
          )}
        >
          <div>Conteúdo Principal</div>
        </AppShell>
      );

      const desktopLink = screen.getByTestId('appshell-nav-home');
      expect(desktopLink).toHaveAttribute('href', '/adapted/');
      expect(desktopLink).toHaveAttribute('data-adapted-link', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Abrir navegação' }));
      const mobileNavigation = screen.getByRole('dialog', { name: 'Navegação móvel' });
      const mobileLink = within(mobileNavigation).getByRole('link', { name: 'Início' });
      expect(mobileLink).toHaveAttribute('href', '/adapted/');
      expect(mobileLink).toHaveAttribute('data-adapted-link', 'true');
    });

    it('closes mobile navigation and moves focus into desktop navigation beyond the breakpoint', () => {
      let matches = true;
      const listeners = new Set<(event: MediaQueryListEvent) => void>();
      const mediaQueryList = {
        get matches() {
          return matches;
        },
        media: '(max-width: 1024px)',
        onchange: null,
        addEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
        removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
        dispatchEvent: (event: Event) => {
          listeners.forEach((listener) => listener(event as MediaQueryListEvent));
          return true;
        },
      } as unknown as MediaQueryList;
      const originalMatchMedia = window.matchMedia;
      const matchMedia = vi.fn(() => mediaQueryList);
      Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });

      try {
        document.body.style.overflow = 'scroll';
        render(
          <AppShell
            navigationItems={navigationItems}
            topbarActions={<button type="button">Perfil</button>}
          >
            <div>Conteúdo Principal</div>
          </AppShell>
        );

        const opener = screen.getByRole('button', { name: 'Abrir navegação' });
        opener.focus();
        fireEvent.click(opener);
        expect(screen.getByRole('dialog', { name: 'Navegação móvel' })).toBeInTheDocument();
        expect(document.body.style.overflow).toBe('hidden');

        act(() => {
          matches = false;
          mediaQueryList.dispatchEvent({ matches, media: mediaQueryList.media } as MediaQueryListEvent);
        });

        expect(matchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
        expect(screen.queryByRole('dialog', { name: 'Navegação móvel' })).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('scroll');
        expect(screen.getByTestId('appshell-nav-home')).toHaveFocus();
        expect(opener).not.toHaveFocus();
      } finally {
        Object.defineProperty(window, 'matchMedia', {
          configurable: true,
          writable: true,
          value: originalMatchMedia,
        });
      }
    });
  });

  describe('Patterns: DailyJourney & ActivityList', () => {
    it('renders DailyJourney with calculated metrics', () => {
      render(
        <DailyJourney
          completedMinutes={120}
          targetMinutes={240}
          completedLessons={3}
          totalLessons={6}
          daySequence={45}
        />
      );

      expect(screen.getByText('Jornada Diária de Aprendizagem')).toBeInTheDocument();
      expect(screen.getByText('50% da Meta')).toBeInTheDocument();
      expect(screen.getByText('3/6')).toBeInTheDocument();
    });

    it('exports DailyJourney with a finite zero-width progress bar for a zero-minute target', () => {
      render(
        <DailyJourney
          completedMinutes={0}
          targetMinutes={0}
          completedLessons={0}
          totalLessons={0}
          daySequence={1}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveStyle({ width: '0%' });
      expect(progressBar.getAttribute('style')).not.toContain('NaN');
    });

    it('renders ActivityList and handles toggle for completable types only', () => {
      const handleToggle = vi.fn();
      render(
        <ActivityList
          activities={[
            { id: '1', title: 'Leitura Bíblica', completed: false, type: 'devotional' },
            { id: '2', title: 'Matemática', completed: true, type: 'lesson' },
          ]}
          onToggleComplete={handleToggle}
          completableTypes={['lesson']}
        />
      );

      expect(screen.getByText('Atividades de Hoje')).toBeInTheDocument();
      expect(screen.getByText('1 de 2 atividades concluídas')).toBeInTheDocument();

      expect(screen.queryByTestId('toggle-activity-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-activity-2')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('toggle-activity-2'));
      expect(handleToggle).toHaveBeenCalledWith('2');
    });

    it('defaults to allowing completion controls for all activity types', () => {
      const handleToggle = vi.fn();
      render(
        <ActivityList
          activities={[
            { id: '1', title: 'Ritual Noturno', completed: false, type: 'routine' },
          ]}
          onToggleComplete={handleToggle}
        />
      );

      expect(screen.getByTestId('toggle-activity-1')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('toggle-activity-1'));
      expect(handleToggle).toHaveBeenCalledWith('1');
    });
  });
});
