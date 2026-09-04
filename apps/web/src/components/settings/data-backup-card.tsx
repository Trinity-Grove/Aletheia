'use client';

import React, { useState } from 'react';
import { AletheiaIcon, Alert, Badge, Button, Card } from '@aletheia/ui';
import type {
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

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
    <Card data-testid="data-backup-card" style={{ padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--color-emerald-600)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="shield-check" size={24} />
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Soberania de Dados & Backup Completo
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Garantia absoluta de posse de dados. Exporte todos os registros pedagógicos, devocionais, notas e histórico da sua família em JSON estruturado a qualquer momento.
        </p>
      </div>

      {exportSuccessMessage && (
        <Alert variant="success" data-testid="backup-export-success" style={{ marginBottom: '1.25rem' }}>
          {exportSuccessMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" data-testid="backup-export-error" style={{ marginBottom: '1.25rem' }}>
          {errorMessage}
        </Alert>
      )}

      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--sage-soft)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.75rem' }}>
          O que está incluído no pacote de backup JSON:
        </h3>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.5rem',
          }}
        >
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="users" size={14} style={{ color: 'var(--color-indigo-600)' }} /> Dados da Família & Configurações</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="graduation-cap" size={14} style={{ color: 'var(--color-indigo-600)' }} /> Perfis Pedagógicos dos Educandos</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="book-open" size={14} style={{ color: 'var(--color-amber-600)' }} /> Leituras & Diário Devocional</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="heart" size={14} style={{ color: 'var(--color-rose-600)' }} /> Pedidos & Diário de Orações</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="library" size={14} style={{ color: 'var(--color-indigo-700)' }} /> Anos Letivos, Disciplinas & Currículos</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="calendar" size={14} style={{ color: 'var(--color-emerald-600)' }} /> Cronogramas & Rotinas Semanais</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="file-text" size={14} style={{ color: 'var(--color-indigo-600)' }} /> Registros de Aprendizagem & Domínio</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="palette" size={14} style={{ color: 'var(--color-amber-600)' }} /> Itens de Portfólio & Evidências</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="clipboard-check" size={14} style={{ color: 'var(--color-emerald-600)' }} /> Registros Diários de Frequência</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AletheiaIcon name="compass" size={14} style={{ color: 'var(--color-indigo-700)' }} /> Metas de Conformidade & Históricos</li>
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
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Formato: <strong>JSON (UTF-8)</strong> • Sem compressão proprietária • Totalmente portável
        </div>

        <Can
          action="export_family_data"
          fallback={
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="lock" size={14} />
              <span>Apenas responsáveis podem exportar o pacote integral de dados da família.</span>
            </div>
          }
        >
          <Button
            data-testid="export-full-data-btn"
            onClick={handleDownloadBackup}
            disabled={isLoading || isExporting}
            isLoading={isExporting}
            leftIcon={<AletheiaIcon name="download" size={16} />}
          >
            Exportar Pacote Completo (JSON)
          </Button>
        </Can>
      </div>

      {exportJobs.length > 0 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
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
                  backgroundColor: 'var(--sage-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                }}
              >
                <span>
                  Solicitado em {new Date(job.createdAt).toLocaleDateString()} às{' '}
                  {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Badge variant={job.status === 'COMPLETED' ? 'emerald' : 'amber'} size="sm">
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
