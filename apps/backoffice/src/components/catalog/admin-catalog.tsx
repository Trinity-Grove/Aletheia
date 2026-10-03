'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createBibleTranslationDefinitionSchema,
  createCompetencyDefinitionSchema,
  createConsentDefinitionSchema,
  createCurriculumPackSchema,
  createEvidenceTypeDefinitionSchema,
  createJurisdictionDefinitionSchema,
  createLearningDomainSchema,
  createPedagogicalModelDefinitionSchema,
  createRubricDefinitionSchema,
  createTheologicalTraditionDefinitionSchema,
  type BibleTranslationDefinitionResponseDto,
  type CompetencyDefinitionResponseDto,
  type ConsentDefinitionResponseDto,
  type CurriculumPackResponseDto,
  type EvidenceTypeDefinitionResponseDto,
  type JurisdictionDefinitionResponseDto,
  type LearningDomainResponseDto,
  type PedagogicalModelDefinitionResponseDto,
  type RubricDefinitionResponseDto,
  type TheologicalTraditionDefinitionResponseDto,
  type PackLicenseCode,
  type PackProvenance,
} from '@aletheia/contracts';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Select, Textarea } from '@aletheia/ui';
import { api } from '../../lib/api';
import { VersionOperationsPanel } from './version-operations-panel';

const resources = [
  { value: 'learning-domains', label: 'Domínios de aprendizagem' },
  { value: 'competency-definitions', label: 'Competências' },
  { value: 'pedagogical-model-definitions', label: 'Modelos pedagógicos' },
  { value: 'rubric-definitions', label: 'Rubricas de avaliação' },
  { value: 'evidence-type-definitions', label: 'Tipos de evidência' },
  { value: 'theological-tradition-definitions', label: 'Tradições teológicas' },
  { value: 'bible-translation-definitions', label: 'Traduções bíblicas' },
  { value: 'consent-definitions', label: 'Termos de consentimento / Privacidade' },
  { value: 'jurisdiction-definitions', label: 'Jurisdições legais' },
  { value: 'curriculum-packs', label: 'Pacotes curriculares' },
] as const;

type Resource = (typeof resources)[number]['value'];
type CatalogRow =
  | LearningDomainResponseDto
  | CompetencyDefinitionResponseDto
  | PedagogicalModelDefinitionResponseDto
  | RubricDefinitionResponseDto
  | EvidenceTypeDefinitionResponseDto
  | TheologicalTraditionDefinitionResponseDto
  | BibleTranslationDefinitionResponseDto
  | ConsentDefinitionResponseDto
  | JurisdictionDefinitionResponseDto
  | CurriculumPackResponseDto;

const basePath = '/admin/curriculum-definitions';

function getResourcePath(resource: Resource): string {
  if (resource === 'curriculum-packs') {
    return '/admin/curriculum-packs';
  }
  if (resource === 'consent-definitions') {
    return '/admin/consent-definitions';
  }
  if (resource === 'jurisdiction-definitions') {
    return '/admin/jurisdiction-definitions';
  }
  return `${basePath}/${resource}`;
}

export function AdminCatalog() {
  const [activeTab, setActiveTab] = useState<'catalogs' | 'version-operations'>('catalogs');
  const [resource, setResource] = useState<Resource>('learning-domains');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Catálogo administrativo</h1>
        <p style={{ color: 'var(--text-secondary, #64748b)', margin: '0.25rem 0 0 0' }}>
          Gerenciamento central de catálogos curriculares, termos legais e auditoria de versões.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Abas do painel administrativo"
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          paddingBottom: '0.5rem',
        }}
      >
        <Button
          variant={activeTab === 'catalogs' ? 'primary' : 'ghost'}
          role="tab"
          aria-selected={activeTab === 'catalogs'}
          data-testid="tab-platform-catalogs"
          onClick={() => setActiveTab('catalogs')}
        >
          Catálogos da Plataforma
        </Button>
        <Button
          variant={activeTab === 'version-operations' ? 'primary' : 'ghost'}
          role="tab"
          aria-selected={activeTab === 'version-operations'}
          data-testid="tab-version-operations"
          onClick={() => setActiveTab('version-operations')}
        >
          Operações de Versão & Auditoria
        </Button>
      </div>

      {activeTab === 'catalogs' ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <Select
            label="Recurso"
            value={resource}
            onChange={(event) => setResource(event.target.value as Resource)}
            options={resources.map((item) => ({ ...item }))}
          />
          {/* Each resource owns its form and requests, so late responses cannot replace another list. */}
          <CatalogResource key={resource} resource={resource} />
        </div>
      ) : (
        <VersionOperationsPanel />
      )}
    </div>
  );
}

const LICENSE_LABELS: Record<string, string> = {
  CC_BY_4_0: 'CC-BY 4.0',
  CC_BY_NC_4_0: 'CC-BY-NC 4.0',
  CC_BY_SA_4_0: 'CC-BY-SA 4.0',
  PUBLIC_DOMAIN: 'Domínio Público',
  ALETHEIA_OPEN_COMMUNITY: 'Comunidade Aberta',
  ALETHEIA_EDITORIAL_STANDARD: 'Padrão Editorial',
};

function CurriculumPackAuditInfo({ pack }: { pack: CatalogRow }) {
  const meta = (
    'metadata' in pack && pack.metadata && typeof pack.metadata === 'object'
      ? (pack.metadata as Record<string, unknown>)
      : {}
  );
  const prov: (PackProvenance & Record<string, unknown>) | null = (
    meta.provenance && typeof meta.provenance === 'object'
      ? (meta.provenance as (PackProvenance & Record<string, unknown>))
      : 'provenance' in pack &&
          (pack as Record<string, unknown>).provenance &&
          typeof (pack as Record<string, unknown>).provenance === 'object'
        ? ((pack as Record<string, unknown>).provenance as (PackProvenance & Record<string, unknown>))
        : null
  );

  const license = (
    (typeof meta.license === 'string' ? meta.license : undefined) ??
    (prov && typeof prov.license === 'string' ? prov.license : undefined) ??
    ('license' in pack && typeof (pack as Record<string, unknown>).license === 'string'
      ? ((pack as Record<string, unknown>).license as string)
      : undefined)
  ) as PackLicenseCode | string | undefined;

  const authorDisplayName = (
    (typeof meta.authorDisplayName === 'string' ? meta.authorDisplayName : undefined) ??
    (prov && typeof prov.authorDisplayName === 'string' ? prov.authorDisplayName : undefined) ??
    ('authorDisplayName' in pack && typeof (pack as Record<string, unknown>).authorDisplayName === 'string'
      ? ((pack as Record<string, unknown>).authorDisplayName as string)
      : undefined)
  );

  const authorOrganization = (
    (typeof meta.authorOrganization === 'string' ? meta.authorOrganization : undefined) ??
    (typeof meta.organization === 'string' ? meta.organization : undefined) ??
    (prov && typeof prov.authorOrganization === 'string' ? prov.authorOrganization : undefined) ??
    (prov && typeof prov.organization === 'string' ? prov.organization : undefined) ??
    ('authorOrganization' in pack && typeof (pack as Record<string, unknown>).authorOrganization === 'string'
      ? ((pack as Record<string, unknown>).authorOrganization as string)
      : undefined)
  );

  const checksumSha256 = (
    (typeof meta.checksumSha256 === 'string' ? meta.checksumSha256 : undefined) ??
    (prov && typeof prov.checksumSha256 === 'string' ? prov.checksumSha256 : undefined) ??
    ('checksumSha256' in pack && typeof (pack as Record<string, unknown>).checksumSha256 === 'string'
      ? ((pack as Record<string, unknown>).checksumSha256 as string)
      : undefined)
  );

  if (!license && !authorDisplayName && !checksumSha256) {
    return null;
  }

  const displayLicense = license ? (LICENSE_LABELS[license] ?? license) : null;
  const truncatedHash = checksumSha256
    ? checksumSha256.length > 12
      ? `${checksumSha256.slice(0, 12)}...`
      : checksumSha256
    : null;

  return (
    <div
      data-testid="pack-audit-info"
      style={{
        display: 'grid',
        gap: '0.375rem',
        padding: '0.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.375rem',
        border: '1px solid #e2e8f0',
        fontSize: '0.75rem',
      }}
    >
      {displayLicense && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#475569' }}>Licença:</span>
          <Badge variant="indigo" size="sm" data-testid="pack-license-badge" data-license={license}>
            {displayLicense}
          </Badge>
        </div>
      )}
      {(authorDisplayName || authorOrganization) && (
        <div data-testid="pack-author-provenance" style={{ color: '#334155' }}>
          <span style={{ fontWeight: 600, color: '#475569' }}>Autor: </span>
          <span>{authorDisplayName ?? 'Desconhecido'}</span>
          {authorOrganization && <span style={{ color: '#64748b' }}> ({authorOrganization})</span>}
        </div>
      )}
      {truncatedHash && (
        <div data-testid="pack-integrity-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontWeight: 600, color: '#475569' }}>Integridade: </span>
          <code
            data-testid="pack-integrity-hash"
            title={checksumSha256}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.6875rem',
              backgroundColor: '#e2e8f0',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
            }}
          >
            SHA-256: {truncatedHash}
          </code>
        </div>
      )}
    </div>
  );
}

function CatalogResource({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [domains, setDomains] = useState<LearningDomainResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const mutationPending = useRef(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1');
  const [domainId, setDomainId] = useState('');
  const isCompetency = resource === 'competency-definitions';
  const path = getResourcePath(resource);

  let codeMaxLength = 100;
  let codeHelper = 'Use letras maiúsculas, números, pontos e sublinhados. Exemplo: MUSIC.BASS';
  if (resource === 'jurisdiction-definitions') {
    codeMaxLength = 10;
    codeHelper = 'Código ISO do país ou subdivisão. Exemplo: BR ou BR-SP';
  } else if (resource === 'consent-definitions') {
    codeMaxLength = 64;
    codeHelper = 'Letras maiúsculas, números e sublinhados. Exemplo: LGPD_TERMS_2026';
  } else if (resource === 'bible-translation-definitions') {
    codeMaxLength = 50;
    codeHelper = 'Código da tradução. Exemplo: NVI ou ARC';
  } else if (
    isCompetency ||
    resource === 'rubric-definitions' ||
    resource === 'theological-tradition-definitions' ||
    resource === 'curriculum-packs'
  ) {
    codeMaxLength = 150;
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get<CatalogRow[]>(path),
      isCompetency ? api.get<LearningDomainResponseDto[]>(`${basePath}/learning-domains`) : Promise.resolve([]),
    ])
      .then(([definitions, learningDomains]) => {
        if (cancelled) return;
        setRows(definitions);
        setDomains(learningDomains);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o catálogo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, isCompetency, attempt]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (mutationPending.current) return;
    setError(null);
    setNotice(null);
    const common = { code: code.trim(), version: Number(version), status: 'DRAFT' as const };

    let parsed:
      | { success: true; data: unknown }
      | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };

    if (resource === 'competency-definitions') {
      parsed = createCompetencyDefinitionSchema.safeParse({ ...common, title: name.trim(), domainId });
    } else if (resource === 'learning-domains') {
      parsed = createLearningDomainSchema.safeParse({ ...common, name: name.trim(), description: description.trim() });
    } else if (resource === 'pedagogical-model-definitions') {
      parsed = createPedagogicalModelDefinitionSchema.safeParse({
        ...common,
        name: name.trim(),
        description: description.trim(),
      });
    } else if (resource === 'rubric-definitions') {
      parsed = createRubricDefinitionSchema.safeParse({
        ...common,
        name: name.trim(),
        description: description.trim(),
      });
    } else if (resource === 'evidence-type-definitions') {
      parsed = createEvidenceTypeDefinitionSchema.safeParse({
        ...common,
        name: name.trim(),
        description: description.trim(),
      });
    } else if (resource === 'theological-tradition-definitions') {
      parsed = createTheologicalTraditionDefinitionSchema.safeParse({
        ...common,
        name: name.trim(),
        description: description.trim(),
      });
    } else if (resource === 'bible-translation-definitions') {
      parsed = createBibleTranslationDefinitionSchema.safeParse({
        ...common,
        name: name.trim(),
        language: 'pt',
        youVersionId: code.trim(),
      });
    } else if (resource === 'consent-definitions') {
      parsed = createConsentDefinitionSchema.safeParse({
        code: code.trim(),
        version: Number(version),
        title: name.trim(),
        description: description.trim() || undefined,
        content:
          description.trim().length >= 10
            ? description.trim()
            : 'Termos de consentimento e conformidade da plataforma Aletheia.',
        purposes: ['AUDIT_COMPLIANCE'],
      });
    } else if (resource === 'curriculum-packs') {
      parsed = createCurriculumPackSchema.safeParse({
        ...common,
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else {
      parsed = createJurisdictionDefinitionSchema.safeParse({
        ...common,
        name: name.trim(),
        description: description.trim(),
      });
    }

    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`).join('; '));
      return;
    }
    mutationPending.current = true;
    setBusy(true);
    try {
      const created = await api.post<CatalogRow>(path, parsed.data);
      setRows((current) => [created, ...current]);
      setCode('');
      setName('');
      setDescription('');
      setVersion('1');
      setDomainId('');
      setNotice('Rascunho criado.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o rascunho.');
    } finally {
      mutationPending.current = false;
      setBusy(false);
    }
  }

  async function publish(id: string) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const published = await api.patch<CatalogRow>(`${path}/${id}/status`, { status: 'PUBLISHED' });
      setRows((current) => current.map((row) => (row.id === id ? published : row)));
      setNotice('Definição publicada.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível publicar a definição.');
    } finally {
      mutationPending.current = false;
      setBusy(false);
    }
  }

  const normalizedQuery = filterQuery.trim().toLowerCase();
  const filteredRows = normalizedQuery
    ? rows.filter((row) => {
        const code = row.code.toLowerCase();
        const text = (
          'title' in row && row.title
            ? row.title
            : 'name' in row && row.name
              ? row.name
              : ''
        ).toLowerCase();
        return code.includes(normalizedQuery) || text.includes(normalizedQuery);
      })
    : rows;

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <h2>{resources.find((item) => item.value === resource)?.label}</h2>
      {loading ? (
        <p role="status">Carregando catálogo...</p>
      ) : loadError ? (
        <div>
          <p role="alert">{loadError}</p>
          <Button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          <Card>
            <CardHeader>
              <CardTitle as="h3">Nova definição</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={create}>
                <fieldset
                  disabled={busy}
                  style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '1rem', minWidth: 0 }}
                >
                  <Input
                    label="Código"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                    maxLength={codeMaxLength}
                    helperText={codeHelper}
                  />
                  <Input
                    label="Nome"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={isCompetency ? 250 : 150}
                  />
                  <Input
                    label="Versão"
                    type="number"
                    min={1}
                    step={1}
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                    required
                  />
                  {isCompetency ? (
                    <Select
                      label="Domínio de aprendizagem"
                      required
                      value={domainId}
                      onChange={(event) => setDomainId(event.target.value)}
                      options={[
                        { value: '', label: 'Selecione um domínio' },
                        ...domains.map((domain) => ({
                          value: domain.id,
                          label: `${domain.name} (${domain.code}, v${domain.version}, ${domain.status})`,
                        })),
                      ]}
                    />
                  ) : (
                    <Textarea
                      label="Descrição"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={2000}
                    />
                  )}
                  {isCompetency && domains.length === 0 && (
                    <p>Crie um domínio de aprendizagem antes de cadastrar competências.</p>
                  )}
                  <Button type="submit" isLoading={busy} disabled={busy || (isCompetency && domains.length === 0)}>
                    Criar rascunho
                  </Button>
                </fieldset>
              </form>
            </CardContent>
          </Card>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Input
              data-testid="catalog-filter-input"
              placeholder="Filtrar por código ou nome..."
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
            />
            {rows.length === 0 ? (
              <EmptyState
                title="Nenhuma definição cadastrada"
                description="Use o formulário para criar o primeiro rascunho."
              />
            ) : filteredRows.length === 0 ? (
              <EmptyState
                title="Nenhuma definição encontrada"
                description="Tente ajustar os termos da busca."
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                }}
              >
                {filteredRows.map((row) => (
                  <Card key={row.id}>
                    <CardHeader>
                      <CardTitle as="h3">{'title' in row ? row.title : row.name}</CardTitle>
                    </CardHeader>
                    <CardContent style={{ display: 'grid', gap: '0.75rem', overflowWrap: 'anywhere' }}>
                      <code>{row.code}</code>
                      <span>Versão {row.version}</span>
                      <span>{row.status}</span>
                      {'description' in row && row.description && <p>{row.description}</p>}
                      {'metadata' in row &&
                        row.metadata &&
                        typeof (row.metadata as Record<string, unknown>).summary === 'string' && (
                          <p>{(row.metadata as Record<string, unknown>).summary as string}</p>
                        )}
                      {'summary' in row &&
                        typeof (row as { summary?: unknown }).summary === 'string' &&
                        Boolean((row as { summary?: string }).summary) && (
                          <p>{(row as { summary: string }).summary}</p>
                        )}
                      {resource === 'curriculum-packs' && <CurriculumPackAuditInfo pack={row} />}
                      {row.status === 'DRAFT' && (
                        <Button
                          variant="secondary"
                          aria-label={`Publicar ${row.code}`}
                          disabled={busy}
                          onClick={() => publish(row.id)}
                        >
                          Publicar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
