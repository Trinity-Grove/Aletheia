'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Input } from '@aletheia/ui';
import type {
  CurriculumCompositionCatalogItem,
  CurriculumCompositionItem,
  CurriculumPackCompositionResponseDto,
  CurriculumPackCompositionRevisionResponseDto,
} from '@aletheia/contracts';
import { getApiAuthToken } from '../../lib/api';
import { useLocale } from '../../lib/i18n/locale-context';

interface CommunityPackCompositionEditorProps {
  packId: string;
}

type CompositionRef = Omit<CurriculumCompositionItem, 'position'>;

function toRef(item: CurriculumCompositionItem): CompositionRef {
  return { definitionType: item.definitionType, code: item.code, version: item.version };
}

function refKey(item: CompositionRef): string {
  return `${item.definitionType}|${item.code}|${item.version}`;
}

function itemTestKey(item: CompositionRef): string {
  return refKey(item).replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function CommunityPackCompositionEditor({ packId }: CommunityPackCompositionEditorProps) {
  const { t, formatDate } = useLocale();
  const [catalog, setCatalog] = useState<CurriculumCompositionCatalogItem[]>([]);
  const [items, setItems] = useState<CurriculumCompositionItem[]>([]);
  const [savedItems, setSavedItems] = useState<CurriculumCompositionItem[]>([]);
  const [history, setHistory] = useState<CurriculumPackCompositionRevisionResponseDto[]>([]);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [definitionType, setDefinitionType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);

  const authHeaders = useMemo<HeadersInit>(() => {
    const token = getApiAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadState = async () => {
    setLoading(true);
    setError(null);
    setConflict(false);
    try {
      const [catalogResponse, compositionResponse, historyResponse] = await Promise.all([
        fetch('/api/v1/curriculum-packs/composition-catalog?limit=100', {
          credentials: 'include',
          headers: authHeaders,
        }),
        fetch(`/api/v1/curriculum-packs/${packId}/composition`, {
          credentials: 'include',
          headers: authHeaders,
        }),
        fetch(`/api/v1/curriculum-packs/${packId}/composition/revisions`, {
          credentials: 'include',
          headers: authHeaders,
        }),
      ]);
      if (!catalogResponse.ok || !compositionResponse.ok) throw new Error('composition load failed');
      const composition: CurriculumPackCompositionResponseDto = await compositionResponse.json();
      setCatalog(await catalogResponse.json());
      setItems(composition.items);
      setSavedItems(composition.items);
      setRevision(composition.revision);
      setHistory(historyResponse.ok ? await historyResponse.json() : []);
    } catch {
      setError(t('curriculum.community.composition.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, [packId]);

  const selectedKeys = useMemo(() => new Set(items.map(toRef).map(refKey)), [items]);
  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return catalog.filter((item) => {
      if (definitionType && item.definitionType !== definitionType) return false;
      if (!normalizedQuery) return true;
      return `${item.code} ${item.label} ${item.description ?? ''}`.toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [catalog, definitionType, query]);
  const isDirty = JSON.stringify(items.map(toRef)) !== JSON.stringify(savedItems.map(toRef));

  const addItem = (item: CurriculumCompositionCatalogItem) => {
    const ref = { definitionType: item.definitionType, code: item.code, version: item.version } as CompositionRef;
    if (selectedKeys.has(refKey(ref))) return;
    setItems((current) => [...current, { ...ref, position: current.length }]);
    setSaved(false);
    setSaveError(null);
  };

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => refKey(toRef(item)) !== key).map((item, position) => ({ ...item, position })));
    setSaved(false);
    setSaveError(null);
  };

  const moveItem = (index: number, offset: -1 | 1) => {
    setItems((current) => {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
      return next.map((item, position) => ({ ...item, position }));
    });
    setSaved(false);
    setSaveError(null);
  };

  const saveComposition = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    setConflict(false);
    try {
      const response = await fetch(`/api/v1/curriculum-packs/${packId}/composition`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          expectedRevision: revision,
          items: items.map(toRef),
        }),
      });
      if (response.status === 409) {
        setConflict(true);
        return;
      }
      if (!response.ok) throw new Error('composition save failed');
      const result: CurriculumPackCompositionResponseDto = await response.json();
      setItems(result.items);
      setSavedItems(result.items);
      setRevision(result.revision);
      setSaved(true);
      const historyResponse = await fetch(`/api/v1/curriculum-packs/${packId}/composition/revisions`, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (historyResponse.ok) setHistory(await historyResponse.json());
    } catch {
      setSaveError(t('curriculum.community.composition.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div data-testid="community-pack-composition-loading">{t('curriculum.community.composition.loading')}</div>;
  if (error) {
    return (
      <Alert variant="error" data-testid="community-pack-composition-error">
        {error}
        <Button variant="secondary" size="sm" onClick={() => void loadState()} style={{ marginLeft: '0.5rem' }}>
          {t('curriculum.community.composition.reload')}
        </Button>
      </Alert>
    );
  }

  return (
    <section data-testid="community-pack-composition-editor" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <h3 style={{ margin: 0, color: 'var(--forest)', fontSize: '1rem' }}>{t('curriculum.community.composition.title')}</h3>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          {t('curriculum.community.composition.description')}
        </p>
      </div>

      {isDirty && <Alert variant="warning" data-testid="composition-unsaved-indicator">{t('curriculum.community.composition.unsaved')}</Alert>}
      {saved && <Alert variant="success" data-testid="composition-saved-alert">{t('curriculum.community.composition.saved')}</Alert>}
      {saveError && <Alert variant="error" data-testid="composition-save-error">{saveError}</Alert>}
      {conflict && (
        <Alert variant="error" data-testid="composition-conflict-alert">
          {t('curriculum.community.composition.conflict')}
          <Button variant="secondary" size="sm" onClick={() => void loadState()} style={{ marginLeft: '0.5rem' }}>
            {t('curriculum.community.composition.reload')}
          </Button>
        </Alert>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 14rem' }}>
          <Input
            label={t('curriculum.community.composition.searchLabel')}
            placeholder={t('curriculum.community.composition.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            data-testid="composition-catalog-search"
          />
        </div>
        <label style={{ flex: '1 1 12rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--forest)', fontSize: '0.8125rem', fontWeight: 600 }}>
          {t('curriculum.community.composition.typeLabel')}
          <select value={definitionType} onChange={(event) => setDefinitionType(event.target.value)} data-testid="composition-catalog-type">
            <option value="">{t('curriculum.community.composition.allTypes')}</option>
            {Array.from(new Set(catalog.map((item) => item.definitionType))).map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '0.75rem' }}>
        <Card style={{ padding: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--forest)' }}>{t('curriculum.community.composition.catalogTitle')}</h4>
          <div data-testid="composition-catalog-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '18rem', overflowY: 'auto' }}>
            {filteredCatalog.length === 0 ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{t('curriculum.community.composition.emptyCatalog')}</div> : filteredCatalog.map((item) => {
              const key = itemTestKey(item);
              return (
                <div key={key} data-testid={`composition-catalog-item-${key}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{item.label}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{item.definitionType} · {item.code} v{item.version}</div>
                  </div>
                  <Button variant="secondary" size="sm" disabled={selectedKeys.has(refKey(item))} onClick={() => addItem(item)} data-testid={`add-composition-item-${key}`}>
                    {t('curriculum.community.composition.add')}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--forest)' }}>{t('curriculum.community.composition.selectedTitle', { count: items.length })}</h4>
          <div data-testid="composition-selected-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '18rem', overflowY: 'auto' }}>
            {items.length === 0 ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{t('curriculum.community.composition.emptyComposition')}</div> : items.map((item, index) => {
              const key = itemTestKey(item);
              return (
                <div key={key} data-testid={`composition-selected-item-${key}`} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', minWidth: '1.25rem' }}>{index + 1}.</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: 600 }}>{item.code}</span>
                  <Button variant="secondary" size="sm" aria-label={t('curriculum.community.composition.moveUp')} disabled={index === 0} onClick={() => moveItem(index, -1)} data-testid={`move-composition-item-up-${key}`}>↑</Button>
                  <Button variant="secondary" size="sm" aria-label={t('curriculum.community.composition.moveDown')} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} data-testid={`move-composition-item-down-${key}`}>↓</Button>
                  <Button variant="secondary" size="sm" onClick={() => removeItem(refKey(item))} data-testid={`remove-composition-item-${key}`}>{t('curriculum.community.composition.remove')}</Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card data-testid="composition-preview" style={{ padding: '0.75rem', backgroundColor: 'var(--sage-soft)' }}>
        <h4 style={{ margin: '0 0 0.5rem', color: 'var(--forest)' }}>{t('curriculum.community.composition.previewTitle')}</h4>
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {items.map((item) => <li key={refKey(item)} style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>{item.code} <Badge variant="slate" size="sm">{item.definitionType}</Badge></li>)}
        </ol>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" data-testid="save-composition-btn" onClick={() => void saveComposition()} disabled={!isDirty || saving} isLoading={saving}>
          {saving ? t('curriculum.community.composition.saving') : t('curriculum.community.composition.save')}
        </Button>
      </div>

      <div data-testid="composition-history" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <strong style={{ color: 'var(--forest)', fontSize: '0.8125rem' }}>{t('curriculum.community.composition.historyTitle')}</strong>
        {history.map((entry) => <span key={entry.id} style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{t('curriculum.community.composition.revision', { revision: entry.revision, count: entry.items.length, date: formatDate(entry.createdAt) })}</span>)}
      </div>
    </section>
  );
}
