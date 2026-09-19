import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type {
  DonationIntentResponseDto,
  DonationRecordResponseDto,
  SupporterSubscriptionResponseDto,
} from '@aletheia/contracts';
import QRCode from 'qrcode';
import { DonationFormCard } from '../src/components/support/donation-form-card';
import { DonationReceiptsTable } from '../src/components/support/donation-receipts-table';
import { SupporterSettingsCard } from '../src/components/settings/supporter-settings-card';
import { MAIN_NAV_ITEMS } from '../src/components/layout/product-shell';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQrCodeDataUrl'),
  },
}));

const mockQrToDataURL = QRCode.toDataURL as ReturnType<typeof vi.fn>;

const testFamilyId = '11111111-1111-1111-1111-111111111111';

const mockDonationIntent: DonationIntentResponseDto = {
  donationId: '22222222-2222-2222-2222-222222222222',
  amountCents: 3000,
  currency: 'BRL',
  status: 'PENDING',
  paymentMethod: 'PIX',
  frequency: 'ONE_TIME',
  pixCopiaECola: '00020126580014br.gov.bcb.pix0136test-pix-key',
  pixQrCodeUrl: 'https://pix.example.com/qr/22222222',
  expiresAt: '2026-09-20T00:00:00.000Z',
  createdAt: '2026-09-19T00:00:00.000Z',
};

const mockHistory: DonationRecordResponseDto[] = [
  {
    id: 'rec-1',
    familyId: testFamilyId,
    donorName: 'Família Silva',
    donorEmail: 'silva@example.com',
    amountCents: 3000,
    currency: 'BRL',
    frequency: 'ONE_TIME',
    paymentMethod: 'PIX',
    status: 'CONFIRMED',
    pixCopiaECola: '00020126580014br.gov.bcb.pix0136test-pix-key',
    confirmedAt: '2026-09-18T15:30:00.000Z',
    createdAt: '2026-09-18T15:25:00.000Z',
  },
  {
    id: 'rec-2',
    familyId: testFamilyId,
    donorName: 'Família Silva',
    donorEmail: 'silva@example.com',
    amountCents: 5000,
    currency: 'BRL',
    frequency: 'MONTHLY',
    paymentMethod: 'PIX',
    status: 'PENDING',
    pixCopiaECola: null,
    confirmedAt: null,
    createdAt: '2026-09-19T08:00:00.000Z',
  },
];

const mockSubscriptions: SupporterSubscriptionResponseDto[] = [
  {
    id: 'sub-1',
    familyId: testFamilyId,
    amountCents: 5000,
    currency: 'BRL',
    paymentMethod: 'PIX',
    status: 'CONFIRMED',
    gatewaySubscriptionId: 'sub_test_123',
    cancelledAt: null,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  },
];

describe('Donation & Voluntary Support Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQrToDataURL.mockResolvedValue('data:image/png;base64,mockQrCodeDataUrl');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('DonationFormCard', () => {
    it('renders frequency toggle, quick amount buttons and warm welcoming philosophy', () => {
      render(<DonationFormCard familyId={testFamilyId} />);

      // Warm message
      expect(screen.getByText(/100% gratuito/i)).toBeInTheDocument();

      // Frequencies
      expect(screen.getByRole('button', { name: /doação única/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apoio mensal/i })).toBeInTheDocument();

      // Quick amount buttons
      expect(screen.getByRole('button', { name: /r\$\s*15/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /r\$\s*30/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /r\$\s*50/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /r\$\s*100/i })).toBeInTheDocument();

      // Payment method selectors
      expect(screen.getByLabelText(/pix/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/google pay/i)).toBeInTheDocument();
    });

    it('validates custom amount to enforce minimum of R$ 5,00 (500 cents)', async () => {
      render(<DonationFormCard familyId={testFamilyId} />);

      const customInput = screen.getByTestId('custom-amount-input');
      fireEvent.change(customInput, { target: { value: '3,50' } });

      const submitButton = screen.getByTestId('submit-donation-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('donation-form-error')).toHaveTextContent(/mínimo.*r\$\s*5/i);
      });
    });

    it('generates PIX QR Code, allows copying Copia-e-Cola code, and polls status until confirmed', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // 1. Create intent
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonationIntent,
      });

      // 2. Status polling - first PENDING, then CONFIRMED
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockHistory[0],
          status: 'PENDING',
        }),
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockHistory[0],
          status: 'CONFIRMED',
        }),
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      const onDonationSuccess = vi.fn();

      render(
        <DonationFormCard
          familyId={testFamilyId}
          onDonationSuccess={onDonationSuccess}
          pollingIntervalMs={50}
        />
      );

      // Select R$ 30
      const amount30Btn = screen.getByRole('button', { name: /r\$\s*30/i });
      fireEvent.click(amount30Btn);

      // Submit
      const submitButton = screen.getByTestId('submit-donation-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `/api/v1/families/${testFamilyId}/donations/create-intent`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              amountCents: 3000,
              frequency: 'ONE_TIME',
              paymentMethod: 'PIX',
            }),
          }),
        );
      });

      // QR Code and Copia-e-cola should appear
      await waitFor(() => {
        expect(screen.getByTestId('pix-qr-code-image')).toBeInTheDocument();
        expect(screen.getByTestId('pix-copia-cola-text')).toHaveTextContent(mockDonationIntent.pixCopiaECola!);
      });

      // Copy PIX button
      const copyButton = screen.getByTestId('copy-pix-button');
      fireEvent.click(copyButton);

      expect(writeTextMock).toHaveBeenCalledWith(mockDonationIntent.pixCopiaECola);
      await waitFor(() => {
        expect(screen.getByText(/código copiado/i)).toBeInTheDocument();
      });

      // Status celebration after polling confirms
      await waitFor(() => {
        expect(screen.getByTestId('donation-success-celebration')).toBeInTheDocument();
        expect(onDonationSuccess).toHaveBeenCalled();
      });
    });

    it('submits Google Pay donation intent when Google Pay is selected', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDonationIntent,
          paymentMethod: 'GOOGLE_PAY',
          gatewayClientSecret: 'pi_secret_123',
        }),
      });

      render(<DonationFormCard familyId={testFamilyId} />);

      // Switch to Google Pay
      const googlePayRadio = screen.getByLabelText(/google pay/i);
      fireEvent.click(googlePayRadio);

      const submitBtn = screen.getByTestId('google-pay-button');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `/api/v1/families/${testFamilyId}/donations/create-intent`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"paymentMethod":"GOOGLE_PAY"'),
          }),
        );
      });
    });

    it('correctly parses custom amount with Brazilian thousand separators like 1.500,00', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonationIntent,
      });

      render(<DonationFormCard familyId={testFamilyId} />);

      const customInput = screen.getByTestId('custom-amount-input');
      fireEvent.change(customInput, { target: { value: '1.500,00' } });

      const submitButton = screen.getByTestId('submit-donation-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `/api/v1/families/${testFamilyId}/donations/create-intent`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"amountCents":150000'),
          }),
        );
      });
    });

    it('stops polling when max polling attempts cap is reached', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // 1. Create intent
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonationIntent,
      });

      // 2. Status polling - always PENDING
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockHistory[0],
          status: 'PENDING',
        }),
      });

      const onDonationSuccess = vi.fn();

      render(
        <DonationFormCard
          familyId={testFamilyId}
          onDonationSuccess={onDonationSuccess}
          pollingIntervalMs={20}
          maxPollingAttempts={3}
        />,
      );

      const submitButton = screen.getByTestId('submit-donation-button');
      fireEvent.click(submitButton);

      // Wait until create-intent + 3 polls have run
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(4); // 1 create-intent + 3 polls
      });

      // Wait an extra interval cycle to ensure polling stopped
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(onDonationSuccess).not.toHaveBeenCalled();
    });

    it('stops polling if donation intent is expired', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      // Create intent with expired timestamp in the past
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDonationIntent,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        }),
      });

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockHistory[0],
          status: 'PENDING',
        }),
      });

      render(
        <DonationFormCard
          familyId={testFamilyId}
          pollingIntervalMs={20}
        />,
      );

      const submitButton = screen.getByTestId('submit-donation-button');
      fireEvent.click(submitButton);

      // Should call create-intent
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `/api/v1/families/${testFamilyId}/donations/create-intent`,
          expect.anything(),
        );
      });

      // Wait a moment; expired intent should abort polling immediately on first tick
      await new Promise((resolve) => setTimeout(resolve, 80));
      // Only 1 call (create-intent)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('DonationReceiptsTable', () => {
    it('fetches and displays donations history and active recurring subscription', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/donations/history')) {
          return {
            ok: true,
            json: async () => mockHistory,
          };
        }
        if (url.includes('/donations/subscriptions')) {
          return {
            ok: true,
            json: async () => mockSubscriptions,
          };
        }
        return { ok: false, status: 404 };
      });

      render(<DonationReceiptsTable familyId={testFamilyId} />);

      await waitFor(() => {
        expect(screen.getByTestId('active-subscriber-banner')).toBeInTheDocument();
        expect(screen.getByText(/apoiador ativo mensal/i)).toBeInTheDocument();
      });

      // Check rows in receipts table
      const row1 = screen.getByTestId('receipt-row-rec-1');
      expect(within(row1).getByText(/r\$\s*30,00/i)).toBeInTheDocument();
      expect(within(row1).getByText(/confirmado/i)).toBeInTheDocument();

      const row2 = screen.getByTestId('receipt-row-rec-2');
      expect(within(row2).getByText(/r\$\s*50,00/i)).toBeInTheDocument();
      expect(within(row2).getByText(/pendente/i)).toBeInTheDocument();
    });

    it('cancels active monthly subscription with confirmation dialog and refetches', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      let subscriptionsList = [...mockSubscriptions];

      fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('/donations/history')) {
          return {
            ok: true,
            json: async () => mockHistory,
          };
        }
        if (url.includes('/donations/subscriptions') && init?.method === 'DELETE') {
          subscriptionsList = [];
          return {
            ok: true,
            json: async () => ({ ...mockSubscriptions[0], status: 'CANCELLED' }),
          };
        }
        if (url.includes('/donations/subscriptions')) {
          return {
            ok: true,
            json: async () => subscriptionsList,
          };
        }
        return { ok: false, status: 404 };
      });

      render(<DonationReceiptsTable familyId={testFamilyId} />);

      await waitFor(() => {
        expect(screen.getByTestId('cancel-subscription-button')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByTestId('cancel-subscription-button');
      fireEvent.click(cancelBtn);

      // Confirmation dialog/prompt
      const confirmDialogBtn = screen.getByTestId('confirm-cancel-subscription-button');
      fireEvent.click(confirmDialogBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `/api/v1/families/${testFamilyId}/donations/subscriptions/${mockSubscriptions[0]!.id}`,
          expect.objectContaining({ method: 'DELETE' }),
        );
      });

      // Active subscriber banner disappears
      await waitFor(() => {
        expect(screen.queryByTestId('active-subscriber-banner')).not.toBeInTheDocument();
      });
    });

    it('displays empty state when no donations history exists', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/donations/history')) {
          return {
            ok: true,
            json: async () => [],
          };
        }
        if (url.includes('/donations/subscriptions')) {
          return {
            ok: true,
            json: async () => [],
          };
        }
        return { ok: false, status: 404 };
      });

      render(<DonationReceiptsTable familyId={testFamilyId} />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-receipts-state')).toBeInTheDocument();
      });
    });
  });

  describe('SupporterSettingsCard', () => {
    it('renders supporter status, link to /support, and recent receipts', async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/donations/history')) {
          return {
            ok: true,
            json: async () => mockHistory,
          };
        }
        if (url.includes('/donations/subscriptions')) {
          return {
            ok: true,
            json: async () => mockSubscriptions,
          };
        }
        return { ok: false, status: 404 };
      });

      render(<SupporterSettingsCard familyId={testFamilyId} />);

      await waitFor(() => {
        expect(screen.getByTestId('supporter-settings-card')).toBeInTheDocument();
      });

      // Status indicator
      expect(screen.getByText(/apoiador mensal ativo/i)).toBeInTheDocument();

      // Quick link to /support
      const supportLink = screen.getByTestId('support-page-link');
      expect(supportLink).toHaveAttribute('href', '/support');

      // Displays recent receipts
      expect(screen.getByText(/r\$\s*30,00/i)).toBeInTheDocument();
    });
  });

  describe('Navigation & i18n Integration', () => {
    it('includes support navigation link in MAIN_NAV_ITEMS', () => {
      const supportItem = MAIN_NAV_ITEMS.find((item) => item.id === 'support');
      expect(supportItem).toBeDefined();
      expect(supportItem?.href).toBe('/support');
      expect(supportItem?.label).toBe('nav.support');
    });

    it('has translation for nav.support in pt-BR and en-US dictionaries', () => {
      expect((ptBR.nav as Record<string, string>)['support']).toBeDefined();
      expect((ptBR.nav as Record<string, string>)['support']).toMatch(/apoiar|apoio/i);

      expect((enUS.nav as Record<string, string>)['support']).toBeDefined();
      expect((enUS.nav as Record<string, string>)['support']).toMatch(/support/i);
    });
  });
});
