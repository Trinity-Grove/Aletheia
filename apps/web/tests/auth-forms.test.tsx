import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginForm } from '../src/components/auth/login-form';
import { MfaVerifyForm } from '../src/components/auth/mfa-verify-form';
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

  describe('MfaVerifyForm', () => {
    it('renders MfaVerifyForm and submits the code', async () => {
      const handleSubmit = vi.fn();
      render(<MfaVerifyForm onSubmit={handleSubmit} />);

      expect(screen.getByTestId('mfa-verify-form')).toBeInTheDocument();
      expect(screen.getByTestId('mfa-code-input')).toBeInTheDocument();

      const submitBtn = screen.getByTestId('mfa-verify-button');
      fireEvent.click(submitBtn);

      fireEvent.change(screen.getByTestId('mfa-code-input'), { target: { value: '123456' } });
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledWith({ code: '123456' });
    });

    it('displays an error message when onSubmit throws', async () => {
      const handleSubmit = vi.fn().mockRejectedValue(new Error('Código inválido.'));
      render(<MfaVerifyForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('mfa-code-input'), { target: { value: '000000' } });
      fireEvent.click(screen.getByTestId('mfa-verify-button'));

      await waitFor(() => {
        expect(screen.getByTestId('mfa-verify-error')).toHaveTextContent('Código inválido.');
      });
    });
  });

  describe('RegisterForm', () => {
    it('keeps both consent checkboxes disabled until their document has been opened and read', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => [
          { code: 'TERMS_OF_USE_LGPD', title: 'Termos de Uso', content: '# Termos\n\nConteúdo curto.' },
          { code: 'PRIVACY_POLICY_LGPD', title: 'Política de Privacidade', content: '# Política\n\nConteúdo curto.' },
        ],
      } as Response);

      render(<RegisterForm onSubmit={vi.fn()} />);

      const termsCheckbox = screen.getByTestId('reg-terms-of-use-checkbox') as HTMLInputElement;
      const privacyCheckbox = screen.getByTestId('reg-privacy-policy-checkbox') as HTMLInputElement;

      expect(termsCheckbox).toBeDisabled();
      expect(privacyCheckbox).toBeDisabled();
      expect(screen.getByTestId('reg-terms-of-use-hint')).toBeInTheDocument();

      // Opening and closing the Terms of Use document is enough to mark
      // it read in this test environment (jsdom reports no scrollable
      // overflow), matching the "document fits without scrolling" case
      // -- the dedicated scroll-tracking behavior itself is covered by
      // the two tests below.
      fireEvent.click(screen.getByTestId('reg-view-terms-of-use'));
      expect(screen.getByTestId('reg-document-viewer')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Fechar'));

      await waitFor(() => {
        expect(termsCheckbox).not.toBeDisabled();
      });
      expect(privacyCheckbox).toBeDisabled();
    });

    it('only enables the checkbox once the document viewer is scrolled all the way to the bottom', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => [
          { code: 'TERMS_OF_USE_LGPD', title: 'Termos de Uso', content: '# Termos\n\nConteúdo longo.' },
        ],
      } as Response);

      // jsdom does no real layout (scrollHeight/clientHeight are always
      // 0), so a genuinely scrollable, not-yet-fully-read document has
      // to be simulated by stubbing these getters before the component
      // ever measures them.
      const scrollHeightSpy = vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
      const clientHeightSpy = vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(400);

      try {
        render(<RegisterForm onSubmit={vi.fn()} />);

        // Let the mocked published-definitions fetch resolve before
        // opening the document -- otherwise the viewer opens with no
        // definition yet loaded and auto-marks itself read (nothing to
        // gate on), which is a different, already separately-tested
        // path (see "always shows both consent links as clickable...").
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        });

        fireEvent.click(screen.getByTestId('reg-view-terms-of-use'));
        const scrollArea = screen.getByTestId('reg-document-viewer-scroll-area');
        expect(screen.getByTestId('reg-terms-of-use-checkbox')).toBeDisabled();

        fireEvent.scroll(scrollArea, { target: { scrollTop: 100 } });
        expect(screen.getByTestId('reg-terms-of-use-checkbox')).toBeDisabled();

        fireEvent.scroll(scrollArea, { target: { scrollTop: 600 } }); // 600 + 400 === 1000 -- reached the end
        await waitFor(() => {
          expect(screen.getByTestId('reg-terms-of-use-checkbox')).not.toBeDisabled();
        });
      } finally {
        scrollHeightSpy.mockRestore();
        clientHeightSpy.mockRestore();
      }
    });

    it('always shows both consent links as clickable, even when the document fails to load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response);

      render(<RegisterForm onSubmit={vi.fn()} />);

      fireEvent.click(screen.getByTestId('reg-view-terms-of-use'));
      expect(screen.getByTestId('reg-document-unavailable')).toBeInTheDocument();

      // Nothing to read -- the checkbox must not stay permanently
      // disabled just because the document failed to load.
      await waitFor(() => {
        expect(screen.getByTestId('reg-terms-of-use-checkbox')).not.toBeDisabled();
      });
    });

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
      fireEvent.click(screen.getByTestId('reg-terms-of-use-checkbox'));
      fireEvent.click(screen.getByTestId('reg-privacy-policy-checkbox'));
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledWith({
        fullName: 'Guardian Parent',
        email: 'guardian@test.com',
        password: 'password123',
        countryCode: 'BRA',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      });
    });

    it('requires both Terms of Use and Privacy Policy acceptance before submitting', async () => {
      const handleSubmit = vi.fn();
      render(<RegisterForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByTestId('reg-name-input'), { target: { value: 'Guardian Parent' } });
      fireEvent.change(screen.getByTestId('reg-email-input'), { target: { value: 'guardian@test.com' } });
      fireEvent.change(screen.getByTestId('reg-password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('reg-confirm-password-input'), { target: { value: 'password123' } });

      fireEvent.click(screen.getByTestId('register-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'É necessário aceitar os Termos de Uso e a Política de Privacidade para se cadastrar.',
      );
      expect(handleSubmit).not.toHaveBeenCalled();
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
      fireEvent.click(screen.getByTestId('reg-terms-of-use-checkbox'));
      fireEvent.click(screen.getByTestId('reg-privacy-policy-checkbox'));

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
