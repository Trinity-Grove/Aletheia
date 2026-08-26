'use client';

import React, { useState } from 'react';
import type {
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
} from '@aletheia/contracts';

export interface DataBackupCardProps {
  exportJobs?: DataExportJobResponseDto[];
  onExportPackage: () => Promise<FamilyDataExportPackageDto>;
  isLoading?: boolean;
}

export function DataBackupCard({
  exportJobs = [],
  onExportPackage,
  isLoading = false,
}: DataBackupCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setExportSuccessMessage(null);
    setErrorMessage(null);

    try {
      const exportPackage = await onExportPackage();
      
      const jsonContent = JSON.stringify(exportPackage, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `aletheia-family-backup-${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMessage('Backup exportado e baixado com sucesso! Seus dados estão seguros e em formato aberto.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao gerar o pacote de backup.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      data-testid="data-backup-card"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        padding: '1.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Soberania de Dados & Backup Completo
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
          Garantia absoluta de posse de dados. Exporte todos os registros pedagógicos, devocionais, notas e histórico da sua família em JSON estruturado a qualquer momento.
        </p>
      </div>

      {exportSuccessMessage && (
        <div
          data-testid="backup-export-success"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '0.5rem',
            color: '#065F46',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          ✓ {exportSuccessMessage}
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="backup-export-error"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '0.5rem',
            color: '#991B1B',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          ✕ {errorMessage}
        </div>
      )}

      <div
        style={{
          padding: '1.25rem',
          backgroundColor: '#F8FAFC',
          borderRadius: '0.5rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', marginTop: 0, marginBottom: '0.75rem' }}>
          O que está incluído no pacote de backup JSON:
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: '1.25rem',
            fontSize: '0.8125rem',
            color: '#475569',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.5rem',
          }}
        >
          <li>👨‍👩‍👧‍👦 Dados da Família & Configurações</li>
          <li>🎓 Perfis Pedagógicos dos Educandos</li>
          <li>📖 Leituras & Diário Devocional</li>
          <li>🙏 Pedidos & Diário de Orações</li>
          <li>📚 Anos Letivos, Disciplinas & Currículos</li>
          <li>📅 Cronogramas & Rotinas Semanais</li>
          <li>📝 Registros de Aprendizagem & Domínio</li>
          <li>🎨 Itens de Portfólio & Evidências</li>
          <li>📋 Registros Diários de Frequência</li>
          <li>⚖️ Metas de Conformidade & Históricos</li>
        </ul>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '0.5rem',
        }}
      >
        <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
          Formato: <strong>JSON (UTF-8)</strong> • Sem compressão proprietária • Totalmente portável
        </div>

        <button
          type="button"
          data-testid="export-full-data-btn"
          onClick={handleDownloadBackup}
          disabled={isLoading || isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.5rem',
            backgroundColor: isExporting ? '#9CA3AF' : '#059669',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          <span>📦</span>
          <span>{isExporting ? 'Exportando Pacote...' : 'Exportar Pacote Completo (JSON)'}</span>
        </button>
      </div>

      {exportJobs.length > 0 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
            Histórico de Solicitações de Exportação
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {exportJobs.map((job) => (
              <div
                key={job.id}
                data-testid={`export-job-item-${job.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                }}
              >
                <span>
                  Solicitado em {new Date(job.createdAt).toLocaleDateString()} às{' '}
                  {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span
                  style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    backgroundColor: job.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                    color: job.status === 'COMPLETED' ? '#065F46' : '#92400E',
                  }}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
