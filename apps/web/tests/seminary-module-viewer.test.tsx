import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import { TheologicalLensCard } from '../src/components/curriculum/theological-lens-card';
import { SeminaryModuleViewer } from '../src/components/curriculum/seminary-module-viewer';
import SeminaryPage from '../app/(dashboard)/curriculum/seminary/page';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SeminaryModuleViewer and TheologicalLensCard (Task 3: Módulo de Seminário e Lente Confessional)', () => {
  describe('TheologicalLensCard', () => {
    it('renders Reformed confessional documents for REFORMED / PRESBYTERIAN traditions', () => {
      render(
        <LocaleProvider>
          <TheologicalLensCard
            preferredTraditionCode="REFORMED"
            disciplineCode="THEO.ADV.THEOLOGY_PROPER_TRINITY"
            disciplineName="Teologia Própria (Deus & Trindade)"
          />
        </LocaleProvider>
      );

      const card = screen.getByTestId('theological-lens-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(/Westminster/i);
      expect(card).toHaveTextContent(/Heidelberg/i);
      expect(card).toHaveTextContent(/Dort/i);
    });

    it('renders Baptist confessional documents for BAPTIST tradition', () => {
      render(
        <LocaleProvider>
          <TheologicalLensCard
            preferredTraditionCode="BAPTIST"
            disciplineCode="THEO.ADV.ECCLESIOLOGY_SACRAMENTS"
            disciplineName="Eclesiologia & Sacramentos"
          />
        </LocaleProvider>
      );

      const card = screen.getByTestId('theological-lens-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(/1689/i);
      expect(card).toHaveTextContent(/Baptist Faith and Message|Fé e Mensagem Batistas/i);
    });

    it('renders Lutheran confessional documents for LUTHERAN tradition', () => {
      render(
        <LocaleProvider>
          <TheologicalLensCard
            preferredTraditionCode="LUTHERAN"
            disciplineCode="THEO.ADV.SOTERIOLOGY"
          />
        </LocaleProvider>
      );

      const card = screen.getByTestId('theological-lens-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(/Augsburg|Augsburgo/i);
      expect(card).toHaveTextContent(/Concord|Concórdia/i);
    });

    it('renders Wesleyan-Arminian sources for WESLEYAN_ARMINIAN / METHODIST traditions', () => {
      render(
        <LocaleProvider>
          <TheologicalLensCard
            preferredTraditionCode="WESLEYAN_ARMINIAN"
            disciplineCode="THEO.ADV.SOTERIOLOGY"
          />
        </LocaleProvider>
      );

      const card = screen.getByTestId('theological-lens-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(/25/i);
      expect(card).toHaveTextContent(/Wesley/i);
    });

    it('renders Pentecostal statements for PENTECOSTAL_CHARISMATIC tradition', () => {
      render(
        <LocaleProvider>
          <TheologicalLensCard
            preferredTraditionCode="PENTECOSTAL_CHARISMATIC"
            disciplineCode="THEO.ADV.PNEUMATOLOGY"
          />
        </LocaleProvider>
      );

      const card = screen.getByTestId('theological-lens-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(/Espírito Santo|Batismo no Espírito|Dons/i);
    });

    it('renders ecumenical comparative lens when preferredTraditionCode is unset or null', () => {
      render(
        <LocaleProvider>
          <TheologicalLensCard
            preferredTraditionCode={null}
            disciplineCode="THEO.ADV.BIBLIOLOGY_CANON"
          />
        </LocaleProvider>
      );

      const card = screen.getByTestId('theological-lens-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(/Ecumênic|Panorâmic|Comparativ/i);
    });
  });

  describe('SeminaryModuleViewer', () => {
    it('renders viewer, cycle selector and navigates cycles 1 to 4', () => {
      render(
        <LocaleProvider>
          <SeminaryModuleViewer preferredTraditionCode="REFORMED" />
        </LocaleProvider>
      );

      const viewer = screen.getByTestId('seminary-module-viewer');
      expect(viewer).toBeInTheDocument();

      // Cycle 1 by default: displays Cycle 1 disciplines
      expect(screen.getByTestId('cycle-tab-1')).toBeInTheDocument();
      expect(screen.getAllByText('Bibliologia & Cânon').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Hermenêutica Bíblica').length).toBeGreaterThanOrEqual(1);

      // Navigate to Cycle 2
      fireEvent.click(screen.getByTestId('cycle-tab-2'));
      expect(screen.getAllByText('Teologia Própria (Deus & Trindade)').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cristologia & União Hipostática').length).toBeGreaterThanOrEqual(1);

      // Navigate to Cycle 3
      fireEvent.click(screen.getByTestId('cycle-tab-3'));
      expect(screen.getAllByText('Soteriologia (Graça, Eleição e Aliança)').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Escatologia Comparada (As 4 Escolas Milenistas)').length).toBeGreaterThanOrEqual(1);

      // Navigate to Cycle 4
      fireEvent.click(screen.getByTestId('cycle-tab-4'));
      expect(screen.getAllByText('Patrística').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Reforma Protestante').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Missiologia').length).toBeGreaterThanOrEqual(1);
    });

    it('allows selecting disciplines and renders description, topics and primary readings', () => {
      const onSelectEvidenceSubmission = vi.fn();

      render(
        <LocaleProvider>
          <SeminaryModuleViewer
            preferredTraditionCode="BAPTIST"
            onSelectEvidenceSubmission={onSelectEvidenceSubmission}
          />
        </LocaleProvider>
      );

      // Select Hermenêutica Bíblica in Cycle 1
      const hermeneuticsItem = screen.getByTestId('discipline-item-THEO.ADV.HERMENEUTICS');
      fireEvent.click(hermeneuticsItem);

      // Verify active details
      expect(screen.getByTestId('active-discipline-title')).toHaveTextContent('Hermenêutica Bíblica');
      expect(screen.getByTestId('competency-badge')).toHaveTextContent('THEO.ADV.HERMENEUTICS');
      expect(screen.getAllByText(/sensus literalis/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Milton S. Terry/i)).toBeInTheDocument();

      // Verify submit paper button
      const submitBtn = screen.getByTestId('submit-paper-btn');
      expect(submitBtn).toBeInTheDocument();
      fireEvent.click(submitBtn);

      expect(onSelectEvidenceSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'THEO.ADV.HERMENEUTICS',
        })
      );
    });

    it('displays the 4 millennial schools when THEO.ADV.ESCHATOLOGY_MILLENNIUM is selected', () => {
      render(
        <LocaleProvider>
          <SeminaryModuleViewer preferredTraditionCode="REFORMED" />
        </LocaleProvider>
      );

      // Go to Cycle 3
      fireEvent.click(screen.getByTestId('cycle-tab-3'));

      // Click Escatologia Comparada
      const eschatologyItem = screen.getByTestId('discipline-item-THEO.ADV.ESCHATOLOGY_MILLENNIUM');
      fireEvent.click(eschatologyItem);

      const millennialSection = screen.getByTestId('millennial-schools-section');
      expect(millennialSection).toBeInTheDocument();
      expect(millennialSection).toHaveTextContent('Pré-Milenismo Histórico');
      expect(millennialSection).toHaveTextContent('Pré-Milenismo Dispensacionalista');
      expect(millennialSection).toHaveTextContent('Amilenismo');
      expect(millennialSection).toHaveTextContent('Pós-Milenismo');
    });

    it('displays the 4 interpretive models when THEO.ADV.APOCALYPSE_MODELS is selected', () => {
      render(
        <LocaleProvider>
          <SeminaryModuleViewer preferredTraditionCode="REFORMED" />
        </LocaleProvider>
      );

      // Go to Cycle 3
      fireEvent.click(screen.getByTestId('cycle-tab-3'));

      // Click Modelos Interpretativos do Apocalipse
      const apocalypseItem = screen.getByTestId('discipline-item-THEO.ADV.APOCALYPSE_MODELS');
      fireEvent.click(apocalypseItem);

      const apocalypseSection = screen.getByTestId('apocalypse-models-section');
      expect(apocalypseSection).toBeInTheDocument();
      expect(apocalypseSection).toHaveTextContent('Preterista');
      expect(apocalypseSection).toHaveTextContent('Historicista');
      expect(apocalypseSection).toHaveTextContent('Idealista');
      expect(apocalypseSection).toHaveTextContent('Futurista');
    });
  });

  describe('SeminaryPage App Route', () => {
    it('renders the seminary page with breadcrumb navigation and viewer', () => {
      render(
        <LocaleProvider>
          <SeminaryPage />
        </LocaleProvider>
      );

      expect(screen.getByTestId('seminary-back-link')).toHaveAttribute('href', '/curriculum');
      expect(screen.getByTestId('seminary-module-viewer')).toBeInTheDocument();
    });
  });
});
