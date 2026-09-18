'use client';

import React from 'react';
import Link from 'next/link';
import { ProductShell } from '../../../../src/components/product-shell';
import { BibleTranslationCompareView } from '../../../../src/components/devotional/bible-translation-compare-view';

export default function BibleTranslationComparePage() {
  return (
    <ProductShell currentPath="/devotional">
      <div
        className="bible-compare-page-container"
        style={{
          padding: '2rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            href="/devotional"
            data-testid="back-to-devotional-link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: 'var(--forest)',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            &larr; Voltar ao Culto Doméstico & Devocional
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gold-dark)',
            }}
          >
            Escrituras Sagradas • Trinity Grove
          </span>
          <h1
            style={{
              margin: '0.25rem 0 0.25rem 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--forest)',
            }}
          >
            Comparador de Traduções Bíblicas
          </h1>
          <p
            style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: 1.5,
            }}
          >
            Examine e compare a Palavra de Deus lado a lado em diversas traduções clássicas e contemporâneas para enriquecer o estudo e o culto familiar.
          </p>
        </div>

        {/* Interactive Comparison View */}
        <BibleTranslationCompareView />
      </div>
    </ProductShell>
  );
}
