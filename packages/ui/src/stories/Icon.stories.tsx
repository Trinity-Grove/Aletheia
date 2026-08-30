import React from 'react';
import { AletheiaIcon, ICON_NAMES, ICON_SIZES, type IconName, type IconSize } from '../components/icon.js';

export default {
  title: 'Components/AletheiaIcon',
  component: AletheiaIcon,
  parameters: {
    docs: {
      description: {
        component:
          'Governed icon component wrapping Lucide icons with strict size scales, semantic tokens, and accessibility defaults.',
      },
    },
  },
};

export const Default = () => <AletheiaIcon name="home" size="md" />;

export const AllSizes = () => {
  const sizes: IconSize[] = ['sm', 'md', 'lg', 'xl', 48];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem' }}>
      {sizes.map((size) => (
        <div key={String(size)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <AletheiaIcon name="sparkles" size={size} />
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {typeof size === 'number' ? `${size}px` : `${size} (${ICON_SIZES[size]}px)`}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SemanticAccessibility = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <AletheiaIcon name="bell" label="Notificações do sistema" />
      <span>Semantic Icon (with label & role=&quot;img&quot;)</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <AletheiaIcon name="search" />
      <span>Decorative Icon (default aria-hidden=&quot;true&quot;)</span>
    </div>
  </div>
);

export const Catalog = () => {
  const uniqueIcons = Array.from(new Set(ICON_NAMES)).filter((name) => /^[a-z0-9-]+$/.test(name));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {uniqueIcons.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            gap: '0.5rem',
          }}
        >
          <AletheiaIcon name={name as IconName} size="lg" />
          <span style={{ fontSize: '0.75rem', textAlign: 'center', wordBreak: 'break-word' }}>{name}</span>
        </div>
      ))}
    </div>
  );
};
