'use client';

import React, { useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
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
import { useLocale } from '../../lib/i18n/locale-context';

export function DesignSystemShowcase() {
  const { t } = useLocale();
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
          {t('showcase.eyebrow')}
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
          {t('showcase.title')}
        </h1>
        <p style={{ color: 'var(--muted, #5c6f67)', fontSize: '1rem', margin: 0, maxWidth: '750px' }}>
          {t('showcase.subtitle')}
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
          { id: 'tokens', label: t('showcase.tabs.tokens'), icon: <AletheiaIcon name="palette" size={16} /> },
          { id: 'typography', label: t('showcase.tabs.typography'), icon: <AletheiaIcon name="file-text" size={16} /> },
          { id: 'buttons', label: t('showcase.tabs.buttons'), icon: <AletheiaIcon name="check" size={16} /> },
          { id: 'cards', label: t('showcase.tabs.cards'), icon: <AletheiaIcon name="folder" size={16} /> },
          { id: 'badges', label: t('showcase.tabs.badges'), icon: <AletheiaIcon name="sparkles" size={16} /> },
          { id: 'forms', label: t('showcase.tabs.forms'), icon: <AletheiaIcon name="file-text" size={16} /> },
          { id: 'modal', label: t('showcase.tabs.modal'), icon: <AletheiaIcon name="sparkles" size={16} /> },
          { id: 'rbac', label: t('showcase.tabs.rbac'), icon: <AletheiaIcon name="shield" size={16} /> },
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
                backgroundColor: isActive ? 'var(--color-brand-forest, #17312a)' : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--color-text-muted, #5f6c65)',
                transition: 'all var(--transition-fast)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TOKENS */}
      {activeTab === 'tokens' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--forest)', fontSize: '1.5rem', margin: '0 0 1rem 0' }}>
              {t('showcase.tokens.paletteTitle')}
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
              {t('showcase.tokens.shadowsTitle')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {[
                { name: '--shadow-sm', desc: t('showcase.tokens.shadowSmDesc') },
                { name: '--shadow-md', desc: t('showcase.tokens.shadowMdDesc') },
                { name: '--shadow-lg', desc: t('showcase.tokens.shadowLgDesc') },
                { name: '--shadow-xl', desc: t('showcase.tokens.shadowXlDesc') },
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
              <CardTitle>{t('showcase.typography.title')}</CardTitle>
              <CardDescription>{t('showcase.typography.desc')}</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  <span className="rule" />
                  {t('showcase.typography.eyebrowSample')}
                </p>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--forest)', margin: 0, fontWeight: 400 }}>
                  {t('showcase.typography.h1Sample')}
                </h1>
              </div>

              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--forest)', margin: 0, fontWeight: 400 }}>
                  {t('showcase.typography.h2Sample')}
                </h2>
              </div>

              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--forest)', margin: 0, fontWeight: 400 }}>
                  {t('showcase.typography.h3Sample')}
                </h3>
              </div>

              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  <strong>{t('showcase.typography.bodyTextLabel')}</strong> {t('showcase.typography.bodyTextSample')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trinity Grove Scripture Card */}
          <div className="verse-card-trinity">
            <div style={{ position: 'relative', zIndex: 2, paddingLeft: '1.5rem' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                {t('showcase.typography.scriptureVerse')}
              </p>
              <span style={{ fontSize: '0.875rem', color: 'var(--gold-soft)', fontWeight: 700, letterSpacing: '0.05em' }}>
                {t('showcase.typography.scriptureCitation')}
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
              <CardTitle>{t('showcase.buttons.variantsTitle')}</CardTitle>
              <CardDescription>{t('showcase.buttons.variantsDesc')}</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Button variant="primary">{t('showcase.buttons.primary')}</Button>
              <Button variant="secondary">{t('showcase.buttons.secondary')}</Button>
              <Button variant="outline">{t('showcase.buttons.outline')}</Button>
              <Button variant="ghost">{t('showcase.buttons.ghost')}</Button>
              <Button variant="danger">{t('showcase.buttons.danger')}</Button>
              <Button variant="primary" isLoading>{t('showcase.buttons.loading')}</Button>
              <Button variant="primary" leftIcon={<AletheiaIcon name="book-open" size={16} />}>{t('showcase.buttons.withIcon')}</Button>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('showcase.buttons.sizesTitle')}</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Button size="sm" variant="primary">{t('showcase.buttons.sizeSm')}</Button>
              <Button size="md" variant="primary">{t('showcase.buttons.sizeMd')}</Button>
              <Button size="lg" variant="primary">{t('showcase.buttons.sizeLg')}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: CARDS */}
      {activeTab === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Card variant="default">
            <CardHeader>
              <CardTitle>{t('showcase.cards.defaultTitle')}</CardTitle>
              <CardDescription>{t('showcase.cards.defaultDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>{t('showcase.cards.defaultContent')}</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">{t('showcase.cards.action')}</Button>
            </CardFooter>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('showcase.cards.borderedTitle')}</CardTitle>
              <CardDescription>{t('showcase.cards.borderedDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>{t('showcase.cards.borderedContent')}</p>
            </CardContent>
          </Card>

          <Card variant="flat">
            <CardHeader>
              <CardTitle>{t('showcase.cards.flatTitle')}</CardTitle>
              <CardDescription>{t('showcase.cards.flatDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>{t('showcase.cards.flatContent')}</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>{t('showcase.cards.glassTitle')}</CardTitle>
              <CardDescription>{t('showcase.cards.glassDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>{t('showcase.cards.glassContent')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: BADGES */}
      {activeTab === 'badges' && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>{t('showcase.badges.title')}</CardTitle>
            <CardDescription>{t('showcase.badges.desc')}</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Badge variant="emerald">{t('showcase.badges.emerald')}</Badge>
              <Badge variant="amber">{t('showcase.badges.amber')}</Badge>
              <Badge variant="indigo">{t('showcase.badges.indigo')}</Badge>
              <Badge variant="slate">{t('showcase.badges.slate')}</Badge>
              <Badge variant="rose">{t('showcase.badges.rose')}</Badge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Badge variant="emerald" dot>{t('showcase.badges.dot')}</Badge>
              <Badge variant="amber" dot>{t('showcase.badges.attention')}</Badge>
              <Badge variant="rose" dot>{t('showcase.badges.alert')}</Badge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Badge size="sm" variant="indigo">{t('showcase.badges.sizeSm')}</Badge>
              <Badge size="md" variant="indigo">{t('showcase.badges.sizeMd')}</Badge>
              <Badge size="lg" variant="indigo">{t('showcase.badges.sizeLg')}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: FORMS */}
      {activeTab === 'forms' && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>{t('showcase.forms.title')}</CardTitle>
            <CardDescription>{t('showcase.forms.desc')}</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <Input
              label={t('showcase.forms.defaultInputLabel')}
              placeholder={t('showcase.forms.defaultInputPlaceholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              helperText={t('showcase.forms.defaultInputHelper')}
            />

            <Input
              label={t('showcase.forms.errorInputLabel')}
              placeholder={t('showcase.forms.errorInputPlaceholder')}
              value={inputError}
              onChange={(e) => setInputError(e.target.value)}
              error={inputError.length < 3 ? t('showcase.forms.errorInputMessage') : undefined}
            />

            <Input
              label={t('showcase.forms.iconInputLabel')}
              placeholder={t('showcase.forms.iconInputPlaceholder')}
              leftIcon={<AletheiaIcon name="search" size={16} />}
              rightIcon={<AletheiaIcon name="sparkles" size={16} />}
            />

            <Select
              label={t('showcase.forms.selectLabel')}
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: 'classical', label: t('showcase.forms.classicalOption') },
                { value: 'charlotte_mason', label: t('showcase.forms.charlotteOption') },
                { value: 'traditional', label: t('showcase.forms.traditionalOption') },
              ]}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Textarea
                label={t('showcase.forms.notesLabel')}
                placeholder={t('showcase.forms.notesPlaceholder')}
                rows={3}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Switch
                label={t('showcase.forms.switchLabel')}
                description={t('showcase.forms.switchDesc')}
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
            <CardTitle>{t('showcase.modal.title')}</CardTitle>
            <CardDescription>{t('showcase.modal.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              {t('showcase.modal.openButton')}
            </Button>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={t('showcase.modal.demoTitle')}
              description={t('showcase.modal.demoDesc')}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('showcase.modal.cancel')}</Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>{t('showcase.modal.savePlan')}</Button>
                </>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input label={t('showcase.modal.lessonTitleLabel')} placeholder={t('showcase.modal.lessonTitlePlaceholder')} />
                <Select
                  label={t('showcase.modal.subjectLabel')}
                  options={[
                    { value: 'lat', label: t('showcase.modal.subjectLatin') },
                    { value: 'mat', label: t('showcase.modal.subjectMath') },
                    { value: 'his', label: t('showcase.modal.subjectHistory') },
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
            <CardTitle>{t('showcase.rbac.title')}</CardTitle>
            <CardDescription>{t('showcase.rbac.desc')}</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('showcase.rbac.simulateRoleLabel')}</span>
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
                    color: simulatedRole === r ? 'var(--text-inverse)' : 'var(--forest)',
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
                <span>{t('showcase.rbac.activeRoleLabel')}</span>
                <RoleBadge role={simulatedRole} size="md" />
              </div>

              <AuthProvider role={simulatedRole}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Can action="delete_family">
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-rose-50)', color: 'var(--color-rose-700)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AletheiaIcon name="alert-circle" size={16} />
                      <span>{t('showcase.rbac.ownerGuardianOnly')}</span>
                    </div>
                  </Can>

                  <Can action="delete_learner">
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--sage-soft)', color: 'var(--forest-2)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AletheiaIcon name="graduation-cap" size={16} />
                      <span>{t('showcase.rbac.guardiansOnly')}</span>
                    </div>
                  </Can>

                  <Can action="log_learning">
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-indigo-50)', color: 'var(--color-indigo-700)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AletheiaIcon name="pencil" size={16} />
                      <span>{t('showcase.rbac.educatorAndGuardians')}</span>
                    </div>
                  </Can>

                  <RequireRole roles={['EDUCATOR']}>
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-amber-50)', color: 'var(--color-amber-700)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AletheiaIcon name="info" size={16} />
                      <span>{t('showcase.rbac.educatorMessage')}</span>
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
