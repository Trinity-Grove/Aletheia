import React from 'react';
import { ProductShell } from '../src/components/product-shell';

export default function HomePage() {
  return (
    <ProductShell currentPath="/">
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Welcome Banner */}
        <div
          style={{
            backgroundColor: 'var(--forest, #123f34)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 10px)',
            padding: '2.5rem 2rem',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '700px' }}>
            <p className="eyebrow" style={{ color: 'var(--gold-soft, #f3e5b6)', marginBottom: '0.75rem' }}>
              <span className="rule" style={{ background: 'var(--gold, #d3a526)' }} />
              Trinity Grove &bull; Aletheia
            </p>
            <h1
              className="page-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                color: '#FFFFFF',
                lineHeight: 1.15,
                margin: '0 0 1rem 0',
                fontWeight: 400,
              }}
            >
              Faithful learning, thoughtfully guided.
            </h1>
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'var(--sage-light, #dce6dc)',
                lineHeight: 1.6,
                margin: '0 0 1.75rem 0',
              }}
            >
              Acompanhe a formação espiritual, o currículo clássico, a frequência legal e o crescimento diário dos seus filhos em um único lugar soberano.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="/devotional"
                className="ui-button ui-button--md"
                style={{
                  backgroundColor: 'var(--gold, #d3a526)',
                  color: 'var(--forest-2, #0c3028)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-md, 6px)',
                }}
              >
                📖 Devocional de Hoje
              </a>
              <a
                href="/schedule"
                className="ui-button ui-button--md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-md, 6px)',
                }}
              >
                🗓️ Agenda & Checklist
              </a>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              right: '-2rem',
              bottom: '-4rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '18rem',
              color: 'rgba(255, 255, 255, 0.03)',
              lineHeight: 1,
              pointerEvents: 'none',
            }}
          >
            ἀ
          </div>
        </div>

        {/* Dashboard Quick Modules Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Card 1: Educandos */}
          <div className="ui-card ui-card--default" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎓</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--forest, #123f34)', margin: '0 0 0.5rem 0' }}>
              Educandos & Perfis
            </h3>
            <p style={{ color: 'var(--muted, #5c6f67)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Gerencie as etapas de desenvolvimento, estilos de aprendizagem e objetivos individuais dos seus filhos.
            </p>
            <a
              href="/learners"
              className="ui-button ui-button--secondary ui-button--sm"
              style={{ textDecoration: 'none' }}
            >
              Ver Educandos &rarr;
            </a>
          </div>

          {/* Card 2: Currículo */}
          <div className="ui-card ui-card--default" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏛️</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--forest, #123f34)', margin: '0 0 0.5rem 0' }}>
              Currículo & Pedagogia
            </h3>
            <p style={{ color: 'var(--muted, #5c6f67)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Estruture o plano de estudos por ano letivo, disciplinas e modelos pedagógicos (Clássico, Charlotte Mason, Tradicional).
            </p>
            <a
              href="/curriculum"
              className="ui-button ui-button--secondary ui-button--sm"
              style={{ textDecoration: 'none' }}
            >
              Acessar Currículo &rarr;
            </a>
          </div>

          {/* Card 3: Diário & Portfólio */}
          <div className="ui-card ui-card--default" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✨</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--forest, #123f34)', margin: '0 0 0.5rem 0' }}>
              Diário & Evidências
            </h3>
            <p style={{ color: 'var(--muted, #5c6f67)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Registre descobertas da vida real, níveis de domínio qualitativo e construa o portfólio duradouro da família.
            </p>
            <a
              href="/records"
              className="ui-button ui-button--secondary ui-button--sm"
              style={{ textDecoration: 'none' }}
            >
              Abrir Diário &rarr;
            </a>
          </div>

          {/* Card 4: Frequência & Histórico */}
          <div className="ui-card ui-card--default" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--forest, #123f34)', margin: '0 0 0.5rem 0' }}>
              Frequência & Relatórios
            </h3>
            <p style={{ color: 'var(--muted, #5c6f67)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Acompanhe o cumprimento das metas legais de dias e horas e emita históricos escolares oficiais para impressão.
            </p>
            <a
              href="/reports"
              className="ui-button ui-button--secondary ui-button--sm"
              style={{ textDecoration: 'none' }}
            >
              Emitir Relatórios &rarr;
            </a>
          </div>
        </div>
      </div>
    </ProductShell>
  );
}
