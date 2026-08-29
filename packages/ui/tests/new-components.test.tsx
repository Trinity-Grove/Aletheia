import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { Drawer, Dropdown, Tooltip } from '../src/index.js';

describe('accessible overlay primitives', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('traps Tab focus and restores the opener focus and body scroll when it closes', () => {
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

  it('links the trigger to its menu, navigates items, activates selection, and restores focus on Escape', () => {
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
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(trigger).toHaveFocus();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes a dropdown after an outside pointer interaction', () => {
    render(<Dropdown trigger={<button type="button">Opções</button>} items={[{ id: 'edit', label: 'Editar' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Opções' }));
    fireEvent.mouseDown(document.body);
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

    fireEvent.keyDown(screen.getByRole('button', { name: 'Opções' }), { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement!, { key: ' ' });
    expect(onEdit).toHaveBeenCalledTimes(1);
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

  it('describes its focused trigger with the visible tooltip', () => {
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

  it('describes its hovered trigger with the visible tooltip', async () => {
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
});
