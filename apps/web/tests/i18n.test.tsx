import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';
import { LoginForm } from '../src/components/auth/login-form';
import { RoleBadge } from '../src/components/auth/role-badge';
import {
  LearnerProgressView,
  LearnerEvidenceModal,
  type LearnerTrackedCompetency,
} from '../src/components/learner-portal';

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

function FormatterProbe({
  date,
  numberValue,
  currencyValue,
  currency,
}: {
  date: Date;
  numberValue: number;
  currencyValue: number;
  currency?: string;
}) {
  const { formatDate, formatTime, formatNumber, formatCurrency } = useLocale();
  return (
    <div>
      <span data-testid="formatted-date">{formatDate(date, { timeZone: 'UTC' })}</span>
      <span data-testid="formatted-time">{formatTime(date, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}</span>
      <span data-testid="formatted-number">{formatNumber(numberValue)}</span>
      <span data-testid="formatted-currency">{formatCurrency(currencyValue, currency)}</span>
    </div>
  );
}

function SwitcherProbe() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="translated-home">{t('common.home')}</span>
      <button data-testid="btn-set-en" onClick={() => setLocale('en-US')}>
        EN
      </button>
      <button data-testid="btn-set-es" onClick={() => setLocale('es-ES')}>
        ES
      </button>
      <button data-testid="btn-set-pt" onClick={() => setLocale('pt-BR')}>
        PT
      </button>
    </div>
  );
}

describe('i18n (Issue #33: Internacionalização, Dicionários e Formatadores)', () => {
  describe('Dicionários e Traduções', () => {
    it('translates a known key to the pt-BR default', () => {
      render(
        <LocaleProvider>
          <Probe translationKey="common.home" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('Início');
    });

    it('translates correctly in en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <Probe translationKey="common.home" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('Home');
    });

    it('translates correctly in es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="common.home" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('Inicio');
    });

    it('interpolates variables properly across languages', () => {
      // pt-BR
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="notifications.newCount" vars={{ count: 5 }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('5 novas');
      unmount();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="notifications.newCount" vars={{ count: 5 }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('5 new');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="notifications.newCount" vars={{ count: 5 }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('5 nuevas');
    });

    it('falls back to the key itself instead of throwing on a missing key', () => {
      render(
        <LocaleProvider>
          <Probe translationKey="nonexistent.key" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('nonexistent.key');
    });
  });

  describe('Formatadores por Locale (Data, Hora, Número, Moeda)', () => {
    const fixedDate = new Date('2026-09-17T14:30:00.000Z');
    const sampleNumber = 1234567.89;

    it('formats date, number and currency in pt-BR', () => {
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={sampleNumber} currencyValue={150.5} />
        </LocaleProvider>
      );

      expect(screen.getByTestId('formatted-date').textContent).toMatch(/17\/0?9\/2026/);
      expect(screen.getByTestId('formatted-time').textContent).toMatch(/14:30/);
      // pt-BR uses dot for thousands and comma for decimals: 1.234.567,89
      expect(screen.getByTestId('formatted-number').textContent).toMatch(/1\.234\.567,89/);
      // pt-BR default currency is BRL (R$)
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/R\$\s?150,50/);
    });

    it('formats date, number and currency in en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={sampleNumber} currencyValue={150.5} />
        </LocaleProvider>
      );

      expect(screen.getByTestId('formatted-date').textContent).toMatch(/0?9\/17\/2026/);
      expect(screen.getByTestId('formatted-time').textContent).toMatch(/0?2:30/);
      // en-US uses comma for thousands and dot for decimals: 1,234,567.89
      expect(screen.getByTestId('formatted-number').textContent).toMatch(/1,234,567\.89/);
      // en-US default currency is USD ($)
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/\$150\.50/);
    });

    it('formats date, number and currency in es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={sampleNumber} currencyValue={150.5} />
        </LocaleProvider>
      );

      expect(screen.getByTestId('formatted-date').textContent).toMatch(/17\/0?9\/2026/);
      expect(screen.getByTestId('formatted-time').textContent).toMatch(/14:30/);
      // es-ES default currency is EUR (€)
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/150,50\s?€/);
    });

    it('respects explicit currency override in formatCurrency', () => {
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={10} currencyValue={100} currency="USD" />
        </LocaleProvider>
      );

      // Explicit USD formatted with pt-BR numbers
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/US\$\s?100,00/);
    });
  });

  describe('Troca de Idioma e Sincronização', () => {
    it('switches locale dynamically and updates document.documentElement.lang and localStorage', async () => {
      render(
        <LocaleProvider>
          <SwitcherProbe />
        </LocaleProvider>
      );

      expect(screen.getByTestId('current-locale')).toHaveTextContent('pt-BR');
      expect(screen.getByTestId('translated-home')).toHaveTextContent('Início');
      expect(document.documentElement.lang).toBe('pt-BR');

      // Switch to EN
      fireEvent.click(screen.getByTestId('btn-set-en'));

      await waitFor(() => {
        expect(screen.getByTestId('current-locale')).toHaveTextContent('en-US');
        expect(screen.getByTestId('translated-home')).toHaveTextContent('Home');
        expect(document.documentElement.lang).toBe('en-US');
        expect(localStorage.getItem('aletheia_locale')).toBe('en-US');
      });

      // Switch to ES
      fireEvent.click(screen.getByTestId('btn-set-es'));

      await waitFor(() => {
        expect(screen.getByTestId('current-locale')).toHaveTextContent('es-ES');
        expect(screen.getByTestId('translated-home')).toHaveTextContent('Inicio');
        expect(document.documentElement.lang).toBe('es-ES');
        expect(localStorage.getItem('aletheia_locale')).toBe('es-ES');
      });
    });

    it('synchronizes locale choice with PATCH /api/v1/families/:familyId/settings when familyId is present', async () => {
      localStorage.setItem('familyId', 'fam-123');

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ language: 'en-US' }),
      } as Response);

      render(
        <LocaleProvider>
          <SwitcherProbe />
        </LocaleProvider>
      );

      fireEvent.click(screen.getByTestId('btn-set-en'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/families/fam-123/settings',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'en-US' }),
          })
        );
      });
    });

    it('does not throw when used outside a LocaleProvider (fallbackContext)', () => {
      expect(() => render(<Probe translationKey="common.home" />)).not.toThrow();
      expect(screen.getByTestId('probe')).toHaveTextContent('Início');

      const fixedDate = new Date('2026-09-17T14:30:00.000Z');
      render(<FormatterProbe date={fixedDate} numberValue={1000} currencyValue={50} />);
      expect(screen.getByTestId('formatted-date').textContent).toMatch(/17\/0?9\/2026/);
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/R\$\s?50,00/);
    });
  });

  describe('Integração de i18n em Auth e Onboarding', () => {
    it('renderiza LoginForm traduzido em en-US e es-ES', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <LoginForm />
        </LocaleProvider>
      );
      expect(screen.getByTestId('login-button')).toHaveTextContent('Sign in');
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <LoginForm />
        </LocaleProvider>
      );
      expect(screen.getByTestId('login-button')).toHaveTextContent('Iniciar sesión');
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    it('renderiza RoleBadge com traduções em múltiplos idiomas', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <RoleBadge role="OWNER_GUARDIAN" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('role-badge')).toHaveTextContent('Primary Guardian');
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <RoleBadge role="OWNER_GUARDIAN" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('role-badge')).toHaveTextContent('Tutor Principal');
    });

    it('traduz chaves de onboarding em en-US e es-ES', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="onboarding.wizard.welcomeTitle" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Welcome to Aletheia!');
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="onboarding.wizard.welcomeTitle" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('¡Bienvenido a Aletheia!');
    });
  });

  describe('Integração de i18n no Portal do Aluno (Learner Portal)', () => {
    const mockTrackings: LearnerTrackedCompetency[] = [
      {
        id: 'track-1',
        familyId: 'f-1',
        learnerId: 'l-1',
        competencyDefinitionId: 'comp-1',
        competencyVersion: 1,
        status: 'ACTIVE',
        activatedAt: '2026-09-01T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
        evidenceCount: 1,
        competency: {
          code: 'HIST-01',
          title: 'World History',
          domainTitle: 'History',
        },
      },
      {
        id: 'track-2',
        familyId: 'f-1',
        learnerId: 'l-1',
        competencyDefinitionId: 'comp-2',
        competencyVersion: 1,
        status: 'ACTIVE',
        achievedAt: '2026-09-10T00:00:00.000Z',
        activatedAt: '2026-09-01T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
        evidenceCount: 2,
        competency: {
          code: 'MATH-01',
          title: 'Algebra Basics',
          domainTitle: 'Mathematics',
        },
      },
    ];

    it('renderiza LearnerProgressView em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <LearnerProgressView
            learnerId="l-1"
            trackings={mockTrackings}
            loading={false}
            error={null}
            onOpenEvidenceModal={vi.fn()}
          />
        </LocaleProvider>
      );

      expect(screen.getByText('Knowledge Track')).toBeInTheDocument();
      expect(screen.getByText('My Progress')).toBeInTheDocument();
      expect(screen.getByText('Total Competencies')).toBeInTheDocument();
      expect(screen.getByText('Mastered')).toBeInTheDocument();
      expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('open-evidence-modal-btn')).toHaveTextContent('Submit Work 📤');
      expect(screen.getByTestId('competency-status-track-1')).toHaveTextContent('In Progress');
      expect(screen.getByTestId('competency-status-track-2')).toHaveTextContent('✨ Mastered');
    });

    it('renderiza LearnerProgressView em es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <LearnerProgressView
            learnerId="l-1"
            trackings={mockTrackings}
            loading={false}
            error={null}
            onOpenEvidenceModal={vi.fn()}
          />
        </LocaleProvider>
      );

      expect(screen.getByText('Ruta de Conocimiento')).toBeInTheDocument();
      expect(screen.getByText('Mi Progreso')).toBeInTheDocument();
      expect(screen.getByText('Total de Competencias')).toBeInTheDocument();
      expect(screen.getByText('Conquistadas')).toBeInTheDocument();
      expect(screen.getByText('En Desarrollo')).toBeInTheDocument();
      expect(screen.getByTestId('open-evidence-modal-btn')).toHaveTextContent('Enviar Trabajo 📤');
      expect(screen.getByTestId('competency-status-track-1')).toHaveTextContent('En Curso');
      expect(screen.getByTestId('competency-status-track-2')).toHaveTextContent('✨ Conquistada');
    });

    it('renderiza LearnerEvidenceModal com formulário traduzido em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <LearnerEvidenceModal
            isOpen={true}
            onClose={vi.fn()}
            learnerId="l-1"
            trackings={mockTrackings}
            onSuccess={vi.fn()}
          />
        </LocaleProvider>
      );

      expect(screen.getByText('Submit Work or Evidence')).toBeInTheDocument();
      expect(screen.getByLabelText(/Related Competency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Evidence Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Work Title/i)).toBeInTheDocument();
      expect(screen.getByTestId('cancel-evidence-btn')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('submit-evidence-btn')).toHaveTextContent('Submit Evidence');
    });
  });

  describe('Primeiros Passos, Auto-Presença e Origem de Presença (Task 5)', () => {
    it('traduz chaves de dashboard.gettingStarted em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="dashboard.gettingStarted.title" />
            <Probe translationKey="dashboard.gettingStarted.subtitle" />
            <Probe translationKey="dashboard.gettingStarted.progress" vars={{ completed: 2, total: 4 }} />
            <Probe translationKey="dashboard.gettingStarted.dismiss" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.description" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.action" />
            <Probe translationKey="dashboard.gettingStarted.steps.chooseCurriculum.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.scheduleLesson.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.completeFirstActivity.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Primeiros Passos no Aletheia')).toBeInTheDocument();
      expect(screen.getByText('Complete estes 4 marcos essenciais para estruturar a educação clássica da sua família.')).toBeInTheDocument();
      expect(screen.getByText('2 de 4 concluídos')).toBeInTheDocument();
      expect(screen.getByText('Ocultar guia')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Educando')).toBeInTheDocument();
      expect(screen.getByText('Adicione os educandos do seu núcleo familiar com suas etapas de desenvolvimento.')).toBeInTheDocument();
      expect(screen.getByText('Ir para Educandos')).toBeInTheDocument();
      expect(screen.getByText('Definir Currículo')).toBeInTheDocument();
      expect(screen.getByText('Agendar Primeira Lição')).toBeInTheDocument();
      expect(screen.getByText('Concluir Primeira Atividade')).toBeInTheDocument();
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="dashboard.gettingStarted.title" />
            <Probe translationKey="dashboard.gettingStarted.subtitle" />
            <Probe translationKey="dashboard.gettingStarted.progress" vars={{ completed: 1, total: 4 }} />
            <Probe translationKey="dashboard.gettingStarted.dismiss" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.description" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.action" />
            <Probe translationKey="dashboard.gettingStarted.steps.chooseCurriculum.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.scheduleLesson.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.completeFirstActivity.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Getting Started with Aletheia')).toBeInTheDocument();
      expect(screen.getByText("Complete these 4 essential milestones to set up your family's classical education.")).toBeInTheDocument();
      expect(screen.getByText('1 of 4 completed')).toBeInTheDocument();
      expect(screen.getByText('Dismiss guide')).toBeInTheDocument();
      expect(screen.getByText('Register Learner')).toBeInTheDocument();
      expect(screen.getByText("Add your family's learners with their developmental stages.")).toBeInTheDocument();
      expect(screen.getByText('Go to Learners')).toBeInTheDocument();
      expect(screen.getByText('Set Curriculum')).toBeInTheDocument();
      expect(screen.getByText('Schedule First Lesson')).toBeInTheDocument();
      expect(screen.getByText('Complete First Activity')).toBeInTheDocument();
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      const { unmount: unmountEs } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="dashboard.gettingStarted.title" />
            <Probe translationKey="dashboard.gettingStarted.subtitle" />
            <Probe translationKey="dashboard.gettingStarted.progress" vars={{ completed: 3, total: 4 }} />
            <Probe translationKey="dashboard.gettingStarted.dismiss" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.description" />
            <Probe translationKey="dashboard.gettingStarted.steps.createLearner.action" />
            <Probe translationKey="dashboard.gettingStarted.steps.chooseCurriculum.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.scheduleLesson.title" />
            <Probe translationKey="dashboard.gettingStarted.steps.completeFirstActivity.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Primeros Pasos en Aletheia')).toBeInTheDocument();
      expect(screen.getByText('Complete estos 4 hitos esenciales para estructurar la educación clásica de su familia.')).toBeInTheDocument();
      expect(screen.getByText('3 de 4 completados')).toBeInTheDocument();
      expect(screen.getByText('Ocultar guía')).toBeInTheDocument();
      expect(screen.getByText('Registrar Educando')).toBeInTheDocument();
      expect(screen.getByText('Añada los educandos de su núcleo familiar con sus etapas de desarrollo.')).toBeInTheDocument();
      expect(screen.getByText('Ir a Educandos')).toBeInTheDocument();
      expect(screen.getByText('Definir Currículo')).toBeInTheDocument();
      expect(screen.getByText('Programar Primera Lección')).toBeInTheDocument();
      expect(screen.getByText('Completar Primera Actividad')).toBeInTheDocument();
      unmountEs();
    });

    it('traduz aviso de auto-presença em lessons.completion.autoAttendanceNotice em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <Probe translationKey="lessons.completion.autoAttendanceNotice" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Presença registrada automaticamente pela conclusão desta lição.');
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="lessons.completion.autoAttendanceNotice" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Attendance automatically logged upon completion of this lesson.');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      const { unmount: unmountEs } = render(
        <LocaleProvider>
          <Probe translationKey="lessons.completion.autoAttendanceNotice" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Asistencia registrada automáticamente al completar esta lección.');
      unmountEs();
    });

    it('traduz origens de presença em reports.attendance.source.* em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="reports.attendance.source.autoLesson" />
            <Probe translationKey="reports.attendance.source.manual" />
            <Probe translationKey="reports.attendance.source.bulk" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Auto (Lição)')).toBeInTheDocument();
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('Coletiva')).toBeInTheDocument();
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="reports.attendance.source.autoLesson" />
            <Probe translationKey="reports.attendance.source.manual" />
            <Probe translationKey="reports.attendance.source.bulk" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Auto (Lesson)')).toBeInTheDocument();
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('Bulk')).toBeInTheDocument();
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      const { unmount: unmountEs } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="reports.attendance.source.autoLesson" />
            <Probe translationKey="reports.attendance.source.manual" />
            <Probe translationKey="reports.attendance.source.bulk" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Auto (Lección)')).toBeInTheDocument();
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('Colectiva')).toBeInTheDocument();
      unmountEs();
    });
  });

  describe('Tutorial Interativo Guiado & Autonomia de Onboarding (Task 1)', () => {
    it('traduz chaves do tour guiado (welcome, steps, controls, startTourNav, nav.startTour) em pt-BR', () => {
      render(
        <LocaleProvider>
          <div>
            <Probe translationKey="dashboard.tour.welcome.title" />
            <Probe translationKey="dashboard.tour.welcome.subtitle" />
            <Probe translationKey="dashboard.tour.welcome.start" />
            <Probe translationKey="dashboard.tour.welcome.dismissNever" />
            <Probe translationKey="dashboard.tour.steps.step1.title" />
            <Probe translationKey="dashboard.tour.steps.step1.description" />
            <Probe translationKey="dashboard.tour.steps.step2.title" />
            <Probe translationKey="dashboard.tour.steps.step2.description" />
            <Probe translationKey="dashboard.tour.steps.step3.title" />
            <Probe translationKey="dashboard.tour.steps.step3.description" />
            <Probe translationKey="dashboard.tour.steps.step4.title" />
            <Probe translationKey="dashboard.tour.steps.step4.description" />
            <Probe translationKey="dashboard.tour.steps.step5.title" />
            <Probe translationKey="dashboard.tour.steps.step5.description" />
            <Probe translationKey="dashboard.tour.controls.next" />
            <Probe translationKey="dashboard.tour.controls.prev" />
            <Probe translationKey="dashboard.tour.controls.skip" />
            <Probe translationKey="dashboard.tour.controls.finish" />
            <Probe translationKey="dashboard.tour.controls.stepIndicator" vars={{ current: 1, total: 5 }} />
            <Probe translationKey="dashboard.tour.startTourNav" />
            <Probe translationKey="nav.startTour" />
          </div>
        </LocaleProvider>
      );

      expect(screen.getByText('Bem-vindo ao Aletheia!')).toBeInTheDocument();
      expect(screen.getByText('Gostaria de um tour guiado rápido pelas principais ferramentas do sistema?')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Tour Guiado (3 min)')).toBeInTheDocument();
      expect(screen.getByText('Pular e não ver mais')).toBeInTheDocument();
      expect(screen.getByText('Navegação & Módulos')).toBeInTheDocument();
      expect(screen.getByText('Acesse Educandos, Currículo, Agenda semanal, Diário de Aprendizagem, Portfólio fotográfico e Relatórios estruturados.')).toBeInTheDocument();
      expect(screen.getByText('Foco do Educando')).toBeInTheDocument();
      expect(screen.getByText('Alterne facilmente entre o acompanhamento de cada filho individualmente ou veja a visão consolidada de toda a família.')).toBeInTheDocument();
      expect(screen.getByText('Versículo & Devocional')).toBeInTheDocument();
      expect(screen.getByText('Inspiração espiritual diária com registros de orações e reflexões bíblicas da família.')).toBeInTheDocument();
      expect(screen.getByText('Jornada & Atividades')).toBeInTheDocument();
      expect(screen.getByText('Acompanhe o tempo de instrução em tempo real e conclua lições com registro reflexivo.')).toBeInTheDocument();
      expect(screen.getByText('Tudo Pronto para Começar!')).toBeInTheDocument();
      expect(screen.getByText('Você conheceu os principais pontos do Aletheia. Parabéns pelo início desta jornada educativa!')).toBeInTheDocument();
      expect(screen.getByText('Próximo')).toBeInTheDocument();
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Pular e sair')).toBeInTheDocument();
      expect(screen.getByText('Concluir Tour')).toBeInTheDocument();
      expect(screen.getByText('Passo 1 de 5')).toBeInTheDocument();
      expect(screen.getAllByText('Fazer Tour').length).toBe(1);
    });

    it('traduz chaves do tour guiado em en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <div>
            <Probe translationKey="dashboard.tour.welcome.title" />
            <Probe translationKey="dashboard.tour.welcome.subtitle" />
            <Probe translationKey="dashboard.tour.welcome.start" />
            <Probe translationKey="dashboard.tour.welcome.dismissNever" />
            <Probe translationKey="dashboard.tour.steps.step1.title" />
            <Probe translationKey="dashboard.tour.steps.step1.description" />
            <Probe translationKey="dashboard.tour.steps.step2.title" />
            <Probe translationKey="dashboard.tour.steps.step2.description" />
            <Probe translationKey="dashboard.tour.steps.step3.title" />
            <Probe translationKey="dashboard.tour.steps.step3.description" />
            <Probe translationKey="dashboard.tour.steps.step4.title" />
            <Probe translationKey="dashboard.tour.steps.step4.description" />
            <Probe translationKey="dashboard.tour.steps.step5.title" />
            <Probe translationKey="dashboard.tour.steps.step5.description" />
            <Probe translationKey="dashboard.tour.controls.next" />
            <Probe translationKey="dashboard.tour.controls.prev" />
            <Probe translationKey="dashboard.tour.controls.skip" />
            <Probe translationKey="dashboard.tour.controls.finish" />
            <Probe translationKey="dashboard.tour.controls.stepIndicator" vars={{ current: 2, total: 5 }} />
            <Probe translationKey="dashboard.tour.startTourNav" />
            <Probe translationKey="nav.startTour" />
          </div>
        </LocaleProvider>
      );

      expect(screen.getByText('Welcome to Aletheia!')).toBeInTheDocument();
      expect(screen.getByText('Would you like a quick guided tour of the system’s main features?')).toBeInTheDocument();
      expect(screen.getByText('Start Guided Tour (3 min)')).toBeInTheDocument();
      expect(screen.getByText("Skip and don't show again")).toBeInTheDocument();
      expect(screen.getByText('Navigation & Modules')).toBeInTheDocument();
      expect(screen.getByText('Access Learners, Curriculum, Weekly Schedule, Learning Journal, Photographic Portfolio, and Structured Reports.')).toBeInTheDocument();
      expect(screen.getByText('Learner Focus')).toBeInTheDocument();
      expect(screen.getByText('Easily switch between tracking each child individually or viewing the consolidated family overview.')).toBeInTheDocument();
      expect(screen.getByText('Scripture & Devotional')).toBeInTheDocument();
      expect(screen.getByText('Daily spiritual inspiration with prayer records and family biblical reflections.')).toBeInTheDocument();
      expect(screen.getByText('Daily Journey & Activities')).toBeInTheDocument();
      expect(screen.getByText('Track instruction time in real time and complete lessons with reflective records.')).toBeInTheDocument();
      expect(screen.getByText('All Set to Begin!')).toBeInTheDocument();
      expect(screen.getByText("You've explored the main highlights of Aletheia. Congratulations on beginning this educational journey!")).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Skip and exit')).toBeInTheDocument();
      expect(screen.getByText('Finish Tour')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
      expect(screen.getAllByText('Take Tour').length).toBe(1);
    });

    it('traduz chaves do tour guiado em es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <div>
            <Probe translationKey="dashboard.tour.welcome.title" />
            <Probe translationKey="dashboard.tour.welcome.subtitle" />
            <Probe translationKey="dashboard.tour.welcome.start" />
            <Probe translationKey="dashboard.tour.welcome.dismissNever" />
            <Probe translationKey="dashboard.tour.steps.step1.title" />
            <Probe translationKey="dashboard.tour.steps.step1.description" />
            <Probe translationKey="dashboard.tour.steps.step2.title" />
            <Probe translationKey="dashboard.tour.steps.step2.description" />
            <Probe translationKey="dashboard.tour.steps.step3.title" />
            <Probe translationKey="dashboard.tour.steps.step3.description" />
            <Probe translationKey="dashboard.tour.steps.step4.title" />
            <Probe translationKey="dashboard.tour.steps.step4.description" />
            <Probe translationKey="dashboard.tour.steps.step5.title" />
            <Probe translationKey="dashboard.tour.steps.step5.description" />
            <Probe translationKey="dashboard.tour.controls.next" />
            <Probe translationKey="dashboard.tour.controls.prev" />
            <Probe translationKey="dashboard.tour.controls.skip" />
            <Probe translationKey="dashboard.tour.controls.finish" />
            <Probe translationKey="dashboard.tour.controls.stepIndicator" vars={{ current: 3, total: 5 }} />
            <Probe translationKey="dashboard.tour.startTourNav" />
            <Probe translationKey="nav.startTour" />
          </div>
        </LocaleProvider>
      );

      expect(screen.getByText('¡Bienvenido a Aletheia!')).toBeInTheDocument();
      expect(screen.getByText('¿Desea un recorrido guiado rápido por las principales herramientas del sistema?')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Tour Guiado (3 min)')).toBeInTheDocument();
      expect(screen.getByText('Omitir y no volver a mostrar')).toBeInTheDocument();
      expect(screen.getByText('Navegación y Módulos')).toBeInTheDocument();
      expect(screen.getByText('Acceda a Educandos, Currículo, Horario semanal, Diario de Aprendizaje, Portafolio fotográfico e Informes estructurados.')).toBeInTheDocument();
      expect(screen.getByText('Enfoque del Educando')).toBeInTheDocument();
      expect(screen.getByText('Alterne fácilmente entre el seguimiento individual de cada hijo o consulte la vista consolidada de toda la familia.')).toBeInTheDocument();
      expect(screen.getByText('Versículo y Devocional')).toBeInTheDocument();
      expect(screen.getByText('Inspiración espiritual diaria con registros de oraciones y reflexiones bíblicas familiares.')).toBeInTheDocument();
      expect(screen.getByText('Jornada y Actividades')).toBeInTheDocument();
      expect(screen.getByText('Monitoree el tiempo de instrucción en tiempo real y complete lecciones con registro reflexivo.')).toBeInTheDocument();
      expect(screen.getByText('¡Todo Listo para Empezar!')).toBeInTheDocument();
      expect(screen.getByText('Ha explorado los puntos principales de Aletheia. ¡Felicitaciones por comenzar este viaje educativo!')).toBeInTheDocument();
      expect(screen.getByText('Siguiente')).toBeInTheDocument();
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Saltar y salir')).toBeInTheDocument();
      expect(screen.getByText('Completar Tour')).toBeInTheDocument();
      expect(screen.getByText('Paso 3 de 5')).toBeInTheDocument();
      expect(screen.getAllByText('Hacer Tour').length).toBe(1);
    });

    it('traduz chaves de configurações settings.general.tutorialToggle em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="settings.general.tutorialToggle.title" />
            <Probe translationKey="settings.general.tutorialToggle.description" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Tutorial de Primeiros Passos')).toBeInTheDocument();
      expect(screen.getByText('Exibir tour interativo guiado pelas principais ferramentas do sistema.')).toBeInTheDocument();
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="settings.general.tutorialToggle.title" />
            <Probe translationKey="settings.general.tutorialToggle.description" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Getting Started Tutorial')).toBeInTheDocument();
      expect(screen.getByText("Display an interactive guided tour of the system's main tools.")).toBeInTheDocument();
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      const { unmount: unmountEs } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="settings.general.tutorialToggle.title" />
            <Probe translationKey="settings.general.tutorialToggle.description" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Tutorial de Primeros Pasos')).toBeInTheDocument();
      expect(screen.getByText('Mostrar recorrido guiado interactivo por las principales herramientas del sistema.')).toBeInTheDocument();
      unmountEs();
    });
  });

  describe('Amparo Legal & Guia dos Primeiros 30 Dias (Task 2)', () => {
    it('traduz chaves de nav.legalGuide em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <Probe translationKey="nav.legalGuide" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Guia legal');
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="nav.legalGuide" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Legal guide');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="nav.legalGuide" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Guía legal');
    });

    it('traduz chaves completas de legalGuide.* (header, framework, evidence, checklist, faq) em pt-BR, en-US e es-ES com interpolação', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="legalGuide.header.title" />
            <Probe translationKey="legalGuide.header.subtitle" />
            <Probe translationKey="legalGuide.header.jurisdictionBadge" vars={{ name: 'Brasil' }} />
            <Probe translationKey="legalGuide.header.confidenceLabel" vars={{ level: 'ESTABLISHED' }} />
            <Probe translationKey="legalGuide.framework.title" />
            <Probe translationKey="legalGuide.framework.minDaysValue" vars={{ count: 200 }} />
            <Probe translationKey="legalGuide.framework.minHoursValue" vars={{ count: 800 }} />
            <Probe translationKey="legalGuide.evidence.title" />
            <Probe translationKey="legalGuide.evidence.dossierAction" />
            <Probe translationKey="legalGuide.checklist.title" />
            <Probe translationKey="legalGuide.checklist.progress" vars={{ completed: 2, total: 6, percentage: 33 }} />
            <Probe translationKey="legalGuide.checklist.steps.step1.title" />
            <Probe translationKey="legalGuide.checklist.steps.step1.action" />
            <Probe translationKey="legalGuide.checklist.steps.step6.title" />
            <Probe translationKey="legalGuide.faq.title" />
            <Probe translationKey="legalGuide.faq.q1.question" />
            <Probe translationKey="legalGuide.faq.q4.question" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Guia legal e primeiros passos')).toBeInTheDocument();
      expect(screen.getByText('Jurisdição Ativa: Brasil')).toBeInTheDocument();
      expect(screen.getByText('Nível de Certeza: ESTABLISHED')).toBeInTheDocument();
      expect(screen.getByText('Seus Direitos e Amparo Constitucional')).toBeInTheDocument();
      expect(screen.getByText('200 dias')).toBeInTheDocument();
      expect(screen.getByText('800 horas')).toBeInTheDocument();
      expect(screen.getByText('Emitir Dossiê de Conformidade Anual')).toBeInTheDocument();
      expect(screen.getByText('Checklist dos Primeiros 30 Dias')).toBeInTheDocument();
      expect(screen.getByText('2 de 6 etapas concluídas (33%)')).toBeInTheDocument();
      expect(screen.getByText('1. Cadastrar seu primeiro educando')).toBeInTheDocument();
      expect(screen.getByText('Ir para Educandos')).toBeInTheDocument();
      expect(screen.getByText('Perguntas Frequentes (FAQ Jurídico)')).toBeInTheDocument();
      expect(screen.getByText('O ensino domiciliar é crime no Brasil?')).toBeInTheDocument();
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="legalGuide.header.title" />
            <Probe translationKey="legalGuide.header.jurisdictionBadge" vars={{ name: 'Brazil' }} />
            <Probe translationKey="legalGuide.header.confidenceLabel" vars={{ level: 'ESTABLISHED' }} />
            <Probe translationKey="legalGuide.framework.title" />
            <Probe translationKey="legalGuide.framework.minDaysValue" vars={{ count: 200 }} />
            <Probe translationKey="legalGuide.framework.minHoursValue" vars={{ count: 800 }} />
            <Probe translationKey="legalGuide.checklist.title" />
            <Probe translationKey="legalGuide.checklist.progress" vars={{ completed: 3, total: 6, percentage: 50 }} />
            <Probe translationKey="legalGuide.checklist.steps.step1.title" />
            <Probe translationKey="legalGuide.checklist.steps.step1.action" />
            <Probe translationKey="legalGuide.faq.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Legal guide and getting started')).toBeInTheDocument();
      expect(screen.getByText('Active Jurisdiction: Brazil')).toBeInTheDocument();
      expect(screen.getByText('Confidence Level: ESTABLISHED')).toBeInTheDocument();
      expect(screen.getByText('Your Rights & Constitutional Protection')).toBeInTheDocument();
      expect(screen.getByText('200 days')).toBeInTheDocument();
      expect(screen.getByText('800 hours')).toBeInTheDocument();
      expect(screen.getByText('First 30 Days Checklist')).toBeInTheDocument();
      expect(screen.getByText('3 of 6 steps completed (50%)')).toBeInTheDocument();
      expect(screen.getByText('1. Register your first learner')).toBeInTheDocument();
      expect(screen.getByText('Go to Learners')).toBeInTheDocument();
      expect(screen.getByText('Frequently Asked Questions (Legal FAQ)')).toBeInTheDocument();
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      const { unmount: unmountEs } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="legalGuide.header.title" />
            <Probe translationKey="legalGuide.header.jurisdictionBadge" vars={{ name: 'Brasil' }} />
            <Probe translationKey="legalGuide.header.confidenceLabel" vars={{ level: 'ESTABLISHED' }} />
            <Probe translationKey="legalGuide.framework.title" />
            <Probe translationKey="legalGuide.framework.minDaysValue" vars={{ count: 200 }} />
            <Probe translationKey="legalGuide.framework.minHoursValue" vars={{ count: 800 }} />
            <Probe translationKey="legalGuide.checklist.title" />
            <Probe translationKey="legalGuide.checklist.progress" vars={{ completed: 1, total: 6, percentage: 16 }} />
            <Probe translationKey="legalGuide.checklist.steps.step1.title" />
            <Probe translationKey="legalGuide.checklist.steps.step1.action" />
            <Probe translationKey="legalGuide.faq.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Guía legal y primeros pasos')).toBeInTheDocument();
      expect(screen.getByText('Jurisdicción Activa: Brasil')).toBeInTheDocument();
      expect(screen.getByText('Nivel de Certeza: ESTABLISHED')).toBeInTheDocument();
      expect(screen.getByText('Sus Derechos y Amparo Constitucional')).toBeInTheDocument();
      expect(screen.getByText('200 días')).toBeInTheDocument();
      expect(screen.getByText('800 horas')).toBeInTheDocument();
      expect(screen.getByText('Checklist de los Primeros 30 Días')).toBeInTheDocument();
      expect(screen.getByText('1 de 6 etapas completadas (16%)')).toBeInTheDocument();
      expect(screen.getByText('1. Registrar a su primer estudiante')).toBeInTheDocument();
      expect(screen.getByText('Ir a Estudiantes')).toBeInTheDocument();
      expect(screen.getByText('Preguntas Frecuentes (FAQ Legal)')).toBeInTheDocument();
      unmountEs();
    });

    it('possui todas as chaves de nav.legalGuide e legalGuide.* com simetria estrutural nos objetos dos dicionários', () => {
      expect((ptBR as any).nav?.legalGuide).toBe('Guia legal');
      expect((enUS as any).nav?.legalGuide).toBe('Legal guide');
      expect((esES as any).nav?.legalGuide).toBe('Guía legal');

      expect((ptBR as any).legalGuide?.checklist?.steps?.step1?.title).toBeDefined();
      expect((enUS as any).legalGuide?.checklist?.steps?.step1?.title).toBeDefined();
      expect((esES as any).legalGuide?.checklist?.steps?.step1?.title).toBeDefined();
    });
  });

  describe('Hub Comunitário & Mural de Inspiração (Task 2)', () => {
    it('traduz chaves de nav.community em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <Probe translationKey="nav.community" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Comunidade');
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="nav.community" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Community');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="nav.community" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Comunidad');
    });

    it('traduz chaves completas de community.* (hub, themes, card, shareModal, adoptModal) com interpolação em pt-BR, en-US e es-ES', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="community.hub.title" />
            <Probe translationKey="community.hub.subtitle" />
            <Probe translationKey="community.hub.ideasCount" vars={{ count: 12 }} />
            <Probe translationKey="community.themes.natureStudy" />
            <Probe translationKey="community.themes.livingBooks" />
            <Probe translationKey="community.themes.handicraft" />
            <Probe translationKey="community.themes.seasonalHistory" />
            <Probe translationKey="community.themes.familyProjects" />
            <Probe translationKey="community.card.estimatedTime" vars={{ minutes: 45 }} />
            <Probe translationKey="community.card.ageRange" vars={{ min: 5, max: 10 }} />
            <Probe translationKey="community.card.adoptBtn" />
            <Probe translationKey="community.card.seedBadge" />
            <Probe translationKey="community.shareModal.title" />
            <Probe translationKey="community.shareModal.privacyNotice" />
            <Probe translationKey="community.adoptModal.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Mural de Inspiração Comunitária')).toBeInTheDocument();
      expect(screen.getByText('12 ideias encontradas')).toBeInTheDocument();
      expect(screen.getByText('🌿 Estudos da Natureza')).toBeInTheDocument();
      expect(screen.getByText('📚 Leituras Vivas & Clássicos')).toBeInTheDocument();
      expect(screen.getByText('🛠️ Trabalhos Manuais & Oficinas')).toBeInTheDocument();
      expect(screen.getByText('⏳ História & Épocas do Ano')).toBeInTheDocument();
      expect(screen.getByText('🏡 Projetos em Família')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('5-10 anos')).toBeInTheDocument();
      expect(screen.getByText('Adotar para a Nossa Família')).toBeInTheDocument();
      expect(screen.getByText('Curadoria Aletheia')).toBeInTheDocument();
      expect(screen.getByText('Compartilhar Ideia com Outras Famílias')).toBeInTheDocument();
      expect(screen.getByText('Garantia de Privacidade: Nenhuma identificação pessoal, nome de crianças ou registros privados são compartilhados.')).toBeInTheDocument();
      expect(screen.getByText('Adotar Atividade para Nossa Rotina')).toBeInTheDocument();
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="community.hub.title" />
            <Probe translationKey="community.hub.ideasCount" vars={{ count: 7 }} />
            <Probe translationKey="community.themes.natureStudy" />
            <Probe translationKey="community.card.estimatedTime" vars={{ minutes: 30 }} />
            <Probe translationKey="community.card.ageRange" vars={{ min: 4, max: 8 }} />
            <Probe translationKey="community.card.adoptBtn" />
            <Probe translationKey="community.shareModal.title" />
            <Probe translationKey="community.adoptModal.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Community Inspiration Board')).toBeInTheDocument();
      expect(screen.getByText('7 ideas found')).toBeInTheDocument();
      expect(screen.getByText('🌿 Nature Study')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('4-8 years')).toBeInTheDocument();
      expect(screen.getByText('Adopt for Our Family')).toBeInTheDocument();
      expect(screen.getByText('Share Idea with Other Families')).toBeInTheDocument();
      expect(screen.getByText('Adopt Activity for Our Routine')).toBeInTheDocument();
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      const { unmount: unmountEs } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="community.hub.title" />
            <Probe translationKey="community.hub.ideasCount" vars={{ count: 9 }} />
            <Probe translationKey="community.themes.natureStudy" />
            <Probe translationKey="community.card.estimatedTime" vars={{ minutes: 20 }} />
            <Probe translationKey="community.card.ageRange" vars={{ min: 6, max: 12 }} />
            <Probe translationKey="community.card.adoptBtn" />
            <Probe translationKey="community.shareModal.title" />
            <Probe translationKey="community.adoptModal.title" />
          </div>
        </LocaleProvider>
      );
      expect(screen.getByText('Mural de Inspiración Comunitaria')).toBeInTheDocument();
      expect(screen.getByText('9 ideas encontradas')).toBeInTheDocument();
      expect(screen.getByText('🌿 Estudios de la Naturaleza')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('6-12 años')).toBeInTheDocument();
      expect(screen.getByText('Adoptar para Nuestra Familia')).toBeInTheDocument();
      expect(screen.getByText('Compartir Idea con Otras Familias')).toBeInTheDocument();
      expect(screen.getByText('Adoptar Actividad para Nuestra Rutina')).toBeInTheDocument();
      unmountEs();
    });

    it('possui todas as chaves de nav.community e community.* com simetria estrutural nos objetos dos dicionários', () => {
      expect((ptBR as any).nav?.community).toBe('Comunidade');
      expect((enUS as any).nav?.community).toBe('Community');
      expect((esES as any).nav?.community).toBe('Comunidad');

      for (const dict of [ptBR, enUS, esES]) {
        expect((dict as any).community?.hub?.title).toBeDefined();
        expect((dict as any).community?.hub?.subtitle).toBeDefined();
        expect((dict as any).community?.hub?.searchPlaceholder).toBeDefined();
        expect((dict as any).community?.hub?.allThemes).toBeDefined();
        expect((dict as any).community?.hub?.emptyTitle).toBeDefined();
        expect((dict as any).community?.hub?.emptyDescription).toBeDefined();
        expect((dict as any).community?.hub?.clearFilters).toBeDefined();
        expect((dict as any).community?.hub?.shareButton).toBeDefined();
        expect((dict as any).community?.hub?.ideasCount).toBeDefined();
        expect((dict as any).community?.hub?.filterAge).toBeDefined();
        expect((dict as any).community?.hub?.allAges).toBeDefined();

        expect((dict as any).community?.themes?.natureStudy).toBeDefined();
        expect((dict as any).community?.themes?.natureStudyDesc).toBeDefined();
        expect((dict as any).community?.themes?.livingBooks).toBeDefined();
        expect((dict as any).community?.themes?.livingBooksDesc).toBeDefined();
        expect((dict as any).community?.themes?.handicraft).toBeDefined();
        expect((dict as any).community?.themes?.handicraftDesc).toBeDefined();
        expect((dict as any).community?.themes?.seasonalHistory).toBeDefined();
        expect((dict as any).community?.themes?.seasonalHistoryDesc).toBeDefined();
        expect((dict as any).community?.themes?.familyProjects).toBeDefined();
        expect((dict as any).community?.themes?.familyProjectsDesc).toBeDefined();

        expect((dict as any).community?.card?.estimatedTime).toBeDefined();
        expect((dict as any).community?.card?.ageRange).toBeDefined();
        expect((dict as any).community?.card?.supervisionRequired).toBeDefined();
        expect((dict as any).community?.card?.independent).toBeDefined();
        expect((dict as any).community?.card?.materialsTitle).toBeDefined();
        expect((dict as any).community?.card?.adoptBtn).toBeDefined();
        expect((dict as any).community?.card?.adopting).toBeDefined();
        expect((dict as any).community?.card?.seedBadge).toBeDefined();
        expect((dict as any).community?.card?.communityBadge).toBeDefined();

        expect((dict as any).community?.shareModal?.title).toBeDefined();
        expect((dict as any).community?.shareModal?.subtitle).toBeDefined();
        expect((dict as any).community?.shareModal?.privacyNotice).toBeDefined();
        expect((dict as any).community?.shareModal?.nameLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.namePlaceholder).toBeDefined();
        expect((dict as any).community?.shareModal?.descriptionLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.descriptionPlaceholder).toBeDefined();
        expect((dict as any).community?.shareModal?.themeLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.materialsLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.materialsPlaceholder).toBeDefined();
        expect((dict as any).community?.shareModal?.ageMinLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.ageMaxLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.durationLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.supervisionLabel).toBeDefined();
        expect((dict as any).community?.shareModal?.cancelBtn).toBeDefined();
        expect((dict as any).community?.shareModal?.submitBtn).toBeDefined();
        expect((dict as any).community?.shareModal?.submitting).toBeDefined();
        expect((dict as any).community?.shareModal?.successToast).toBeDefined();
        expect((dict as any).community?.shareModal?.errorToast).toBeDefined();

        expect((dict as any).community?.adoptModal?.title).toBeDefined();
        expect((dict as any).community?.adoptModal?.subtitle).toBeDefined();
        expect((dict as any).community?.adoptModal?.learnerSelectLabel).toBeDefined();
        expect((dict as any).community?.adoptModal?.allLearnersOption).toBeDefined();
        expect((dict as any).community?.adoptModal?.cancelBtn).toBeDefined();
        expect((dict as any).community?.adoptModal?.confirmBtn).toBeDefined();
        expect((dict as any).community?.adoptModal?.adopting).toBeDefined();
        expect((dict as any).community?.adoptModal?.successToast).toBeDefined();
        expect((dict as any).community?.adoptModal?.errorToast).toBeDefined();
      }
    });
  });
});

describe('Guardrails de Integridade Estrutural e Paridade de Dicionários', () => {
  function collectKeysAndValues(obj: Record<string, any>, prefix = ''): { key: string; value: string }[] {
    const entries: { key: string; value: string }[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        entries.push({ key: fullKey, value: v });
      } else if (v && typeof v === 'object') {
        entries.push(...collectKeysAndValues(v, fullKey));
      }
    }
    return entries;
  }

  function extractVariables(template: string): string[] {
    const matches = [...template.matchAll(/\{(\w+)\}/g)];
    return matches.map((m) => m[1]!).sort();
  }

  it('garante que nenhuma chave em nenhum idioma seja vazia ou apenas espaços', () => {
    const ptEntries = collectKeysAndValues(ptBR);
    const enEntries = collectKeysAndValues(enUS);
    const esEntries = collectKeysAndValues(esES);

    for (const entry of [...ptEntries, ...enEntries, ...esEntries]) {
      expect(entry.value.trim().length, `Chave vazia detectada: ${entry.key}`).toBeGreaterThan(0);
    }
  });

  it('garante simetria exata de chaves e variáveis de interpolação {var} entre todos os idiomas', () => {
    const ptEntries = collectKeysAndValues(ptBR);
    const enMap = new Map(collectKeysAndValues(enUS).map((e) => [e.key, e.value]));
    const esMap = new Map(collectKeysAndValues(esES).map((e) => [e.key, e.value]));

    for (const { key, value: ptValue } of ptEntries) {
      expect(enMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em en-US`).toBe(true);
      expect(esMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em es-ES`).toBe(true);

      const ptVars = extractVariables(ptValue);
      const enVars = extractVariables(enMap.get(key)!);
      const esVars = extractVariables(esMap.get(key)!);

      expect(enVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e en-US`).toEqual(ptVars);
      expect(esVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e es-ES`).toEqual(ptVars);
    }
  });
});

