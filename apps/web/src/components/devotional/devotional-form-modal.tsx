'use client';

import React, { useEffect, useState } from 'react';
import type { DailyDevotionalResponseDto, UpsertDailyDevotionalDto } from '@aletheia/contracts';

export interface DevotionalFormModalProps {
  isOpen: boolean;
  currentDate: string;
  initialData?: DailyDevotionalResponseDto | null;
  familyId?: string;
  onClose: () => void;
  onSubmit: (_data: UpsertDailyDevotionalDto) => Promise<void> | void;
}

export function DevotionalFormModal({
  isOpen,
  currentDate,
  initialData,
  familyId = 'family-current',
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

  if (!isOpen) return null;

  const handleLookupScripture = async () => {
    if (!bibleReference.trim()) {
      setError('Informe uma referência bíblica para buscar (ex: João 3:16 ou Salmos 23).');
      return;
    }

    try {
      setLookupLoading(true);
      setError(null);
      const url = `/api/v1/families/${encodeURIComponent(familyId)}/devotionals/scripture/lookup?reference=${encodeURIComponent(bibleReference.trim())}&versionId=${encodeURIComponent(bibleVersionId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Não foi possível obter o texto bíblico. Digite o texto manualmente.');
      }
      const data = await res.json();
      if (data && data.content) {
        setPassageText(data.content);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="devotional-form-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {initialData ? 'Editar Devocional' : 'Novo Devocional Diário'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="devotional-date">Data *</label>
              <input
                id="devotional-date"
                type="date"
                data-testid="devotional-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="devotional-version">Versão Bíblica</label>
              <select
                id="devotional-version"
                data-testid="devotional-version-select"
                value={bibleVersionId}
                onChange={(e) => setBibleVersionId(e.target.value)}
              >
                <option value="nvi">NVI (Nova Versão Internacional)</option>
                <option value="ara">ARA (Almeida Revista e Atualizada)</option>
                <option value="arc">ARC (Almeida Revista e Corrigida)</option>
                <option value="naa">NAA (Nova Almeida Atualizada)</option>
                <option value="kjv">KJV (King James Version)</option>
                <option value="esv">ESV (English Standard Version)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="devotional-reference">Referência Bíblica *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="devotional-reference"
                type="text"
                data-testid="devotional-reference-input"
                value={bibleReference}
                onChange={(e) => setBibleReference(e.target.value)}
                placeholder="Ex: Salmos 23:1-6, João 3:16..."
                style={{ flex: 1 }}
                required
              />
              <button
                type="button"
                data-testid="scripture-lookup-btn"
                onClick={handleLookupScripture}
                disabled={lookupLoading}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}
              >
                {lookupLoading ? 'Buscando...' : 'Buscar Texto YouVersion'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="devotional-passage">Texto da Passagem</label>
            <textarea
              id="devotional-passage"
              rows={4}
              data-testid="devotional-passage-input"
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
              placeholder="Cole ou busque o texto bíblico da leitura..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="devotional-reflection">Reflexão / Comentário Familiar</label>
            <textarea
              id="devotional-reflection"
              rows={3}
              data-testid="devotional-reflection-input"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Reflexão principal, contexto e lições para a família..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="devotional-memory">Versículo para Memorização</label>
              <input
                id="devotional-memory"
                type="text"
                data-testid="devotional-memory-input"
                value={memoryVerse}
                onChange={(e) => setMemoryVerse(e.target.value)}
                placeholder="Ex: Guardei no coração a tua palavra..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="devotional-hymn">Hino / Cântico</label>
              <input
                id="devotional-hymn"
                type="text"
                data-testid="devotional-hymn-input"
                value={hymnOrSong}
                onChange={(e) => setHymnOrSong(e.target.value)}
                placeholder="Ex: Castelo Forte, Maravilhosa Graça..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="devotional-questions">Perguntas para Diálogo / Catequese</label>
            <textarea
              id="devotional-questions"
              rows={2}
              data-testid="devotional-questions-input"
              value={discussionQuestions}
              onChange={(e) => setDiscussionQuestions(e.target.value)}
              placeholder="1. O que este texto nos ensina sobre Deus?&#10;2. Como podemos praticar isso hoje?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="devotional-application">Aplicação Prática</label>
            <textarea
              id="devotional-application"
              rows={2}
              data-testid="devotional-application-input"
              value={practicalApplication}
              onChange={(e) => setPracticalApplication(e.target.value)}
              placeholder="Ações concretas, atitudes de amor e serviço para hoje..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="devotional-submit-btn"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Devocional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
