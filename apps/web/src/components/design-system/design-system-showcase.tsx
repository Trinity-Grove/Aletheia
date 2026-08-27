'use client';

import React, { useState } from 'react';
import type { FamilyRole } from '@aletheia/contracts';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  Input,
  Select,
  Textarea,
  Switch,
} from '../ui';
import { RoleBadge } from '../auth/role-badge';
import { Can, RequireRole } from '../auth/role-guard';
import { AuthProvider } from '../../lib/auth/rbac-context';

export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState<
    'tokens' | 'typography' | 'buttons' | 'cards' | 'badges' | 'forms' | 'modal' | 'rbac'
  >('tokens');

  // Form states
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('');
  const [selectVal, setSelectVal] = useState('classical');
  const [switchVal, setSwitchVal] = useState(true);

  // Modal demo state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // RBAC simulator state
  const [simulatedRole, setSimulatedRole] = useState<FamilyRole>('OWNER_GUARDIAN');

  return (
    <div className="design-system-container" style={{ padding: '1rem 0' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
          <span className="rule" />
          Trinity Grove &bull; Design as Code
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            color: 'var(--forest, #123f34)',
            margin: '0 0 0.5rem 0',
            fontWeight: 400,
          }}
        >
          Biblioteca de Componentes & Tokens
        </h1>
        <p style={{ color: 'var(--muted, #5c6f67)', fontSize: '1rem', margin: 0, maxWidth: '750px' }}>
          Guia vivo e playground interativo dos tokens visuais, componentes atômicos e padrões de interface da plataforma Aletheia.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--line, rgba(18, 63, 52, 0.14))',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'tokens', label: '🎨 Cores & Tokens' },
          { id: 'typography', label: '✍️ Tipografia' },
          { id: 'buttons', label: '🔘 Botões' },
          { id: 'cards', label: '🃏 Cartões' },
          { id: 'badges', label: '🏷️ Badges' },
          { id: 'forms', label: '📝 Formulários' },
          { id: 'modal', label: '🪟 Modais' },
          { id: 'rbac', label: '🛡️ RBAC & Guards' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                fontFamily: 'var(--font-sans)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md, 6px)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                backgroundColor: isActive ? 'var(--forest, #123f34)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--muted, #5c6f67)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TOKENS */}
      {activeTab === 'tokens' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--forest)', fontSize: '1.5rem', margin: '0 0 1rem 0' }}>
              Paleta Oficial Trinity Grove
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { name: '--forest', hex: '#123f34', label: 'Primary Brand Green', text: '#ffffff' },
                { name: '--forest-2', hex: '#0c3028', label: 'Evergreen Hover', text: '#ffffff' },
                { name: '--sage', hex: '#78937f', label: 'Botanical Sage', text: '#ffffff' },
                { name: '--sage-light', hex: '#dce6dc', label: 'Sage Tint', text: '#17312a' },
                { name: '--sage-soft', hex: '#eef1e8', label: 'Active Background', text: '#17312a' },
                { name: '--gold', hex: '#d3a526', label: 'Heritage Gold', text: '#0c3028' },
                { name: '--gold-soft', hex: '#f3e5b6', label: 'Praise & Alert Gold', text: '#17312a' },
                { name: '--ivory', hex: '#fbf8ef', label: 'Canvas / Sidebar', text: '#17312a' },
                { name: '--paper', hex: '#fffdf7', label: 'Surface / Card', text: '#17312a' },
                { name: '--ink', hex: '#17312a', label: 'Body Text Ink', text: '#ffffff' },
                { name: '--muted', hex: '#5c6f67', label: 'Secondary Muted', text: '#ffffff' },
              ].map((c) => (
                <div
                  key={c.name}
                  style={{
                    backgroundColor: c.hex,
                    color: c.text,
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: '1px solid var(--line, rgba(18, 63, 52, 0.14))',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'monospace' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '0.25rem' }}>{c.hex}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--forest)', fontSize: '1.5rem', margin: '0 0 1rem 0' }}>
              Sombras & Elevação
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {[
                { name: '--shadow-sm', desc: 'Bordas sutis e cartões padrão' },
                { name: '--shadow-md', desc: 'Cartões elevados e menus flutuantes' },
                { name: '--shadow-lg', desc: 'Modais, banners heróicos e popovers' },
                { name: '--shadow-xl', desc: 'Diálogos de máxima ênfase' },
              ].map((s) => (
                <div
                  key={s.name}
                  style={{
                    backgroundColor: 'var(--paper, #fffdf7)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg, 10px)',
                    border: '1px solid var(--line, rgba(18, 63, 52, 0.14))',
                    boxShadow: `var(${s.name})`,
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', fontFamily: 'monospace' }}>{s.name}</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8125rem', color: 'var(--muted)' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TYPOGRAPHY */}
      {activeTab === 'typography' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Hierarquia Tipográfica</CardTitle>
              <CardDescription>Combinação de Libre Caslon Display (Serif) e DM Sans (Interface)</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  <span className="rule" />
                  Eyebrow Kicker — 11px uppercase
                </p>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--forest)', margin: 0, fontWeight: 400 }}>
                  Display Title (H1) — Libre Caslon Display
                </h1>
              </div>

              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--forest)', margin: 0, fontWeight: 400 }}>
                  Heading Level 2 (H2) — Classical Noble Header
                </h2>
              </div>

              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--forest)', margin: 0, fontWeight: 400 }}>
                  Heading Level 3 (H3) — Card & Section Titles
                </h3>
              </div>

              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  <strong>Body Text (DM Sans):</strong> Instrua a criança no caminho em que deve andar, e até quando envelhecer não se desviará dele. O design transmite serenidade, nobreza e reverência em cada detalhe tipográfico.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trinity Grove Scripture Card */}
          <div className="verse-card-trinity">
            <div style={{ position: 'relative', zIndex: 2, paddingLeft: '1.5rem' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                &ldquo;Toda a Escritura é divinamente inspirada, e proveitosa para ensinar, para redarguir, para instruir em justiça.&rdquo;
              </p>
              <span style={{ fontSize: '0.875rem', color: 'var(--gold-soft)', fontWeight: 700, letterSpacing: '0.05em' }}>
                — 2 Timóteo 3:16
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUTTONS */}
      {activeTab === 'buttons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Variantes de Botões</CardTitle>
              <CardDescription>Estilos consistentes para ações primárias, secundárias e destrutivas</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Button variant="primary">Primary (Forest)</Button>
              <Button variant="secondary">Secondary (Sage Soft)</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading>Carregando</Button>
              <Button variant="primary" leftIcon={<span>📖</span>}>Com Ícone</Button>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Tamanhos de Botões</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Button size="sm" variant="primary">Small (sm)</Button>
              <Button size="md" variant="primary">Medium (md)</Button>
              <Button size="lg" variant="primary">Large (lg)</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: CARDS */}
      {activeTab === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Card variant="default">
            <CardHeader>
              <CardTitle>Card Default</CardTitle>
              <CardDescription>Borda sutil e fundo paper</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>Ideal para listas e painéis de dados gerais.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">Ação</Button>
            </CardFooter>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Card Bordered</CardTitle>
              <CardDescription>Borda reforçada para destaque</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>Usado para formulários e itens selecionáveis.</p>
            </CardContent>
          </Card>

          <Card variant="flat">
            <CardHeader>
              <CardTitle>Card Flat</CardTitle>
              <CardDescription>Fundo sálvia suave sem sombra</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>Ótimo para notas de rodapé e alertas internos.</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Card Glassmorphism</CardTitle>
              <CardDescription>Fundo translúcido com desfoque</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>Para modais flutuantes e sobreposições elegantes.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: BADGES */}
      {activeTab === 'badges' && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Badges & Tags Semânticas</CardTitle>
            <CardDescription>Identificadores de etapas, status e taxonomias</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Badge variant="emerald">Emerald / Concluído</Badge>
              <Badge variant="amber">Amber / Em Andamento</Badge>
              <Badge variant="indigo">Indigo / Aliança</Badge>
              <Badge variant="slate">Slate / Padrão</Badge>
              <Badge variant="rose">Rose / Pendente</Badge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Badge variant="emerald" dot>Com Ponto</Badge>
              <Badge variant="amber" dot>Atenção</Badge>
              <Badge variant="rose" dot>Alerta</Badge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Badge size="sm" variant="indigo">Small</Badge>
              <Badge size="md" variant="indigo">Medium</Badge>
              <Badge size="lg" variant="indigo">Large</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: FORMS */}
      {activeTab === 'forms' && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Primitivas de Formulário</CardTitle>
            <CardDescription>Inputs, Selects, Textareas e Switches estilizados</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Input
              label="Campo de Texto Padrão"
              placeholder="Digite seu texto..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              helperText="Exemplo de mensagem auxiliar informativa"
            />

            <Input
              label="Campo com Erro de Validação"
              placeholder="Digite algo errado..."
              value={inputError}
              onChange={(e) => setInputError(e.target.value)}
              error={inputError.length < 3 ? 'O texto deve conter pelo menos 3 caracteres' : undefined}
            />

            <Input
              label="Campo com Ícone"
              placeholder="Buscar objetivo..."
              leftIcon={<span>🔍</span>}
              rightIcon={<span>⌨️</span>}
            />

            <Select
              label="Modelo Pedagógico"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: 'classical', label: 'Educação Clássica (Trivium)' },
                { value: 'charlotte_mason', label: 'Charlotte Mason (Living Books)' },
                { value: 'traditional', label: 'Tradicional Estruturado' },
              ]}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Textarea
                label="Anotações & Observações"
                placeholder="Escreva anotações pedagógicas detalhadas..."
                rows={3}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Switch
                label="Notificações de Culto e Agenda"
                description="Receba avisos diários no horário programado"
                checked={switchVal}
                onChange={(e) => setSwitchVal(e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 7: MODAL */}
      {activeTab === 'modal' && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Demonstração de Modal Acessível</CardTitle>
            <CardDescription>Diálogo com backdrop blur, escape key, focus trapping e scroll locking</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Abrir Modal de Exemplo
            </Button>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Planejamento de Lição"
              description="Configure o plano pedagógico para os educandos selecionados."
              footer={
                <>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>Salvar Plano</Button>
                </>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input label="Título da Lição" placeholder="Ex: Gramática Latina — Capítulo 3" />
                <Select
                  label="Disciplina"
                  options={[
                    { value: 'lat', label: 'Latim & Línguas Clássicas' },
                    { value: 'mat', label: 'Matemática e Geometria' },
                    { value: 'his', label: 'História Universal' },
                  ]}
                />
              </div>
            </Modal>
          </CardContent>
        </Card>
      )}

      {/* TAB 8: RBAC */}
      {activeTab === 'rbac' && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Simulador de RBAC (Controle de Acesso)</CardTitle>
            <CardDescription>Alterne o papel ativo para ver como os componentes se adaptam dinamicamente</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Simular Papel:</span>
              {(['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN', 'EDUCATOR'] as FamilyRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSimulatedRole(r)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: '1.5px solid var(--forest)',
                    backgroundColor: simulatedRole === r ? 'var(--forest)' : 'transparent',
                    color: simulatedRole === r ? '#ffffff' : 'var(--forest)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--sage-soft)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span>Papel Ativo:</span>
                <RoleBadge role={simulatedRole} size="md" />
              </div>

              <AuthProvider role={simulatedRole}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Can action="delete_family">
                    <div style={{ padding: '0.5rem', backgroundColor: '#fde8e8', color: '#9f2424', borderRadius: '4px' }}>
                      🔥 Visível apenas para <strong>OWNER_GUARDIAN</strong> (Excluir Núcleo Familiar)
                    </div>
                  </Can>

                  <Can action="delete_learner">
                    <div style={{ padding: '0.5rem', backgroundColor: '#eef1e8', color: '#17312a', borderRadius: '4px' }}>
                      🎓 Visível para <strong>GUARDIANS</strong> (Excluir / Arquivar Educando)
                    </div>
                  </Can>

                  <Can action="log_learning">
                    <div style={{ padding: '0.5rem', backgroundColor: '#f0f7fb', color: '#1a445d', borderRadius: '4px' }}>
                      ✍️ Visível para <strong>EDUCATOR & GUARDIANS</strong> (Registrar Diário & Lições)
                    </div>
                  </Can>

                  <RequireRole roles={['EDUCATOR']}>
                    <div style={{ padding: '0.5rem', backgroundColor: '#fefbf2', color: '#b48517', borderRadius: '4px' }}>
                      ℹ️ Mensagem exclusiva de orientação para o Educador externo.
                    </div>
                  </RequireRole>
                </div>
              </AuthProvider>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
