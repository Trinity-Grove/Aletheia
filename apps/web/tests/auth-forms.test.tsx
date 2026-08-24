import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LoginForm } from '../src/components/auth/login-form';
import { RegisterForm } from '../src/components/auth/register-form';

describe('Auth Forms Component Tests', () => {
  afterEach(() => {
    cleanup();
  });

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
});
