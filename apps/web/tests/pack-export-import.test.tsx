import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  CurriculumPackExportDocument,
  CurriculumPackImportReport,
  FamilyDataExportPackageDto,
} from '@aletheia/contracts';
import { DataBackupSettings } from '../src/components/settings/data-backup-settings';
import { DataBackupCard } from '../src/components/settings/data-backup-card';
import { CurriculumPacksGallery } from '../src/components/curriculum/curriculum-packs-gallery';
import { CurriculumPackImportModal } from '../src/components/curriculum/curriculum-pack-import-modal';
import { AuthProvider } from '../src/lib/auth/rbac-context';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/curriculum/packs',
  useParams: () => ({}),
}));

function createAuthContextValue(familyId = 'fam-uuid-123'): AuthContextValue {
  return {
    status: 'authenticated',
    user: {
      id: 'user-uuid-1',
      email: 'admin@example.com',
      fullName: 'Admin Silva',
      emailVerified: true,
      mfaEnabled: false,
      isPlatformAdmin: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    token: 'test-admin-jwt-token',
    activeFamilyId: familyId,
    activeFamily: null,
    families: [],
    activeRole: 'OWNER_GUARDIAN',
    login: vi.fn(),
    verifyMfa: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

const mockFamilyExportPackage: FamilyDataExportPackageDto = {
  version: '1.0.0',
  exportedAt: '2026-09-17T12:00:00.000Z',
  family: {
    id: 'fam-uuid-123',
    name: 'Família Silva',
    countryCode: 'BRA',
    stateProvince: 'SP',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  members: [],
  learners: [
    {
      id: 'learner-1',
      displayName: 'Pedro',
      birthDate: '2016-05-10',
    },
  ],
  devotionals: [],
  prayerRequests: [],
  learningRecords: [],
  attendanceRecords: [],
  complianceRequirements: [],
};

const mockExportPackDoc: CurriculumPackExportDocument = {
  formatVersion: '1.0.0',
  exportedAt: '2026-09-17T12:00:00.000Z',
  pack: {
    code: 'MATH.CLASSICAL.1',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Matemática Clássica I',
    description: 'Aritmética e geometria com fundamentos clássicos.',
    metadata: { category: 'Quadrivium' },
  },
  items: [
    {
      definitionType: 'CompetencyDefinition',
      code: 'MATH.ARITH.1',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      content: { title: 'Aritmética Elementar' },
    },
  ],
  dependencies: [],
};

const mockDryRunReport: CurriculumPackImportReport = {
  dryRun: true,
  pack: {
    code: 'MATH.CLASSICAL.1',
    version: 1,
    outcome: 'WOULD_CREATE',
  },
  wouldCreate: [
    { type: 'CompetencyDefinition', code: 'MATH.ARITH.1', version: 1 },
  ],
  created: [],
  conflicts: [],
  missingDependencies: [],
  blocked: [],
};

const mockConfirmedReport: CurriculumPackImportReport = {
  dryRun: false,
  pack: {
    code: 'MATH.CLASSICAL.1',
    version: 1,
    outcome: 'CREATED',
  },
  wouldCreate: [],
  created: [
    { type: 'CompetencyDefinition', code: 'MATH.ARITH.1', version: 1 },
  ],
  conflicts: [],
  missingDependencies: [],
  blocked: [],
};

describe('Módulo 3: Pack Export/Import & Family Backup', () => {
  let clickSpy: any;
  let createObjectURLMock: any;
  let revokeObjectURLMock: any;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('familyId', 'fam-uuid-123');
    localStorage.setItem('aletheia_active_family_id', 'fam-uuid-123');

    createObjectURLMock = vi.fn().mockReturnValue('blob:aletheia-test');
    revokeObjectURLMock = vi.fn();
    (global as any).URL.createObjectURL = createObjectURLMock;
    (global as any).URL.revokeObjectURL = revokeObjectURLMock;

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Download Integral de Dados da Família (LGPD)', () => {
    it('downloads complete family backup JSON via GET /families/:familyId/export/package', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockFamilyExportPackage,
      } as Response);

      const authValue = createAuthContextValue('fam-uuid-123');

      render(
        <AuthContext.Provider value={authValue}>
          <AuthProvider initialRole="OWNER_GUARDIAN">
            <DataBackupSettings familyId="fam-uuid-123" familyName="Silva" />
          </AuthProvider>
        </AuthContext.Provider>
      );

      const downloadBtn = screen.getByTestId('download-full-backup-btn');
      expect(downloadBtn).toBeInTheDocument();
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/families/fam-uuid-123/export/package',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include',
          })
        );
      });

      await waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(screen.getByTestId('backup-export-success')).toBeInTheDocument();
      });
    });

    it('displays error alert when backup endpoint fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Serviço de backup temporariamente indisponível.' }),
      } as Response);

      const authValue = createAuthContextValue('fam-uuid-123');

      render(
        <AuthContext.Provider value={authValue}>
          <AuthProvider initialRole="OWNER_GUARDIAN">
            <DataBackupSettings familyId="fam-uuid-123" />
          </AuthProvider>
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByTestId('download-full-backup-btn'));

      await waitFor(() => {
        const errorAlert = screen.getByTestId('backup-export-error');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/Serviço de backup temporariamente indisponível/i);
      });
    });

    it('DataBackupCard also supports download-full-backup-btn testid', async () => {
      const onExportMock = vi.fn().mockResolvedValue(mockFamilyExportPackage);

      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <DataBackupCard onExportPackage={onExportMock} />
        </AuthProvider>
      );

      const downloadBtn = screen.getByTestId('download-full-backup-btn');
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(onExportMock).toHaveBeenCalled();
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Exportação de Pacote Curricular (Admin)', () => {
    it('exports published pack as portable JSON via GET /admin/curriculum-packs/:id/export', async () => {
      const catalogPack = {
        id: 'pack-99',
        code: 'MATH.CLASSICAL.1',
        name: 'Matemática Clássica I',
        description: 'Aritmética e geometria clássica.',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        metadata: { category: 'Quadrivium' },
        createdAt: '2026-09-10T00:00:00.000Z',
        updatedAt: '2026-09-10T00:00:00.000Z',
      };

      const fetchSpy = vi.spyOn(global, 'fetch')
        // Available catalog packs
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [catalogPack],
        } as Response)
        // Installed packs
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        // Export pack endpoint
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockExportPackDoc,
        } as Response);

      render(<CurriculumPacksGallery familyId="fam-uuid-123" />);

      await waitFor(() => {
        expect(screen.getByText('Matemática Clássica I')).toBeInTheDocument();
      });

      const exportBtn = screen.getByTestId('export-pack-btn-pack-99');
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/admin/curriculum-packs/pack-99/export',
          expect.objectContaining({ credentials: 'include' })
        );
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Importação de Pacote Curricular (Admin)', () => {
    it('opens import modal from gallery button', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);

      render(<CurriculumPacksGallery familyId="fam-uuid-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('open-import-pack-modal-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('open-import-pack-modal-btn'));

      expect(screen.getByTestId('curriculum-pack-import-modal')).toBeInTheDocument();
      expect(screen.getByText('Importar Pacote Curricular (Admin)')).toBeInTheDocument();
    });

    it('runs dryRun simulation and displays report without writing to database', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDryRunReport,
      } as Response);

      render(
        <CurriculumPackImportModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Paste document JSON
      const textarea = screen.getByTestId('import-pack-json-input');
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(mockExportPackDoc) },
      });

      const dryRunBtn = screen.getByTestId('dry-run-import-btn');
      fireEvent.click(dryRunBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/admin/curriculum-packs/import',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
              document: mockExportPackDoc,
              dryRun: true,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('import-report-card')).toBeInTheDocument();
        expect(screen.getByText(/Relatório de Simulação \(Dry Run\)/i)).toBeInTheDocument();
        expect(screen.getByText('WOULD_CREATE')).toBeInTheDocument();
      });
    });

    it('confirms definitive import (dryRun: false) and triggers onImportSuccess callback', async () => {
      const onImportSuccess = vi.fn();
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfirmedReport,
      } as Response);

      render(
        <CurriculumPackImportModal
          isOpen={true}
          onClose={vi.fn()}
          onImportSuccess={onImportSuccess}
        />
      );

      const textarea = screen.getByTestId('import-pack-json-input');
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(mockExportPackDoc) },
      });

      const confirmBtn = screen.getByTestId('confirm-import-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/admin/curriculum-packs/import',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
              document: mockExportPackDoc,
              dryRun: false,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('import-success-alert')).toBeInTheDocument();
        expect(screen.getByText(/importado com sucesso!/i)).toBeInTheDocument();
        expect(onImportSuccess).toHaveBeenCalled();
      });
    });

    it('handles invalid JSON text and displays error alert', async () => {
      render(
        <CurriculumPackImportModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const textarea = screen.getByTestId('import-pack-json-input');
      fireEvent.change(textarea, {
        target: { value: '{ this is not valid json }' },
      });

      fireEvent.click(screen.getByTestId('dry-run-import-btn'));

      await waitFor(() => {
        const errorAlert = screen.getByTestId('import-error-alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/JSON inválido ou malformatado/i);
      });
    });

    it('displays error when backend rejects document import (e.g. 400)', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Incompatible formatVersion: 99.0.0' }),
      } as Response);

      render(
        <CurriculumPackImportModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const textarea = screen.getByTestId('import-pack-json-input');
      fireEvent.change(textarea, {
        target: { value: JSON.stringify(mockExportPackDoc) },
      });

      fireEvent.click(screen.getByTestId('dry-run-import-btn'));

      await waitFor(() => {
        const errorAlert = screen.getByTestId('import-error-alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('Incompatible formatVersion: 99.0.0');
      });
    });
  });
});
