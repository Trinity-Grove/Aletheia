'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Button, Card, Input, Select } from '@aletheia/ui';
import type {
  PedagogicalModelCatalogEntryDto,
  TheologicalTraditionCatalogEntryDto,
  PedagogicalProfileResponseDto,
  TheologicalProfileResponseDto,
  SecondaryPedagogicalModel,
} from '@aletheia/contracts';

export interface PedagogicalTheologicalProfileSettingsProps {
  familyId: string;
}

// Family-facing UI for PedagogicalProfile/TheologicalProfile (issue #96
// Fase 1, PRs #110/#113 -- issue #126 item 1). Fetches its own data
// (catalogs + current profile + history) the same self-contained way
// TemplateModal already does for the pedagogical model catalog, rather
// than threading six more pieces of state through the Settings page.
// Both profiles are append-only on the backend -- "saving" here always
// creates a new version; nothing is ever destroyed, which is why a
// read-only version history list is shown for each.
export function PedagogicalTheologicalProfileSettings({ familyId }: PedagogicalTheologicalProfileSettingsProps) {
  const [pedagogicalCatalog, setPedagogicalCatalog] = useState<PedagogicalModelCatalogEntryDto[]>([]);
  const [theologicalCatalog, setTheologicalCatalog] = useState<TheologicalTraditionCatalogEntryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [pedagogicalHistory, setPedagogicalHistory] = useState<PedagogicalProfileResponseDto[]>([]);
  const [primaryModelCode, setPrimaryModelCode] = useState('');
  const [secondaryModels, setSecondaryModels] = useState<SecondaryPedagogicalModel[]>([]);
  const [pedagogicalOverrides, setPedagogicalOverrides] = useState<PedagogicalProfileResponseDto['overrides']>({});
  const [newSecondaryCode, setNewSecondaryCode] = useState('');
  const [newSecondaryWeight, setNewSecondaryWeight] = useState('0.5');
  const [savingPedagogical, setSavingPedagogical] = useState(false);
  const [pedagogicalError, setPedagogicalError] = useState<string | null>(null);
  const [pedagogicalSuccess, setPedagogicalSuccess] = useState<string | null>(null);

  const [theologicalHistory, setTheologicalHistory] = useState<TheologicalProfileResponseDto[]>([]);
  const [preferredTraditionCode, setPreferredTraditionCode] = useState('');
  const [topicOverrides, setTopicOverrides] = useState<TheologicalProfileResponseDto['topicOverrides']>({});
  const [savingTheological, setSavingTheological] = useState(false);
  const [theologicalError, setTheologicalError] = useState<string | null>(null);
  const [theologicalSuccess, setTheologicalSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      try {
        const [pedCatalogRes, theoCatalogRes, pedProfileRes, pedHistoryRes, theoProfileRes, theoHistoryRes] =
          await Promise.all([
            fetch(`/api/v1/families/${familyId}/curriculum/templates/catalog`, { credentials: 'include' }),
            fetch(`/api/v1/families/${familyId}/curriculum/theological-traditions/catalog`, {
              credentials: 'include',
            }),
            fetch(`/api/v1/families/${familyId}/curriculum/pedagogical-profile`, { credentials: 'include' }),
            fetch(`/api/v1/families/${familyId}/curriculum/pedagogical-profile/history`, {
              credentials: 'include',
            }),
            fetch(`/api/v1/families/${familyId}/curriculum/theological-profile`, { credentials: 'include' }),
            fetch(`/api/v1/families/${familyId}/curriculum/theological-profile/history`, {
              credentials: 'include',
            }),
          ]);
        if (cancelled) return;

        if (pedCatalogRes.ok) setPedagogicalCatalog(await pedCatalogRes.json());
        if (theoCatalogRes.ok) setTheologicalCatalog(await theoCatalogRes.json());

        if (pedProfileRes.ok) {
          const profile: PedagogicalProfileResponseDto | null = await pedProfileRes.json();
          setPedagogicalOverrides(profile?.overrides ?? {});
          if (profile) {
            setPrimaryModelCode(profile.primaryModelCode);
            setSecondaryModels(profile.secondaryModels);
          }
        }
        if (pedHistoryRes.ok) setPedagogicalHistory(await pedHistoryRes.json());

        if (theoProfileRes.ok) {
          const profile: TheologicalProfileResponseDto | null = await theoProfileRes.json();
          setTopicOverrides(profile?.topicOverrides ?? {});
          if (profile?.preferredTraditionCode) setPreferredTraditionCode(profile.preferredTraditionCode);
        }
        if (theoHistoryRes.ok) setTheologicalHistory(await theoHistoryRes.json());
      } catch {
        // Leave defaults in place on a network error -- the form is
        // still usable, just starting empty.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [familyId]);

  const handleAddSecondaryModel = () => {
    if (!newSecondaryCode || newSecondaryCode === primaryModelCode) return;
    const weight = Number(newSecondaryWeight);
    if (Number.isNaN(weight) || weight < 0 || weight > 1) return;
    if (secondaryModels.some((m) => m.code === newSecondaryCode)) return;
    setSecondaryModels((prev) => [...prev, { code: newSecondaryCode, weight }]);
    setNewSecondaryCode('');
    setNewSecondaryWeight('0.5');
  };

  const handlePrimaryModelChange = (code: string) => {
    setPrimaryModelCode(code);
    setSecondaryModels((prev) => prev.filter((model) => model.code !== code));
    setNewSecondaryCode((prev) => prev === code ? '' : prev);
  };

  const handleRemoveSecondaryModel = (code: string) => {
    setSecondaryModels((prev) => prev.filter((m) => m.code !== code));
  };

  const handleSavePedagogicalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryModelCode) return;
    setSavingPedagogical(true);
    setPedagogicalError(null);
    setPedagogicalSuccess(null);
    try {
      const res = await fetch(`/api/v1/families/${familyId}/curriculum/pedagogical-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ primaryModelCode, secondaryModels, overrides: pedagogicalOverrides }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao salvar o perfil pedagógico.');
      }
      const updated: PedagogicalProfileResponseDto = await res.json();
      setPedagogicalHistory((prev) => [updated, ...prev]);
      setPedagogicalSuccess('Perfil pedagógico atualizado -- uma nova versão foi criada, sem apagar o histórico.');
    } catch (err) {
      setPedagogicalError(err instanceof Error ? err.message : 'Erro ao salvar o perfil pedagógico.');
    } finally {
      setSavingPedagogical(false);
    }
  };

  const handleSaveTheologicalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTheological(true);
    setTheologicalError(null);
    setTheologicalSuccess(null);
    try {
      const res = await fetch(`/api/v1/families/${familyId}/curriculum/theological-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredTraditionCode: preferredTraditionCode || null, topicOverrides }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao salvar o perfil teológico.');
      }
      const updated: TheologicalProfileResponseDto = await res.json();
      setTheologicalHistory((prev) => [updated, ...prev]);
      setTheologicalSuccess('Perfil teológico atualizado -- uma nova versão foi criada, sem apagar o histórico.');
    } catch (err) {
      setTheologicalError(err instanceof Error ? err.message : 'Erro ao salvar o perfil teológico.');
    } finally {
      setSavingTheological(false);
    }
  };

  const secondaryCandidates = pedagogicalCatalog.filter(
    (c) => c.code !== primaryModelCode && !secondaryModels.some((m) => m.code === c.code),
  );

  const modelName = (code: string) => pedagogicalCatalog.find((c) => c.code === code)?.name ?? code;
  const traditionName = (code: string) => theologicalCatalog.find((c) => c.code === code)?.name ?? code;

  if (loading) {
    return (
      <Card data-testid="profile-settings-loading" style={{ padding: '1.75rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Carregando perfis...</div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Card data-testid="pedagogical-profile-card" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Perfil Pedagógico
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Escolha o modelo pedagógico principal da família e, opcionalmente, combine modelos secundários com pesos.
          </p>
        </div>

        {pedagogicalSuccess && (
          <Alert variant="success" data-testid="pedagogical-profile-success-alert" style={{ marginBottom: '1.25rem' }}>
            {pedagogicalSuccess}
          </Alert>
        )}
        {pedagogicalError && (
          <Alert variant="error" data-testid="pedagogical-profile-error-alert" style={{ marginBottom: '1.25rem' }}>
            {pedagogicalError}
          </Alert>
        )}

        <form data-testid="pedagogical-profile-form" onSubmit={handleSavePedagogicalProfile}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <Select
              label="Modelo Pedagógico Principal"
              data-testid="primary-model-select"
              value={primaryModelCode}
              onChange={(e) => handlePrimaryModelChange(e.target.value)}
              disabled={savingPedagogical}
              options={[
                { value: '', label: 'Selecione um modelo...' },
                ...pedagogicalCatalog.map((c) => ({ value: c.code, label: c.name })),
              ]}
            />

            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Modelos Secundários (combinados, com peso)
              </div>

              {secondaryModels.length > 0 && (
                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {secondaryModels.map((m) => (
                    <div
                      key={m.code}
                      data-testid={`secondary-model-row-${m.code}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <span>
                        {modelName(m.code)} <span style={{ color: 'var(--text-secondary)' }}>(peso {m.weight})</span>
                      </span>
                      <button
                        type="button"
                        data-testid={`remove-secondary-model-${m.code}`}
                        onClick={() => handleRemoveSecondaryModel(m.code)}
                        aria-label={`Remover ${modelName(m.code)}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red-600)' }}
                      >
                        <AletheiaIcon name="x" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <Select
                    label="Adicionar modelo secundário"
                    data-testid="new-secondary-model-select"
                    value={newSecondaryCode}
                    onChange={(e) => setNewSecondaryCode(e.target.value)}
                    disabled={savingPedagogical || secondaryCandidates.length === 0}
                    options={[
                      { value: '', label: 'Selecione...' },
                      ...secondaryCandidates.map((c) => ({ value: c.code, label: c.name })),
                    ]}
                  />
                </div>
                <div style={{ width: '110px' }}>
                  <Input
                    label="Peso (0-1)"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    data-testid="new-secondary-model-weight-input"
                    value={newSecondaryWeight}
                    onChange={(e) => setNewSecondaryWeight(e.target.value)}
                    disabled={savingPedagogical}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="add-secondary-model-btn"
                  onClick={handleAddSecondaryModel}
                  disabled={savingPedagogical || !newSecondaryCode}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                data-testid="save-pedagogical-profile-btn"
                isLoading={savingPedagogical}
                disabled={!primaryModelCode}
              >
                Salvar Perfil Pedagógico
              </Button>
            </div>
          </div>
        </form>

        {pedagogicalHistory.length > 0 && (
          <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Histórico de Versões
            </div>
            <div style={{ display: 'grid', gap: '0.375rem' }} data-testid="pedagogical-profile-history-list">
              {pedagogicalHistory.map((version) => (
                <div
                  key={version.id}
                  data-testid={`pedagogical-profile-history-item-${version.version}`}
                  style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
                >
                  v{version.version} -- {modelName(version.primaryModelCode)}
                  {version.secondaryModels.length > 0
                    ? ` + ${version.secondaryModels.map((m) => modelName(m.code)).join(', ')}`
                    : ''}
                  {' '}({new Date(version.createdAt).toLocaleDateString('pt-BR')})
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card data-testid="theological-profile-card" style={{ padding: '1.75rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Perfil Teológico
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Escolha a tradição teológica preferencial da família.
          </p>
        </div>

        {theologicalSuccess && (
          <Alert variant="success" data-testid="theological-profile-success-alert" style={{ marginBottom: '1.25rem' }}>
            {theologicalSuccess}
          </Alert>
        )}
        {theologicalError && (
          <Alert variant="error" data-testid="theological-profile-error-alert" style={{ marginBottom: '1.25rem' }}>
            {theologicalError}
          </Alert>
        )}

        <form data-testid="theological-profile-form" onSubmit={handleSaveTheologicalProfile}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {Object.keys(topicOverrides).length > 0 && (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Exceções por tema
                </div>
                <ul style={{ display: 'grid', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                  {Object.entries(topicOverrides).map(([topic, code]) => (
                    <li key={topic} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span>{topic}: {code}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        aria-label={`Remover exceção ${topic}: ${code}`}
                        disabled={savingTheological}
                        onClick={() => setTopicOverrides((previous) => Object.fromEntries(
                          Object.entries(previous).filter(([key]) => key !== topic),
                        ))}
                      >
                        Remover
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Select
              label="Tradição Teológica Preferencial"
              data-testid="preferred-tradition-select"
              value={preferredTraditionCode}
              onChange={(e) => setPreferredTraditionCode(e.target.value)}
              disabled={savingTheological}
              options={[
                { value: '', label: 'Nenhuma preferência' },
                ...theologicalCatalog.map((c) => ({ value: c.code, label: c.name })),
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" data-testid="save-theological-profile-btn" isLoading={savingTheological}>
                Salvar Perfil Teológico
              </Button>
            </div>
          </div>
        </form>

        {theologicalHistory.length > 0 && (
          <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Histórico de Versões
            </div>
            <div style={{ display: 'grid', gap: '0.375rem' }} data-testid="theological-profile-history-list">
              {theologicalHistory.map((version) => (
                <div
                  key={version.id}
                  data-testid={`theological-profile-history-item-${version.version}`}
                  style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
                >
                  v{version.version} --{' '}
                  {version.preferredTraditionCode ? traditionName(version.preferredTraditionCode) : 'sem preferência'}
                  {' '}({new Date(version.createdAt).toLocaleDateString('pt-BR')})
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
