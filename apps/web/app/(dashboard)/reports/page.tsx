'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  GenerateReportDto,
  LearnerSummaryDto,
  OfficialReportResponseDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { ReportGeneratorView } from '../../../src/components/reports/report-generator-view';

export default function ReportsPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [reports, setReports] = useState<OfficialReportResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Load: family, learners
  useEffect(() => {
    async function loadBaseData() {
      try {
        const storedFamilyId = localStorage.getItem('familyId');
        if (!storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          credentials: 'include',
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
  }, []);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    if (!familyId) return;
    try {
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/reports?${params.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Actions
  const handleGenerateReport = async (
    dto: GenerateReportDto
  ): Promise<OfficialReportResponseDto | void> => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao gerar relatório oficial');
    }
    const createdReport: OfficialReportResponseDto = await res.json();
    await fetchReports();
    return createdReport;
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/reports/${reportId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      await fetchReports();
    }
  };

  const handleExportCsv = async (reportId: string) => {
    if (!familyId) return;
    const res = await fetch(`/api/v1/families/${familyId}/reports/${reportId}/export/csv`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.content) {
        const blob = new Blob([data.content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', data.filename || `report_${reportId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <ProductShell
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Gerador de Documentos & Históricos Oficiais
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Emita históricos escolares com conversão flexível de notas, sumários de presença e relatórios de conformidade.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando relatórios oficiais...
          </div>
        ) : (
          <ReportGeneratorView
            reports={reports}
            learners={learners}
            activeLearnerId={activeLearnerId}
            onGenerateReport={handleGenerateReport}
            onDeleteReport={handleDeleteReport}
            onExportCsv={handleExportCsv}
          />
        )}
      </div>
    </ProductShell>
  );
}
