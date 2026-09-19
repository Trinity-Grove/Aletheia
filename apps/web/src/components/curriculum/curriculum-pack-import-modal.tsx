'use client';

import React, { useState } from 'react';
import { Alert, Badge, Button, Modal, Textarea } from '@aletheia/ui';
import type {
  CurriculumPackExportDocument,
  CurriculumPackImportReport,
} from '@aletheia/contracts';
import { getApiAuthToken } from '../../lib/api';

export interface CurriculumPackImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export function CurriculumPackImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: CurriculumPackImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<CurriculumPackImportReport | null>(null);

  const resetState = () => {
    setJsonText('');
    setFileName(null);
    setError(null);
    setSuccessMsg(null);
    setImportReport(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    setImportReport(null);

    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const parseDocument = (): CurriculumPackExportDocument => {
    const trimmed = jsonText.trim();
    if (!trimmed) {
      throw new Error('Insira ou faça upload do documento JSON do pacote curricular.');
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Conteúdo inválido: o JSON deve representar um objeto.');
      }
      return parsed as CurriculumPackExportDocument;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Conteúdo inválido')) {
        throw err;
      }
      throw new Error('JSON inválido ou malformatado. Verifique a sintaxe.');
    }
  };

  const handleDryRun = async () => {
    setError(null);
    setSuccessMsg(null);
    setImportReport(null);

    let doc: CurriculumPackExportDocument;
    try {
      doc = parseDocument();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'JSON inválido.');
      return;
    }

    setIsValidating(true);
    try {
      const authToken = getApiAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/v1/admin/curriculum-packs/import', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          document: doc,
          dryRun: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Falha na validação do pacote curricular.');
      }

      const report: CurriculumPackImportReport = await res.json();
      setImportReport(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao validar importação.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    setError(null);
    setSuccessMsg(null);

    let doc: CurriculumPackExportDocument;
    try {
      doc = parseDocument();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'JSON inválido.');
      return;
    }

    setIsImporting(true);
    try {
      const authToken = getApiAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/v1/admin/curriculum-packs/import', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          document: doc,
          dryRun: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Falha ao importar o pacote curricular.');
      }

      const report: CurriculumPackImportReport = await res.json();
      setImportReport(report);
      setSuccessMsg(
        `Pacote "${report.pack.code}" importado com sucesso! Foram adicionadas ${report.created.length} novas definições curriculares.`
      );

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar importação.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Pacote Curricular (Admin)"
      maxWidth="lg"
    >
      <div
        data-testid="curriculum-pack-import-modal"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          padding: '0.5rem 0',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Selecione ou cole o documento JSON portátil de um pacote curricular publicado. Você pode simular a importação previamente (dry-run) para auditar os itens e dependências antes de gravar as alterações.
        </p>

        {error && (
          <Alert variant="error" data-testid="import-error-alert">
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert variant="success" data-testid="import-success-alert">
            {successMsg}
          </Alert>
        )}

        {/* File upload input */}
        <div>
          <label
            htmlFor="import-pack-file-input"
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--forest)',
              marginBottom: '0.375rem',
            }}
          >
            Carregar Arquivo .json:
          </label>
          <input
            id="import-pack-file-input"
            data-testid="import-pack-file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            style={{
              display: 'block',
              width: '100%',
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
            }}
          />
          {fileName && (
            <span style={{ fontSize: '0.75rem', color: 'var(--sage)', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>
              Arquivo carregado: {fileName}
            </span>
          )}
        </div>

        {/* Textarea for JSON content */}
        <div>
          <label
            htmlFor="import-pack-json-input"
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--forest)',
              marginBottom: '0.375rem',
            }}
          >
            Ou Cole o Conteúdo do Documento JSON:
          </label>
          <Textarea
            id="import-pack-json-input"
            data-testid="import-pack-json-input"
            rows={8}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (error) setError(null);
            }}
            placeholder='{\n  "formatVersion": "1.0.0",\n  "exportedAt": "...",\n  "pack": { "code": "MATH.CLASSICAL.1", ... }\n}'
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              width: '100%',
              backgroundColor: 'var(--bg-canvas)',
            }}
          />
        </div>

        {/* Dry run validation report card */}
        {importReport && (
          <div
            data-testid="import-report-card"
            style={{
              padding: '1rem',
              backgroundColor: 'var(--sage-soft)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--forest)' }}>
                Relatório de {importReport.dryRun ? 'Simulação (Dry Run)' : 'Importação Definitiva'}
              </span>
              <Badge variant={importReport.pack.outcome === 'ALREADY_EXISTS' ? 'amber' : 'emerald'} size="sm">
                {importReport.pack.outcome}
              </Badge>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              <div>
                <strong>Código do Pacote:</strong> {importReport.pack.code} (v{importReport.pack.version})
              </div>
              <div>
                <strong>Itens Criados/A Criar:</strong>{' '}
                {importReport.dryRun ? importReport.wouldCreate.length : importReport.created.length}
              </div>
              <div>
                <strong>Conflitos Existentes:</strong> {importReport.conflicts.length}
              </div>
              <div>
                <strong>Dependências Ausentes:</strong> {importReport.missingDependencies.length}
              </div>
            </div>

            {importReport.conflicts.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-amber-700, #b45309)', marginTop: '0.25rem' }}>
                Nota: {importReport.conflicts.length} itens já existem no banco e serão preservados sem sobreescrita.
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="secondary" onClick={handleClose} disabled={isValidating || isImporting}>
            Cancelar
          </Button>

          <Button
            variant="secondary"
            data-testid="dry-run-import-btn"
            onClick={handleDryRun}
            isLoading={isValidating}
            disabled={isValidating || isImporting || !jsonText.trim()}
          >
            Validar / Simular Importação (Dry Run)
          </Button>

          <Button
            variant="primary"
            data-testid="confirm-import-btn"
            onClick={handleConfirmImport}
            isLoading={isImporting}
            disabled={isValidating || isImporting || !jsonText.trim()}
          >
            Confirmar Importação Definitiva
          </Button>
        </div>
      </div>
    </Modal>
  );
}
