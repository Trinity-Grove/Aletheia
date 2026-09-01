import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { DailyDevotionalResponseDto, PrayerResponseDto } from '@aletheia/contracts';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { DevotionalView } from '../src/components/devotional/devotional-view';
import { DevotionalFormModal } from '../src/components/devotional/devotional-form-modal';
import { PrayerJournal } from '../src/components/devotional/prayer-journal';
import DevotionalPage from '../app/(dashboard)/devotional/page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/devotional',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const mockDevotional: DailyDevotionalResponseDto = {
  id: 'd0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  date: '2026-08-25',
  bibleReference: 'Salmos 23:1-6',
  bibleVersionId: 'nvi',
  passageText: 'O Senhor é o meu pastor; de nada terei falta.',
  reflection: 'O cuidado fiel do Bom Pastor que nos conduz em pastos verdejantes.',
  memoryVerse: 'O Senhor é o meu pastor; de nada terei falta. Salmos 23:1',
  hymnOrSong: 'Castelo Forte é Nosso Deus',
  discussionQuestions: '1. Como experimentamos o cuidado do Bom Pastor hoje?\n2. O que significa descansar junto a águas tranquilas?',
  practicalApplication: 'Agradecer a Deus em oração familiar antes de dormir por Seu sustento diário.',
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
};

const mockPetitionPrayer: PrayerResponseDto = {
  id: 'p0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  learnerId: null,
  type: 'PETITION',
  title: 'Saúde dos avós',
  description: 'Oração pela recuperação da vovó e paz na família.',
  isAnswered: false,
  answeredAt: null,
  answeredNote: null,
  archivedAt: null,
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T10:00:00.000Z',
};

const mockGratitudePrayer: PrayerResponseDto = {
  id: 'p0000000-0000-0000-0000-000000000002',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  learnerId: null,
  type: 'GRATITUDE',
  title: 'Novo trabalho do papai',
  description: 'Agradecimento pela provisão de Deus e nova oportunidade.',
  isAnswered: true,
  answeredAt: '2026-08-24T12:00:00.000Z',
  answeredNote: 'Deus proveu abundantemente.',
  archivedAt: null,
  createdAt: '2026-08-15T08:00:00.000Z',
  updatedAt: '2026-08-24T12:00:00.000Z',
};

describe('Devotional & Prayer Components', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('DevotionalView', () => {
    it('renders devotional details, gold ribbon badge, and scripture card properly when present', () => {
      const onEdit = vi.fn();
      const onDateChange = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DevotionalView
            currentDate="2026-08-25"
            devotional={mockDevotional}
            onEdit={onEdit}
            onDateChange={onDateChange}
          />
        </AuthProvider>
      );

      expect(screen.getByText('Salmos 23:1-6')).toBeInTheDocument();
      expect(screen.getByTestId('scripture-gold-badge')).toBeInTheDocument();
      expect(screen.getByText('O cuidado fiel do Bom Pastor que nos conduz em pastos verdejantes.')).toBeInTheDocument();
      expect(screen.getByText('Castelo Forte é Nosso Deus')).toBeInTheDocument();
      expect(screen.getByText('Agradecer a Deus em oração familiar antes de dormir por Seu sustento diário.')).toBeInTheDocument();
      expect(screen.getByText(/Como experimentamos o cuidado/i)).toBeInTheDocument();

      const editBtn = screen.getByTestId('edit-devotional-btn');
      expect(editBtn).toBeInTheDocument();
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalled();
    });

    it('renders empty state when no devotional exists for date', () => {
      const onEdit = vi.fn();
      const onDateChange = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DevotionalView
            currentDate="2026-08-25"
            devotional={null}
            onEdit={onEdit}
            onDateChange={onDateChange}
          />
        </AuthProvider>
      );

      expect(screen.getByText(/Nenhum devocional registrado para esta data/i)).toBeInTheDocument();
      const addBtn = screen.getByTestId('edit-devotional-btn');
      expect(addBtn).toBeInTheDocument();
      expect(addBtn).toHaveTextContent(/Criar Devocional/i);
      fireEvent.click(addBtn);
      expect(onEdit).toHaveBeenCalled();
    });

    it('navigates dates with yesterday, today, and tomorrow buttons', () => {
      const onDateChange = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DevotionalView
            currentDate="2026-08-25"
            devotional={mockDevotional}
            onEdit={vi.fn()}
            onDateChange={onDateChange}
          />
        </AuthProvider>
      );

      const yesterdayBtn = screen.getByRole('button', { name: /Ontem/i });
      fireEvent.click(yesterdayBtn);
      expect(onDateChange).toHaveBeenCalledWith('2026-08-24');

      const tomorrowBtn = screen.getByRole('button', { name: /Amanhã/i });
      fireEvent.click(tomorrowBtn);
      expect(onDateChange).toHaveBeenCalledWith('2026-08-26');
    });
  });

  describe('DevotionalFormModal', () => {
    it('handles scripture lookup and fills passageText', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          reference: 'João 3:16',
          versionId: 'nvi',
          content: 'Porque Deus tanto amou o mundo que deu o seu Filho Unigênito...',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <DevotionalFormModal
          isOpen={true}
          currentDate="2026-08-25"
          initialData={null}
          familyId="f0000000-0000-0000-0000-000000000001"
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('devotional-reference-input'), {
        target: { value: 'João 3:16' },
      });

      const lookupBtn = screen.getByTestId('scripture-lookup-btn');
      fireEvent.click(lookupBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/families/f0000000-0000-0000-0000-000000000001/devotionals/scripture/lookup?reference=')
        );
      });

      const passageInput = screen.getByTestId('devotional-passage-input') as HTMLTextAreaElement;
      await waitFor(() => {
        expect(passageInput.value).toContain('Porque Deus tanto amou o mundo');
      });
    });

    it('submits devotional data properly', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <DevotionalFormModal
          isOpen={true}
          currentDate="2026-08-25"
          initialData={null}
          familyId="f0000000-0000-0000-0000-000000000001"
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('devotional-reference-input'), {
        target: { value: 'Gênesis 1:1' },
      });
      fireEvent.change(screen.getByTestId('devotional-reflection-input'), {
        target: { value: 'No princípio, Deus criou todas as coisas.' },
      });

      fireEvent.click(screen.getByTestId('devotional-submit-btn'));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-08-25',
          bibleReference: 'Gênesis 1:1',
          reflection: 'No princípio, Deus criou todas as coisas.',
        })
      );
    });
  });

  describe('PrayerJournal', () => {
    it('renders petitions and praises tabs, answered celebration banner, and prayer items', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <PrayerJournal
            prayers={[mockPetitionPrayer, mockGratitudePrayer]}
            onCreatePrayer={vi.fn()}
            onAnswerPrayer={vi.fn()}
            onArchivePrayer={vi.fn()}
          />
        </AuthProvider>
      );

      // By default Petitions tab is active
      expect(screen.getByText('Saúde dos avós')).toBeInTheDocument();
      expect(screen.queryByText('Novo trabalho do papai')).not.toBeInTheDocument();

      // Switch to Gratitudes tab
      const gratitudeTab = screen.getByRole('tab', { name: /Gratidões & Louvores/i });
      fireEvent.click(gratitudeTab);

      expect(screen.getByText('Novo trabalho do papai')).toBeInTheDocument();
      expect(screen.getByTestId('answered-celebration-banner')).toBeInTheDocument();
      expect(screen.queryByText('Saúde dos avós')).not.toBeInTheDocument();
    });

    it('allows marking a petition as answered', async () => {
      const onAnswerPrayer = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <PrayerJournal
            prayers={[mockPetitionPrayer]}
            onCreatePrayer={vi.fn()}
            onAnswerPrayer={onAnswerPrayer}
            onArchivePrayer={vi.fn()}
          />
        </AuthProvider>
      );

      const answerBtn = screen.getByTestId(`answer-prayer-btn-${mockPetitionPrayer.id}`);
      fireEvent.click(answerBtn);

      const noteInput = screen.getByTestId('answered-note-input');
      fireEvent.change(noteInput, {
        target: { value: 'A vovó recebeu alta médica hoje!' },
      });

      const confirmBtn = screen.getByTestId('confirm-answer-btn');
      fireEvent.click(confirmBtn);

      expect(onAnswerPrayer).toHaveBeenCalledWith(
        mockPetitionPrayer.id,
        'A vovó recebeu alta médica hoje!'
      );
    });

    it('allows archiving a prayer request', () => {
      const onArchivePrayer = vi.fn();

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <PrayerJournal
            prayers={[mockPetitionPrayer]}
            onCreatePrayer={vi.fn()}
            onAnswerPrayer={vi.fn()}
            onArchivePrayer={onArchivePrayer}
          />
        </AuthProvider>
      );

      const archiveBtn = screen.getByTestId(`archive-prayer-btn-${mockPetitionPrayer.id}`);
      fireEvent.click(archiveBtn);

      expect(onArchivePrayer).toHaveBeenCalledWith(mockPetitionPrayer.id);
    });
  });

  describe('DevotionalPage', () => {
    it('renders full devotional dashboard page and opens modal', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DevotionalPage
            initialDevotional={mockDevotional}
            initialPrayers={[mockPetitionPrayer, mockGratitudePrayer]}
            familyId="f0000000-0000-0000-0000-000000000001"
          />
        </AuthProvider>
      );

      expect(screen.getByText('Culto Doméstico & Devocional')).toBeInTheDocument();
      expect(screen.getByTestId('prayer-journal')).toBeInTheDocument();
      expect(screen.getByText('Salmos 23:1-6')).toBeInTheDocument();

      const editBtn = screen.getByTestId('edit-devotional-btn');
      fireEvent.click(editBtn);

      expect(screen.getByTestId('devotional-form-modal')).toBeInTheDocument();
    });
  });
});

