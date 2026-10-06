import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';
import { DevotionalView } from '../src/components/devotional/devotional-view';
import { DevotionalFormModal } from '../src/components/devotional/devotional-form-modal';
import { PrayerJournal } from '../src/components/devotional/prayer-journal';
import { BibleTranslationCompareView } from '../src/components/devotional/bible-translation-compare-view';
import BibleTranslationComparePage from '../app/(dashboard)/devotional/comparador/page';
import DevotionalPage from '../app/(dashboard)/devotional/page';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import type { DailyDevotionalResponseDto, PrayerResponseDto } from '@aletheia/contracts';

function createAuthContextValue(
  status: AuthContextValue['status'] = 'authenticated',
  familyId = 'fam-uuid-123'
): AuthContextValue {
  return {
    status,
    user: {
      id: 'user-uuid-1',
      email: 'parent@example.com',
      fullName: 'Ana Silva',
      emailVerified: true,
      mfaEnabled: false,
      isPlatformAdmin: false,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    token: 'test-jwt-token',
    activeFamilyId: familyId,
    activeFamily: null,
    families: [],
    activeRole: 'OWNER_GUARDIAN',
    login: vi.fn(),
    verifyMfa: vi.fn(),
    confirmRegistrationCode: vi.fn(),
    resendRegistrationCode: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

vi.mock('next/navigation', () => ({
  usePathname: () => '/devotional',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useParams: () => ({}),
}));

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(async () => {
    return {
      ok: true,
      json: async () => [],
    } as any;
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
});

function Probe({ translationKey, vars }: { translationKey: string; vars?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey, vars)}</span>;
}

const mockDevotional: DailyDevotionalResponseDto = {
  id: 'd0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  date: '2026-08-25',
  bibleReference: 'Salmos 23:1-6',
  bibleVersionId: 'nvi',
  passageText: 'O Senhor é o meu pastor; de nada terei falta.',
  reflection: 'O cuidado fiel do Bom Pastor.',
  memoryVerse: 'Salmos 23:1',
  hymnOrSong: 'Castelo Forte',
  discussionQuestions: 'Como experimentamos o cuidado de Deus?',
  practicalApplication: 'Agradecer em oração.',
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
};

const mockPrayer: PrayerResponseDto = {
  id: 'p0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  learnerId: null,
  type: 'PETITION',
  title: 'Saúde da família',
  description: 'Oração por saúde.',
  isAnswered: false,
  answeredAt: null,
  answeredNote: null,
  archivedAt: null,
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T10:00:00.000Z',
};

describe('Wave 2: Family Devotional and Scripture Comparator i18n', () => {
  describe('Paridade e Estrutura dos Dicionários (devotional)', () => {
    it('possui o namespace devotional registrado em ptBR, enUS e esES com títulos de página', () => {
      expect((ptBR as any).devotional).toBeDefined();
      expect((enUS as any).devotional).toBeDefined();
      expect((esES as any).devotional).toBeDefined();

      expect((ptBR as any).devotional.page.title).toBe('Culto Doméstico & Devocional');
      expect((enUS as any).devotional.page.title).toBe('Family Devotional & Worship');
      expect((esES as any).devotional.page.title).toBe('Culto Doméstico y Devocional');
    });

    it('possui os subtítulos e erros do comparador simétricos', () => {
      expect((ptBR as any).devotional.comparator.title).toBe('Comparador de Traduções Bíblicas');
      expect((enUS as any).devotional.comparator.title).toBe('Bible Translation Comparator');
      expect((esES as any).devotional.comparator.title).toBe('Comparador de Traducciones Bíblicas');
    });

    it('traduz chaves de devotional via useLocale() em múltiplos idiomas', () => {
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="devotional.view.nav.today" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Hoje');
      unmount();

      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="devotional.view.nav.today" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Today');
      unmountEn();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="devotional.view.nav.today" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Hoy');
    });

    it('interpola variáveis dinâmicas em devotional', () => {
      render(
        <LocaleProvider>
          <Probe translationKey="devotional.view.badges.version" vars={{ version: 'NVI' }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Versão: NVI');
    });
  });

  describe('Componentes do Devocional Localizados', () => {
    it('renderiza DevotionalView com textos traduzidos em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LocaleProvider>
            <DevotionalView
              currentDate="2026-08-25"
              devotional={mockDevotional}
              onEdit={vi.fn()}
              onDateChange={vi.fn()}
            />
          </LocaleProvider>
        </AuthProvider>
      );

      expect(screen.getByRole('button', { name: /Yesterday/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Today/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tomorrow/i })).toBeInTheDocument();
      expect(screen.getByTestId('compare-translations-nav-btn')).toHaveTextContent(/Compare Translations 📖/i);
      expect(screen.getByTestId('scripture-gold-badge')).toHaveTextContent(/Scripture Reading & Covenant/i);
      expect(screen.getByTestId('memory-verse-card')).toHaveTextContent(/Memory Verse/i);
    });

    it('renderiza DevotionalView estado vazio em es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LocaleProvider>
            <DevotionalView
              currentDate="2026-08-25"
              devotional={null}
              onEdit={vi.fn()}
              onDateChange={vi.fn()}
            />
          </LocaleProvider>
        </AuthProvider>
      );

      expect(screen.getByText(/Ningún devocional registrado para esta fecha/i)).toBeInTheDocument();
      expect(screen.getByTestId('edit-devotional-btn')).toHaveTextContent(/Crear Devocional/i);
    });

    it('renderiza DevotionalFormModal traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <DevotionalFormModal
            isOpen={true}
            currentDate="2026-08-25"
            initialData={null}
            familyId="f0000000-0000-0000-0000-000000000001"
            onClose={vi.fn()}
            onSubmit={vi.fn()}
          />
        </LocaleProvider>
      );

      expect(screen.getByText('New Daily Devotional')).toBeInTheDocument();
      expect(screen.getByTestId('scripture-lookup-btn')).toHaveTextContent('Fetch YouVersion Scripture');
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByTestId('devotional-submit-btn')).toHaveTextContent('Create Devotional');
    });

    it('renderiza PrayerJournal traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LocaleProvider>
            <PrayerJournal
              prayers={[mockPrayer]}
              onCreatePrayer={vi.fn()}
              onAnswerPrayer={vi.fn()}
              onArchivePrayer={vi.fn()}
            />
          </LocaleProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Family Prayer Journal')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Prayer Petitions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Praise & Thanksgiving/i })).toBeInTheDocument();
      expect(screen.getByTestId('new-prayer-btn')).toHaveTextContent('+ New Prayer');
    });

    it('renderiza BibleTranslationCompareView traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthContext.Provider value={createAuthContextValue()}>
          <LocaleProvider>
            <BibleTranslationCompareView />
          </LocaleProvider>
        </AuthContext.Provider>
      );

      expect(screen.getByLabelText(/Bible Reference/i)).toBeInTheDocument();
      expect(screen.getByTestId('compare-btn')).toHaveTextContent('Compare Translations');
      expect(screen.getByText('Quick suggestions:')).toBeInTheDocument();
      expect(screen.getByText('Translations for Comparison:')).toBeInTheDocument();
      expect(screen.getByText('Choose a passage to compare')).toBeInTheDocument();
    });

    it('renderiza BibleTranslationComparePage com link de retorno traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthContext.Provider value={createAuthContextValue()}>
          <LocaleProvider>
            <BibleTranslationComparePage />
          </LocaleProvider>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Bible Translation Comparator')).toBeInTheDocument();
      expect(screen.getByTestId('back-to-devotional-link')).toHaveTextContent(/Back to Family Devotional/i);
    });

    it('renderiza DevotionalPage completa traduzida em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <LocaleProvider>
            <DevotionalPage initialDevotional={mockDevotional} initialPrayers={[mockPrayer]} />
          </LocaleProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Family Devotional & Worship')).toBeInTheDocument();
      expect(screen.getByText('Cultivate faith as a family through Scripture reading, reflection, praise, and daily prayer.')).toBeInTheDocument();
    });
  });
});
