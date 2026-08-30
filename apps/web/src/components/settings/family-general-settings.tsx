'use client';

import React, { useState, useEffect } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  FamilySettingsResponseDto,
  GradingScale,
  UpdateFamilySettingsDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { useAuthRole } from '../../lib/auth/rbac-context';

export interface FamilyGeneralSettingsProps {
  settings: FamilySettingsResponseDto | null;
  onSave: (dto: UpdateFamilySettingsDto) => Promise<void>;
  isLoading?: boolean;
}

const GRADING_SCALES: Array<{ value: GradingScale; label: string; description: string }> = [
  {
    value: 'MASTERY_QUALITATIVE',
    label: 'Escala Qualitativa de Domínio (Charlotte Mason / Clássico)',
    description: 'Avalia estágios de assimilação e hábitos de virtude (Introduzido, Em Progresso, Autônomo, Dominado).',
  },
  {
    value: 'LETTER_A_F',
    label: 'Letras Conceituais (A - F)',
    description: 'Padrão tradicional com conceitos baseados em letras.',
  },
  {
    value: 'NUMERIC_0_10',
    label: 'Numérica Padrão MEC (0 a 10)',
    description: 'Pontuação decimal direta para conformidade com documentação escolar brasileira.',
  },
  {
    value: 'NUMERIC_0_100',
    label: 'Numérica Percentual (0 a 100)',
    description: 'Escala percentual quantitativa de rendimento acadêmico.',
  },
  {
    value: 'NARRATIVE',
    label: 'Avaliação Narrativa e Descritiva',
    description: 'Relatos detalhados do tutor com observações qualitativas de progresso.',
  },
];

const COMMON_TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3) - America/Sao_Paulo' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4) - America/Manaus' },
  { value: 'America/Fortaleza', label: 'Nordeste (GMT-3) - America/Fortaleza' },
  { value: 'America/New_York', label: 'Nova York / Eastern Time (GMT-5) - America/New_York' },
  { value: 'America/Chicago', label: 'Chicago / Central Time (GMT-6) - America/Chicago' },
  { value: 'America/Los_Angeles', label: 'Los Angeles / Pacific Time (GMT-8) - America/Los_Angeles' },
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0) - Europe/Lisbon' },
  { value: 'Europe/London', label: 'Londres (GMT+0) - Europe/London' },
  { value: 'UTC', label: 'Tempo Universal Coordenado (UTC)' },
];

export function FamilyGeneralSettings({
  settings,
  onSave,
  isLoading = false,
}: FamilyGeneralSettingsProps) {
  const [homeschoolName, setHomeschoolName] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [defaultGradingScale, setDefaultGradingScale] = useState<GradingScale>('MASTERY_QUALITATIVE');
  const [language, setLanguage] = useState('pt-BR');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setHomeschoolName(settings.homeschoolName ?? '');
      setTimezone(settings.timezone || 'America/Sao_Paulo');
      setDefaultGradingScale(settings.defaultGradingScale || 'MASTERY_QUALITATIVE');
      setLanguage(settings.language || 'pt-BR');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await onSave({
        homeschoolName: homeschoolName.trim() ? homeschoolName.trim() : null,
        timezone,
        defaultGradingScale,
        language,
      });
      setSuccessMessage('Configurações da família atualizadas com sucesso!');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const authContext = useAuthRole();
  const isEducator = authContext?.isEducator ?? false;
  const isReadOnly = isEducator;

  return (
    <div
      data-testid="family-general-settings-card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Geral da Família & Identidade Pedagógica
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Defina o nome da sua academia familiar, fuso horário para lembretes e a abordagem pedagógica padrão.
        </p>
      </div>

      {isEducator && (
        <div
          data-testid="educator-settings-notice"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-indigo-50)',
            border: '1px solid var(--color-indigo-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-indigo-700)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          ℹ️ <strong>Modo Somente Leitura:</strong> Como Educador, você pode visualizar as configurações da família, mas apenas os Responsáveis podem alterá-las.
        </div>
      )}

      {successMessage && (
        <div
          data-testid="family-settings-success-alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-emerald-50)',
            border: '1px solid var(--color-emerald-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-emerald-700)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AletheiaIcon name="check" size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="family-settings-error-alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-rose-50)',
            border: '1px solid var(--color-rose-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-rose-700)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AletheiaIcon name="alert-circle" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form data-testid="family-settings-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <label
              htmlFor="homeschoolName"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
            >
              Nome da Academia Familiar / Homeschool
            </label>
            <input
              id="homeschoolName"
              data-testid="homeschool-name-input"
              type="text"
              value={homeschoolName}
              onChange={(e) => setHomeschoolName(e.target.value)}
              placeholder="Ex: Academia Familiar Silva"
              disabled={isLoading || isSaving || isReadOnly}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                backgroundColor: isReadOnly ? 'var(--sage-soft)' : 'var(--bg-surface)',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Este nome será exibido nos cabeçalhos de históricos e relatórios acadêmicos oficiais.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label
                htmlFor="timezone"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
              >
                Fuso Horário
              </label>
              <select
                id="timezone"
                data-testid="timezone-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={isLoading || isSaving || isReadOnly}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  backgroundColor: isReadOnly ? 'var(--sage-soft)' : 'var(--bg-surface)',
                  boxSizing: 'border-box',
                }}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="language"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
              >
                Idioma do Sistema
              </label>
              <select
                id="language"
                data-testid="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isLoading || isSaving || isReadOnly}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  backgroundColor: isReadOnly ? 'var(--sage-soft)' : 'var(--bg-surface)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (United States)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="defaultGradingScale"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
            >
              Estrutura Pedagógica & Escala de Avaliação Padrão
            </label>
            <select
              id="defaultGradingScale"
              data-testid="default-grading-scale-select"
              value={defaultGradingScale}
              onChange={(e) => setDefaultGradingScale(e.target.value as GradingScale)}
              disabled={isLoading || isSaving || isReadOnly}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                backgroundColor: isReadOnly ? 'var(--sage-soft)' : 'var(--bg-surface)',
                boxSizing: 'border-box',
              }}
            >
              {GRADING_SCALES.map((scale) => (
                <option key={scale.value} value={scale.value}>
                  {scale.label}
                </option>
              ))}
            </select>
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'var(--sage-soft)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AletheiaIcon name="lightbulb" size={16} style={{ color: 'var(--color-amber-600)', flexShrink: 0 }} />
              <span>{GRADING_SCALES.find((s) => s.value === defaultGradingScale)?.description}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <Can action="edit_family_settings">
              <button
                type="submit"
                data-testid="save-family-settings-btn"
                disabled={isLoading || isSaving}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: isSaving ? 'var(--text-muted)' : 'var(--forest)',
                  color: 'var(--text-inverse)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações Gerais'}
              </button>
            </Can>
          </div>
        </div>
      </form>
    </div>
  );
}
