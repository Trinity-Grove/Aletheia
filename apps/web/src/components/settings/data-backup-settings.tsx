'use client';

import React, { useState } from 'react';
import { AletheiaIcon, Alert, Button, Card } from '@aletheia/ui';
import type { FamilyDataExportPackageDto } from '@aletheia/contracts';
import { getApiAuthToken } from '../../lib/api';
import { useAuth } from '../../lib/auth/auth-context';
import { Can } from '../auth/role-guard';

export interface DataBackupSettingsProps {
  familyId?: string;
  familyName?: string;
  onExportPackage?: () => Promise<FamilyDataExportPackageDto>;
}

export function DataBackupSettings({
  familyId: propFamilyId,
  familyName,
  onExportPackage,
}: DataBackupSettingsProps) {
  const auth = useAuth();
  const effectiveFamilyId =
    propFamilyId ||
    auth?.activeFamilyId ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('aletheia_active_family_id') || localStorage.getItem('familyId')
      : null);

  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let exportData: FamilyDataExportPackageDto;

      if (onExportPackage) {
        exportData = await onExportPackage();
      } else {
        if (!effectiveFamilyId) {
          throw new Error('Família ativa não encontrada para exportar o backup.');
        }

        const authToken = getApiAuthToken();
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(`/api/v1/families/${encodeURIComponent(effectiveFamilyId)}/export/package`, {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Falha ao baixar pacote completo de dados da família.');
        }

        exportData = await res.json();
      }

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateStr = new Date().toISOString().split('T')[0];
      const familyIdentifier = (familyName || effectiveFamilyId || 'family')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      link.setAttribute('download', `aletheia-backup-${familyIdentifier}-${dateStr}.json`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Backup integral baixado com sucesso! Seus dados familiares estão seguros.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao processar backup da família.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card data-testid="data-backup-settings" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--color-emerald-600)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="shield-check" size={24} />
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>
            Soberania de Dados & Backup Integral (LGPD)
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Em conformidade com a LGPD e o princípio de soberania familiar, você pode baixar a qualquer momento uma cópia integral de todos os dados da sua família em formato aberto (JSON).
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" data-testid="backup-export-success" style={{ marginBottom: '1.25rem' }}>
          {successMessage}
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
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.5rem' }}>
          Conteúdo do Backup JSON:
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
          Inclui configurações, perfis dos educandos, diários de aprendizagem, notas, devocionais, pedidos de oração, presenças e avaliações.
        </p>
        <div style={{ fontSize: '0.75rem', color: 'var(--forest)', fontWeight: 600 }}>
          ✓ Formato JSON Estruturado • Sem bloqueios proprietários • Portabilidade garantida
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Can
          action="export_family_data"
          fallback={
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="lock" size={14} />
              <span>Apenas responsáveis têm permissão para baixar o backup integral da família.</span>
            </div>
          }
        >
          <Button
            data-testid="download-full-backup-btn"
            onClick={handleDownloadBackup}
            disabled={isExporting}
            isLoading={isExporting}
            leftIcon={<AletheiaIcon name="download" size={16} />}
            style={{ fontWeight: 600 }}
          >
            Baixar Backup Completo Instantâneo (JSON)
          </Button>
        </Can>
      </div>
    </Card>
  );
}
