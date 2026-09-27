'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ROLLBACK_ELIGIBLE_ENTITY_TYPES,
  rollbackDefinitionVersionSchema,
  type DefinitionVersionOperationLogResponseDto,
  type RollbackDefinitionVersionResultDto,
  type RollbackEligibleEntityType,
} from '@aletheia/contracts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Select,
  Textarea,
} from '@aletheia/ui';
import { api } from '../../lib/api';

const logsPath = '/admin/curriculum-definitions/version-operations/logs';
const rollbackPath = '/admin/curriculum-definitions/version-operations/rollback';

export function VersionOperationsPanel() {
  const [logs, setLogs] = useState<DefinitionVersionOperationLogResponseDto[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Form states
  const [entityType, setEntityType] = useState<RollbackEligibleEntityType>(
    ROLLBACK_ELIGIBLE_ENTITY_TYPES[0],
  );
  const [code, setCode] = useState('');
  const [version, setVersion] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await api.get<DefinitionVersionOperationLogResponseDto[]>(logsPath);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setLogsError(err instanceof Error ? err.message : 'Não foi possível carregar os logs de operações.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleRollback(event: React.FormEvent) {
    event.preventDefault();
    setRollbackSuccess(null);
    setRollbackError(null);

    const parsed = rollbackDefinitionVersionSchema.safeParse({
      entityType,
      code: code.trim(),
      version: Number(version),
      reason: reason.trim() || undefined,
    });

    if (!parsed.success) {
      setRollbackError(parsed.error.issues.map((issue) => issue.message).join('; '));
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<RollbackDefinitionVersionResultDto>(rollbackPath, parsed.data);
      setRollbackSuccess(
        `Rollback lógico executado com sucesso para ${result.entityType} "${result.code}" (v${result.rolledBackVersion}). Nova versão ativa: ${
          result.newCurrentVersion !== null ? `v${result.newCurrentVersion}` : 'nenhuma'
        }.`,
      );
      setCode('');
      setVersion('');
      setReason('');
      await fetchLogs();
    } catch (err: unknown) {
      setRollbackError(err instanceof Error ? err.message : 'Falha ao executar rollback.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Rollback Section */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Rollback Lógico de Definições</h2>
          <p style={{ color: 'var(--text-secondary, #64748b)', margin: 0 }}>
            Deprecia a versão publicada selecionada de forma atômica e imutável. A resolução de versão ativa
            retornará à versão anterior publicada mais recente.
          </p>
        </div>

        {rollbackSuccess && (
          <div
            data-testid="rollback-success-alert"
            role="status"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            }}
          >
            {rollbackSuccess}
          </div>
        )}

        {rollbackError && (
          <div
            data-testid="rollback-error-alert"
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            }}
          >
            {rollbackError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle as="h3">Executar Rollback Lógico</CardTitle>
          </CardHeader>
          <CardContent>
            <form data-testid="rollback-form" onSubmit={handleRollback}>
              <fieldset
                disabled={submitting}
                style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '1rem', minWidth: 0 }}
              >
                <Select
                  label="Tipo de entidade"
                  data-testid="rollback-entity-type-select"
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value as RollbackEligibleEntityType)}
                  options={ROLLBACK_ELIGIBLE_ENTITY_TYPES.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  required
                />

                <Input
                  label="Código da definição"
                  data-testid="rollback-code-input"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Ex: MUSIC.BASS"
                  required
                  maxLength={150}
                />

                <Input
                  label="Versão a reverter"
                  data-testid="rollback-version-input"
                  type="number"
                  min={1}
                  step={1}
                  value={version}
                  onChange={(event) => setVersion(event.target.value)}
                  placeholder="Ex: 2"
                  required
                />

                <Textarea
                  label="Motivo / Justificativa"
                  data-testid="rollback-reason-input"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explique a razão técnica ou pedagógica deste rollback..."
                  maxLength={500}
                />

                <Button
                  type="submit"
                  data-testid="execute-rollback-btn"
                  isLoading={submitting}
                  disabled={submitting}
                  variant="primary"
                >
                  Executar Rollback Lógico
                </Button>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Audit Logs Section */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Histórico de Operações & Auditoria</h2>
            <p style={{ color: 'var(--text-secondary, #64748b)', margin: 0 }}>
              Registro imutável de migrações de referências e operações de rollback.
            </p>
          </div>
          <Button variant="ghost" onClick={fetchLogs} disabled={loadingLogs}>
            Atualizar logs
          </Button>
        </div>

        {loadingLogs ? (
          <p role="status">Carregando histórico de operações...</p>
        ) : logsError ? (
          <div>
            <p role="alert">{logsError}</p>
            <Button onClick={fetchLogs}>Tentar novamente</Button>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="Nenhuma operação registrada"
            description="Operações de rollback e migração de versão aparecerão aqui."
          />
        ) : (
          <div data-testid="version-operation-logs-list" style={{ display: 'grid', gap: '1rem' }}>
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <CardTitle as="h3">
                    {log.operationType === 'ROLLBACK' ? 'Rollback Lógico' : 'Migração de Referências'}
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ display: 'grid', gap: '0.5rem', overflowWrap: 'anywhere' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong>Entidade:</strong>
                    <span>{log.affectedEntityType || 'N/A'}</span>
                    <strong>Código:</strong>
                    <code>{log.definitionCode}</code>
                  </div>
                  <div>
                    <span>
                      Versão: v{log.fromVersion} → {log.toVersion !== null ? `v${log.toVersion}` : 'Depreciada'}
                    </span>
                  </div>
                  {log.metadata && typeof log.metadata === 'object' && 'reason' in log.metadata && (
                    <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)' }}>
                      <strong>Motivo:</strong> {String(log.metadata.reason)}
                    </p>
                  )}
                  <small style={{ color: 'var(--text-secondary, #64748b)' }}>
                    Data: {new Date(log.createdAt).toLocaleString('pt-BR')} | ID: {log.id}
                  </small>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
