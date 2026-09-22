'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type { DailyDevotionalResponseDto, UpsertDailyDevotionalDto } from '@aletheia/contracts';

export interface DevotionalFormModalProps {
  isOpen: boolean;
  currentDate: string;
  initialData?: DailyDevotionalResponseDto | null;
  familyId: string | null;
  onClose: () => void;
  onSubmit: (_data: UpsertDailyDevotionalDto) => Promise<void> | void;
}

// Kept in sync with YouVersionService's POPULAR_BIBLE_VERSIONS
// (apps/api/.../youversion.service.ts) -- offering a version that isn't
// in that list 404s upstream and the lookup silently returns no text
// (#214). Almeida (ARA/ARC), Nova Almeida Atualizada, ESV and KJV are
// not available through this app's YouVersion key.
const BIBLE_VERSION_OPTIONS = [
  { value: 'nvi', label: 'NVI (Nova Versão Internacional)' },
  { value: 'blt', label: 'BLT (Bíblia Livre Para Todos)' },
  { value: 'bsb', label: 'BSB (Berean Standard Bible)' },
  { value: 'niv11', label: 'NIV (New International Version)' },
];

export function DevotionalFormModal({
  isOpen,
  currentDate,
  initialData,
  familyId,
  onClose,
  onSubmit,
}: DevotionalFormModalProps) {
  const [date, setDate] = useState(currentDate);
  const [bibleReference, setBibleReference] = useState('');
  const [bibleVersionId, setBibleVersionId] = useState('nvi');
  const [passageText, setPassageText] = useState('');
  const [reflection, setReflection] = useState('');
  const [memoryVerse, setMemoryVerse] = useState('');
  const [hymnOrSong, setHymnOrSong] = useState('');
  const [discussionQuestions, setDiscussionQuestions] = useState('');
  const [practicalApplication, setPracticalApplication] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setBibleReference(initialData.bibleReference || '');
      setBibleVersionId(initialData.bibleVersionId || 'nvi');
      setPassageText(initialData.passageText || '');
      setReflection(initialData.reflection || '');
      setMemoryVerse(initialData.memoryVerse || '');
      setHymnOrSong(initialData.hymnOrSong || '');
      setDiscussionQuestions(initialData.discussionQuestions || '');
      setPracticalApplication(initialData.practicalApplication || '');
    } else {
      setDate(currentDate);
      setBibleReference('');
      setBibleVersionId('nvi');
      setPassageText('');
      setReflection('');
      setMemoryVerse('');
      setHymnOrSong('');
      setDiscussionQuestions('');
      setPracticalApplication('');
    }
    setError(null);
  }, [initialData, currentDate, isOpen]);

  const handleLookupScripture = async () => {
    if (!bibleReference.trim()) {
      setError('Informe uma referência bíblica para buscar (ex: João 3:16 ou Salmos 23).');
      return;
    }
    if (!familyId) {
      setError('Família não autenticada.');
      return;
    }

    try {
      setLookupLoading(true);
      setError(null);
      const url = `/api/v1/families/${encodeURIComponent(familyId)}/devotionals/scripture/lookup?reference=${encodeURIComponent(bibleReference.trim())}&versionId=${encodeURIComponent(bibleVersionId)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Não foi possível obter o texto bíblico. Digite o texto manualmente.');
      }
      const data = await res.json();
      if (data && data.content) {
        setPassageText(data.content);
      } else {
        // The lookup endpoint responds 200 with an empty passage when the
        // upstream provider has no text for this reference/version (#214)
        // -- surface that instead of leaving the field silently blank.
        setError('Não foi encontrado texto para essa referência nessa versão. Tente outra versão ou digite o texto manualmente.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar texto bíblico.';
      setError(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bibleReference.trim() || !date) {
      setError('Data e Referência Bíblica são obrigatórias.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        date,
        bibleReference: bibleReference.trim(),
        bibleVersionId: bibleVersionId.trim() || undefined,
        passageText: passageText.trim() || undefined,
        reflection: reflection.trim() || undefined,
        memoryVerse: memoryVerse.trim() || undefined,
        hymnOrSong: hymnOrSong.trim() || undefined,
        discussionQuestions: discussionQuestions.trim() || undefined,
        practicalApplication: practicalApplication.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar devocional.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div data-testid="devotional-form-modal">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? 'Editar Devocional' : 'Novo Devocional Diário'}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" form="devotional-form" data-testid="devotional-submit-btn" isLoading={loading}>
              {initialData ? 'Salvar Alterações' : 'Criar Devocional'}
            </Button>
          </>
        }
      >
        {error && (
          <Alert variant="error" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}

        <form id="devotional-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Data *"
              type="date"
              data-testid="devotional-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Versão Bíblica"
              data-testid="devotional-version-select"
              value={bibleVersionId}
              onChange={(e) => setBibleVersionId(e.target.value)}
              options={BIBLE_VERSION_OPTIONS}
            />
          </div>

          <div className="ui-form-group">
            <label htmlFor="devotional-reference" className="ui-form-label">
              Referência Bíblica *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                id="devotional-reference"
                data-testid="devotional-reference-input"
                value={bibleReference}
                onChange={(e) => setBibleReference(e.target.value)}
                placeholder="Ex: Salmos 23:1-6, João 3:16..."
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="secondary"
                data-testid="scripture-lookup-btn"
                onClick={handleLookupScripture}
                isLoading={lookupLoading}
                style={{ whiteSpace: 'nowrap' }}
              >
                Buscar Texto YouVersion
              </Button>
            </div>
          </div>

          <Textarea
            label="Texto da Passagem"
            rows={4}
            data-testid="devotional-passage-input"
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Cole ou busque o texto bíblico da leitura..."
          />

          <Textarea
            label="Reflexão / Comentário Familiar"
            rows={3}
            data-testid="devotional-reflection-input"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Reflexão principal, contexto e lições para a família..."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Versículo para Memorização"
              data-testid="devotional-memory-input"
              value={memoryVerse}
              onChange={(e) => setMemoryVerse(e.target.value)}
              placeholder="Ex: Guardei no coração a tua palavra..."
            />
            <Input
              label="Hino / Cântico"
              data-testid="devotional-hymn-input"
              value={hymnOrSong}
              onChange={(e) => setHymnOrSong(e.target.value)}
              placeholder="Ex: Castelo Forte, Maravilhosa Graça..."
            />
          </div>

          <Textarea
            label="Perguntas para Diálogo / Catequese"
            rows={2}
            data-testid="devotional-questions-input"
            value={discussionQuestions}
            onChange={(e) => setDiscussionQuestions(e.target.value)}
            placeholder={'1. O que este texto nos ensina sobre Deus?\n2. Como podemos praticar isso hoje?'}
          />

          <Textarea
            label="Aplicação Prática"
            rows={2}
            data-testid="devotional-application-input"
            value={practicalApplication}
            onChange={(e) => setPracticalApplication(e.target.value)}
            placeholder="Ações concretas, atitudes de amor e serviço para hoje..."
          />
        </form>
      </Modal>
    </div>
  );
}
