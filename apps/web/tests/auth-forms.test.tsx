import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginForm } from '../src/components/auth/login-form';
import { RegisterForm } from '../src/components/auth/register-form';
import { ForgotPasswordForm } from '../src/components/auth/forgot-password-form';
import { ResetPasswordForm } from '../src/components/auth/reset-password-form';

describe('Auth Forms Component Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('LoginForm', () => {
    it('renders LoginForm and handles validation', async () => {
      const handleSubmit = vi.fn();
      render(<LoginForm onSubmit={handleSubmit} />);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();

      const submitBtn = screen.getByTestId('login-button');
      fireEvent.click(submitBtn);

      // Form prevents empty submit or shows error
      fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'guardian@test.com' } });
      fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'guardian@test.com',
        password: 'password123',
      });
    });

    it('displays error message and handles loading state when onSubmit throws', async () => {
      let resolveSubmit!: () => void;
      const deferredPromise = new Promise<void>((_, reject) => {
        resolveSubmit = () => reject(new Error('Credenciais inválidas.'));
      });
      const handleSubmit = vi.fn().mockImplementation(() => deferredPromise);

      render(<LoginForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'guardian@test.com' } });
      fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'password123' } });

      const submitBtn = screen.getByTestId('login-button');
      fireEvent.click(submitBtn);

      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveTextContent('Entrando...');

      await act(async () => {
        resolveSubmit();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Credenciais inválidas.');
      });
      expect(submitBtn).not.toBeDisabled();
      expect(submitBtn).toHaveTextContent('Entrar');
    });
  });

  describe('RegisterForm', () => {
    it('renders RegisterForm and validates password confirmation', async () => {
      const handleSubmit = vi.fn();
      render(<RegisterForm onSubmit={handleSubmit} />);

      expect(screen.getByTestId('register-form')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('reg-name-input'), { target: { value: 'Guardian Parent' } });
      fireEvent.change(screen.getByTestId('reg-email-input'), { target: { value: 'guardian@test.com' } });
      fireEvent.change(screen.getByTestId('reg-password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('reg-confirm-password-input'), { target: { value: 'mismatch123' } });

      const submitBtn = screen.getByTestId('register-button');
      fireEvent.click(submitBtn);

      expect(screen.getByTestId('error-message')).toHaveTextContent('As senhas não conferem.');
      expect(handleSubmit).not.toHaveBeenCalled();

      // Now correct password
      fireEvent.change(screen.getByTestId('reg-confirm-password-input'), { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledWith({
        fullName: 'Guardian Parent',
        email: 'guardian@test.com',
        password: 'password123',
      });
    });

    it('validates minimum password length', async () => {
      const handleSubmit = vi.fn();
      render(<RegisterForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('reg-name-input'), { target: { value: 'Guardian Parent' } });
      fireEvent.change(screen.getByTestId('reg-email-input'), { target: { value: 'guardian@test.com' } });
      fireEvent.change(screen.getByTestId('reg-password-input'), { target: { value: '123' } });
      fireEvent.change(screen.getByTestId('reg-confirm-password-input'), { target: { value: '123' } });

      fireEvent.click(screen.getByTestId('register-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('A senha deve conter no mínimo 8 caracteres.');
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('displays error message and handles loading state when onSubmit throws', async () => {
      let resolveSubmit!: () => void;
      const deferredPromise = new Promise<void>((_, reject) => {
        resolveSubmit = () => reject(new Error('E-mail já cadastrado.'));
      });
      const handleSubmit = vi.fn().mockImplementation(() => deferredPromise);

      render(<RegisterForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('reg-name-input'), { target: { value: 'Guardian Parent' } });
      fireEvent.change(screen.getByTestId('reg-email-input'), { target: { value: 'guardian@test.com' } });
      fireEvent.change(screen.getByTestId('reg-password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('reg-confirm-password-input'), { target: { value: 'password123' } });

      const submitBtn = screen.getByTestId('register-button');
      fireEvent.click(submitBtn);

      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveTextContent('Cadastrando...');

      await act(async () => {
        resolveSubmit();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('E-mail já cadastrado.');
      });
      expect(submitBtn).not.toBeDisabled();
      expect(submitBtn).toHaveTextContent('Criar Conta de Guardião');
    });
  });

  describe('ForgotPasswordForm', () => {
    it('renders, validates a required email, and submits', async () => {
      const handleSubmit = vi.fn();
      render(<ForgotPasswordForm onSubmit={handleSubmit} />);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('forgot-password-button'));
      expect(screen.getByTestId('error-message')).toHaveTextContent('Por favor, informe seu e-mail.');
      expect(handleSubmit).not.toHaveBeenCalled();

      fireEvent.change(screen.getByTestId('forgot-password-email-input'), {
        target: { value: 'guardian@test.com' },
      });
      fireEvent.click(screen.getByTestId('forgot-password-button'));

      expect(handleSubmit).toHaveBeenCalledWith({ email: 'guardian@test.com' });
    });

    it('shows a generic success message after submitting, regardless of whether the account exists', async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ForgotPasswordForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('forgot-password-email-input'), {
        target: { value: 'guardian@test.com' },
      });
      fireEvent.click(screen.getByTestId('forgot-password-button'));

      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-success')).toHaveTextContent('guardian@test.com');
      });
      expect(screen.queryByTestId('forgot-password-form')).not.toBeInTheDocument();
    });

    it('displays an error message and handles loading state when onSubmit throws', async () => {
      let resolveSubmit!: () => void;
      const deferredPromise = new Promise<void>((_, reject) => {
        resolveSubmit = () => reject(new Error('Falha de rede.'));
      });
      const handleSubmit = vi.fn().mockImplementation(() => deferredPromise);

      render(<ForgotPasswordForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('forgot-password-email-input'), {
        target: { value: 'guardian@test.com' },
      });

      const submitBtn = screen.getByTestId('forgot-password-button');
      fireEvent.click(submitBtn);

      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveTextContent('Enviando...');

      await act(async () => {
        resolveSubmit();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Falha de rede.');
      });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('ResetPasswordForm', () => {
    it('shows an invalid-link message when there is no token', () => {
      render(<ResetPasswordForm token={null} />);

      expect(screen.getByTestId('reset-password-invalid-link')).toBeInTheDocument();
      expect(screen.queryByTestId('reset-password-form')).not.toBeInTheDocument();
    });

    it('validates password length and confirmation, then submits with the token', async () => {
      const handleSubmit = vi.fn();
      render(<ResetPasswordForm token="a-valid-token" onSubmit={handleSubmit} />);

      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('reset-password-new-input'), { target: { value: 'short' } });
      fireEvent.change(screen.getByTestId('reset-password-confirm-input'), { target: { value: 'short' } });
      fireEvent.click(screen.getByTestId('reset-password-button'));
      expect(screen.getByTestId('error-message')).toHaveTextContent('A senha deve conter no mínimo 8 caracteres.');
      expect(handleSubmit).not.toHaveBeenCalled();

      fireEvent.change(screen.getByTestId('reset-password-new-input'), { target: { value: 'newPassword123' } });
      fireEvent.change(screen.getByTestId('reset-password-confirm-input'), { target: { value: 'mismatch123' } });
      fireEvent.click(screen.getByTestId('reset-password-button'));
      expect(screen.getByTestId('error-message')).toHaveTextContent('As senhas não conferem.');
      expect(handleSubmit).not.toHaveBeenCalled();

      fireEvent.change(screen.getByTestId('reset-password-confirm-input'), { target: { value: 'newPassword123' } });
      fireEvent.click(screen.getByTestId('reset-password-button'));

      expect(handleSubmit).toHaveBeenCalledWith({ token: 'a-valid-token', newPassword: 'newPassword123' });
    });

    it('shows a success message after resetting', async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ResetPasswordForm token="a-valid-token" onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('reset-password-new-input'), { target: { value: 'newPassword123' } });
      fireEvent.change(screen.getByTestId('reset-password-confirm-input'), { target: { value: 'newPassword123' } });
      fireEvent.click(screen.getByTestId('reset-password-button'));

      await waitFor(() => {
        expect(screen.getByTestId('reset-password-success')).toBeInTheDocument();
      });
    });

    it('displays an error message and handles loading state when onSubmit throws', async () => {
      let resolveSubmit!: () => void;
      const deferredPromise = new Promise<void>((_, reject) => {
        resolveSubmit = () => reject(new Error('Este link de redefinição expirou.'));
      });
      const handleSubmit = vi.fn().mockImplementation(() => deferredPromise);

      render(<ResetPasswordForm token="a-valid-token" onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('reset-password-new-input'), { target: { value: 'newPassword123' } });
      fireEvent.change(screen.getByTestId('reset-password-confirm-input'), { target: { value: 'newPassword123' } });

      const submitBtn = screen.getByTestId('reset-password-button');
      fireEvent.click(submitBtn);

      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveTextContent('Redefinindo...');

      await act(async () => {
        resolveSubmit();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Este link de redefinição expirou.');
      });
      expect(submitBtn).not.toBeDisabled();
    });
  });
});
