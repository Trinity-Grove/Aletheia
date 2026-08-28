import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input, Select, Textarea, Switch } from '../src/components/ui';

describe('UI Primitives: Form Controls', () => {
  afterEach(cleanup);

  describe('Input', () => {
    it('renders with label, placeholder, helperText and value', () => {
      render(
        <Input
          label="Nome do Educando"
          placeholder="Ex: Pedro"
          helperText="Informe o primeiro nome"
          defaultValue="Pedro"
        />
      );

      expect(screen.getByTestId('input-label')).toHaveTextContent('Nome do Educando');
      expect(screen.getByTestId('ui-input')).toHaveValue('Pedro');
      expect(screen.getByTestId('input-helper-text')).toHaveTextContent('Informe o primeiro nome');
      expect(screen.queryByTestId('input-error-text')).not.toBeInTheDocument();
    });

    it('renders error message and sets aria-invalid', () => {
      render(
        <Input
          label="Email"
          error="Email inválido"
          defaultValue="invalido"
        />
      );

      expect(screen.getByTestId('input-error-text')).toHaveTextContent('Email inválido');
      expect(screen.getByTestId('ui-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('ui-input')).toHaveAttribute('data-error', 'true');
    });

    it('renders left and right icons when provided', () => {
      render(
        <Input
          label="Busca"
          leftIcon={<Search data-testid="search-icon" size={16} />}
          rightIcon={<X data-testid="clear-icon" size={16} />}
        />
      );

      expect(screen.getByTestId('input-left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('input-right-icon')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    it('renders options and handles value change', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'GRAMMAR', label: 'Gramática' },
        { value: 'LOGIC', label: 'Lógica' },
        { value: 'RHETORIC', label: 'Retórica' },
      ];

      render(
        <Select
          label="Etapa de Aprendizagem"
          options={options}
          defaultValue="LOGIC"
          onChange={handleChange}
        />
      );

      expect(screen.getByTestId('select-label')).toHaveTextContent('Etapa de Aprendizagem');
      const select = screen.getByTestId('ui-select') as HTMLSelectElement;
      expect(select.value).toBe('LOGIC');

      fireEvent.change(select, { target: { value: 'RHETORIC' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders error text and aria-invalid on select', () => {
      render(
        <Select
          label="Opção Obrigatória"
          error="Selecione um item"
        >
          <option value="">Selecione...</option>
        </Select>
      );

      expect(screen.getByTestId('select-error-text')).toHaveTextContent('Selecione um item');
      expect(screen.getByTestId('ui-select')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Textarea', () => {
    it('renders with label and handles multiline text entry', () => {
      render(
        <Textarea
          label="Reflexão Bíblica"
          placeholder="Escreva suas anotações..."
          defaultValue="A sabedoria edifica a casa."
          rows={5}
        />
      );

      expect(screen.getByTestId('textarea-label')).toHaveTextContent('Reflexão Bíblica');
      const textarea = screen.getByTestId('ui-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('A sabedoria edifica a casa.');
      expect(textarea.rows).toBe(5);
    });

    it('renders error state on textarea', () => {
      render(
        <Textarea
          label="Descrição"
          error="Campo obrigatório"
        />
      );

      expect(screen.getByTestId('textarea-error-text')).toHaveTextContent('Campo obrigatório');
      expect(screen.getByTestId('ui-textarea')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Switch', () => {
    it('renders with label, description and toggles state', () => {
      function SwitchWrapper() {
        const [checked, setChecked] = useState(false);
        return (
          <Switch
            label="Lembretes Diários"
            description="Receba avisos para o culto doméstico"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        );
      }

      render(<SwitchWrapper />);

      expect(screen.getByTestId('switch-label')).toHaveTextContent('Lembretes Diários');
      expect(screen.getByTestId('switch-description')).toHaveTextContent('Receba avisos para o culto doméstico');

      const input = screen.getByTestId('ui-switch-input') as HTMLInputElement;
      expect(input.checked).toBe(false);

      fireEvent.click(screen.getByTestId('switch-wrapper'));
      expect(input.checked).toBe(true);
    });
  });
});
