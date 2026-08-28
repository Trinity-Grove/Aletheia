import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { BookOpen, Trash2, User } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Progress,
  ScriptureCard,
  Select,
  Switch,
  TextLink,
  Textarea,
} from '../src/index.js';

describe('@aletheia/ui Component Primitives', () => {
  afterEach(cleanup);

  describe('Button & IconButton & TextLink', () => {
    it('renders Button with variants, sizes and handles clicks', () => {
      const handleClick = vi.fn();
      render(
        <Button variant="primary" size="md" onClick={handleClick} leftIcon={<BookOpen size={16} data-testid="book-icon" />}>
          Confirmar
        </Button>
      );

      const btn = screen.getByTestId('button');
      expect(btn).toHaveTextContent('Confirmar');
      expect(screen.getByTestId('book-icon')).toBeInTheDocument();
      expect(btn).toHaveAttribute('data-variant', 'primary');
      expect(btn).toHaveAttribute('data-size', 'md');
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders Button spinner when isLoading is true and disables it', () => {
      render(<Button isLoading>Salvando</Button>);
      const btn = screen.getByTestId('button');
      expect(btn).toBeDisabled();
      expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    });

    it('renders IconButton with aria-label and icon', () => {
      render(<IconButton aria-label="Excluir item" icon={<Trash2 size={16} data-testid="trash-icon" />} />);
      const btn = screen.getByTestId('icon-button');
      expect(btn).toHaveAttribute('aria-label', 'Excluir item');
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('renders TextLink with href', () => {
      render(<TextLink href="/login">Ir para Login</TextLink>);
      const link = screen.getByTestId('text-link');
      expect(link).toHaveAttribute('href', '/login');
      expect(link).toHaveTextContent('Ir para Login');
    });
  });

  describe('Card', () => {
    it('renders Card with header, title, description, content and footer', () => {
      render(
        <Card variant="bordered" shadow="md">
          <CardHeader>
            <CardTitle>Título</CardTitle>
            <CardDescription>Descrição</CardDescription>
          </CardHeader>
          <CardContent>Corpo</CardContent>
          <CardFooter>Rodapé</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'bordered');
      expect(screen.getByTestId('card-title')).toHaveTextContent('Título');
      expect(screen.getByTestId('card-description')).toHaveTextContent('Descrição');
      expect(screen.getByTestId('card-content')).toHaveTextContent('Corpo');
      expect(screen.getByTestId('card-footer')).toHaveTextContent('Rodapé');
    });
  });

  describe('Badge', () => {
    it('renders Badge with variants and dot', () => {
      render(<Badge variant="emerald" dot>Concluído</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'emerald');
      expect(badge).toHaveTextContent('Concluído');
      expect(screen.getByTestId('badge-dot')).toBeInTheDocument();
    });
  });

  describe('Form Primitives', () => {
    it('renders Input with label, error, helperText, and icons', () => {
      render(
        <Input
          label="Nome"
          error="Nome é obrigatório"
          helperText="Informe seu nome completo"
          leftIcon={<User size={16} data-testid="user-icon" />}
          defaultValue="João"
        />
      );

      expect(screen.getByTestId('input-label')).toHaveTextContent('Nome');
      expect(screen.getByTestId('ui-input')).toHaveValue('João');
      expect(screen.getByTestId('ui-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('input-error-text')).toHaveTextContent('Nome é obrigatório');
      expect(screen.getByTestId('input-left-icon')).toBeInTheDocument();
    });

    it('renders Select with options and handles change', () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Opção"
          options={[
            { value: '1', label: 'Opção 1' },
            { value: '2', label: 'Opção 2' },
          ]}
          defaultValue="1"
          onChange={handleChange}
        />
      );

      const select = screen.getByTestId('ui-select');
      expect(select).toHaveValue('1');
      fireEvent.change(select, { target: { value: '2' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders Textarea with label and value', () => {
      render(<Textarea label="Notas" defaultValue="Texto" rows={4} />);
      expect(screen.getByTestId('textarea-label')).toHaveTextContent('Notas');
      expect(screen.getByTestId('ui-textarea')).toHaveValue('Texto');
    });

    it('renders Checkbox with label and handles click', () => {
      const handleChange = vi.fn();
      render(<Checkbox label="Aceito os termos" onChange={handleChange} />);
      const input = screen.getByTestId('ui-checkbox-input');
      expect(input).not.toBeChecked();
      fireEvent.click(input);
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders Switch with label and description', () => {
      const handleChange = vi.fn();
      render(<Switch label="Notificações" description="Ativar alertas" onChange={handleChange} />);
      expect(screen.getByTestId('switch-label')).toHaveTextContent('Notificações');
      expect(screen.getByTestId('switch-description')).toHaveTextContent('Ativar alertas');
      const input = screen.getByTestId('ui-switch-input');
      fireEvent.click(input);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Feedback & Layout Primitives', () => {
    it('renders Alert with variant, title, and content', () => {
      render(
        <Alert variant="warning" title="Atenção">
          Verifique o horário da lição.
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-variant', 'warning');
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Atenção');
      expect(screen.getByTestId('alert-message')).toHaveTextContent('Verifique o horário da lição.');
    });

    it('renders Progress with aria attributes', () => {
      render(<Progress value={75} max={100} label="Progresso do currículo" />);
      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
      expect(progress).toHaveAttribute('aria-label', 'Progresso do currículo');
      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '75%' });
    });

    it('renders EmptyState with title, description, and action', () => {
      render(
        <EmptyState
          title="Nenhum educando cadastrado"
          description="Comece adicionando o primeiro educando da família."
          action={<button type="button">Adicionar</button>}
        />
      );

      expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Nenhum educando cadastrado');
      expect(screen.getByTestId('empty-state-description')).toHaveTextContent('Comece adicionando');
      expect(screen.getByTestId('empty-state-action')).toHaveTextContent('Adicionar');
    });

    it('renders PageHeader with eyebrow, title, description, and action', () => {
      render(
        <PageHeader
          eyebrow="Trinity Grove"
          title="Diário de Aprendizagem"
          description="Registro de atividades pedagógicas diárias."
          action={<button type="button">Novo Registro</button>}
        />
      );

      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent('Trinity Grove');
      expect(screen.getByTestId('page-header-title')).toHaveTextContent('Diário de Aprendizagem');
      expect(screen.getByTestId('page-header-description')).toHaveTextContent('Registro de atividades');
      expect(screen.getByTestId('page-header-action')).toHaveTextContent('Novo Registro');
    });

    it('renders ScriptureCard with verse and citation', () => {
      render(
        <ScriptureCard
          verseText="O temor do Senhor é o princípio da sabedoria."
          citation="Provérbios 9:10"
        />
      );

      expect(screen.getByTestId('scripture-card-verse')).toHaveTextContent('O temor do Senhor é o princípio da sabedoria.');
      expect(screen.getByTestId('scripture-card-citation')).toHaveTextContent('Provérbios 9:10');
    });
  });
});
