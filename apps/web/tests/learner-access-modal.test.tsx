import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LearnerResponseDto } from '@aletheia/contracts';
import { LearnerAccessModal } from '../src/components/learners/learner-access-modal';

const mockLearner: LearnerResponseDto = {
  id: 'a0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  firstName: 'Clara',
  lastName: 'Silva',
  preferredName: 'Clarinha',
  birthDate: '2016-05-12',
  stage: 'PRIMARY',
  customGrade: '3º Ano',
  avatarColor: '#3B82F6',
  specialNeeds: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
};

describe('LearnerAccessModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders modal when open and fetches initial status', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        learnerId: mockLearner.id,
        enabled: false,
        createdAt: null,
        regeneratedAt: null,
        lastUsedAt: null,
      }),
    } as Response);

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    expect(screen.getByTestId('learner-access-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Acesso do Educando/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/f0000000-0000-0000-0000-000000000001/learners/a0000000-0000-0000-0000-000000000001/access',
        expect.objectContaining({ credentials: 'include' })
      );
    });

    expect(screen.getByTestId('grant-access-btn')).toBeInTheDocument();
  });

  it('generates access code when guardian clicks grant access', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          learnerId: mockLearner.id,
          enabled: false,
          createdAt: null,
          regeneratedAt: null,
          lastUsedAt: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          grant: {
            learnerId: mockLearner.id,
            enabled: true,
            createdAt: '2026-09-17T00:00:00.000Z',
            regeneratedAt: null,
            lastUsedAt: null,
          },
          code: '749201',
        }),
      } as Response);

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('grant-access-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('grant-access-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('access-code-display')).toHaveTextContent('749201');
    });
  });

  it('shows regenerate and revoke actions when access is already active', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        learnerId: mockLearner.id,
        enabled: true,
        createdAt: '2026-09-10T00:00:00.000Z',
        regeneratedAt: null,
        lastUsedAt: null,
      }),
    } as Response);

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('regenerate-access-btn')).toBeInTheDocument();
      expect(screen.getByTestId('revoke-access-btn')).toBeInTheDocument();
    });
  });
});
