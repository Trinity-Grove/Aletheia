'use client';

import React, { useState, useEffect } from 'react';
import { AletheiaIcon, Alert, Button, Card, Input, Select } from '@aletheia/ui';
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

  const languageOptions = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (United States)' },
    { value: 'es-ES', label: 'Español' },
  ];

  return (
    <Card data-testid="family-general-settings-card" style={{ padding: '1.75rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Geral da Família & Identidade Pedagógica
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Defina o nome da sua academia familiar, fuso horário para lembretes e a abordagem pedagógica padrão.
        </p>
      </div>

      {isEducator && (
        <Alert variant="info" data-testid="educator-settings-notice" style={{ marginBottom: '1.25rem' }}>
          <strong>Modo Somente Leitura:</strong> Como Educador, você pode visualizar as configurações da família, mas apenas os Responsáveis podem alterá-las.
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" data-testid="family-settings-success-alert" style={{ marginBottom: '1.25rem' }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" data-testid="family-settings-error-alert" style={{ marginBottom: '1.25rem' }}>
          {errorMessage}
        </Alert>
      )}

      <form data-testid="family-settings-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <Input
            label="Nome da Academia Familiar / Homeschool"
            data-testid="homeschool-name-input"
            value={homeschoolName}
            onChange={(e) => setHomeschoolName(e.target.value)}
            placeholder="Ex: Academia Familiar Silva"
            disabled={isLoading || isSaving || isReadOnly}
            helperText="Este nome será exibido nos cabeçalhos de históricos e relatórios acadêmicos oficiais."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <Select
              label="Fuso Horário"
              data-testid="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading || isSaving || isReadOnly}
              options={COMMON_TIMEZONES}
            />

            <Select
              label="Idioma do Sistema"
              data-testid="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading || isSaving || isReadOnly}
              options={languageOptions}
            />
          </div>

          <div>
            <Select
              label="Estrutura Pedagógica & Escala de Avaliação Padrão"
              data-testid="default-grading-scale-select"
              value={defaultGradingScale}
              onChange={(e) => setDefaultGradingScale(e.target.value as GradingScale)}
              disabled={isLoading || isSaving || isReadOnly}
              options={GRADING_SCALES.map(({ value, label }) => ({ value, label }))}
            />
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
              <Button type="submit" data-testid="save-family-settings-btn" isLoading={isSaving} disabled={isLoading}>
                Salvar Configurações Gerais
              </Button>
            </Can>
          </div>
        </div>
      </form>
    </Card>
  );
}
