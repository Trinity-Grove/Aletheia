'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  AttendanceComplianceSummaryDto,
  AttendanceResponseDto,
  BulkLogAttendanceDto,
  ComplianceRequirementResponseDto,
  LearnerSummaryDto,
  LogAttendanceDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { AttendanceTrackerView } from '../../../src/components/reports/attendance-tracker-view';

export default function AttendancePage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceResponseDto[]>([]);
  const [complianceSummary, setComplianceSummary] =
    useState<AttendanceComplianceSummaryDto | null>(null);
  const [complianceRequirement, setComplianceRequirement] =
    useState<ComplianceRequirementResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Load: token, family, learners, requirements
  useEffect(() => {
    async function loadBaseData() {
      try {
        const token = localStorage.getItem('token');
        const storedFamilyId = localStorage.getItem('familyId');
        if (!token || !storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }

        // Requirements
        const reqRes = await fetch(`/api/v1/families/${storedFamilyId}/attendance/requirements`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          if (Array.isArray(reqData) && reqData.length > 0) {
            setComplianceRequirement(reqData[0]);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
  }, []);

  // Fetch Attendance Records
  const fetchAttendance = useCallback(async () => {
    if (!familyId) return;
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/attendance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  // Fetch Compliance Summary when a learner is focused
  const fetchComplianceSummary = useCallback(async () => {
    if (!familyId || !activeLearnerId) {
      setComplianceSummary(null);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/v1/families/${familyId}/attendance/summary?learnerId=${activeLearnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setComplianceSummary(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    fetchAttendance();
    fetchComplianceSummary();
  }, [fetchAttendance, fetchComplianceSummary]);

  // Actions
  const handleLogAttendance = async (dto: LogAttendanceDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao registrar frequência');
    }
    await fetchAttendance();
    await fetchComplianceSummary();
  };

  const handleBulkLogAttendance = async (dto: BulkLogAttendanceDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/attendance/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao registrar frequência coletiva');
    }
    await fetchAttendance();
    await fetchComplianceSummary();
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
            Controle de Frequência & Conformidade Legal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Acompanhe os dias letivos e carga horária anual dos educandos sem comparações entre irmãos.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando controle de frequência...
          </div>
        ) : (
          <AttendanceTrackerView
            records={records}
            complianceSummary={complianceSummary}
            complianceRequirement={complianceRequirement}
            learners={learners}
            activeLearnerId={activeLearnerId}
            onLogAttendance={handleLogAttendance}
            onBulkLogAttendance={handleBulkLogAttendance}
          />
        )}
      </div>
    </ProductShell>
  );
}
