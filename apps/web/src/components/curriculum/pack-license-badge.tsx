'use client';

import React from 'react';
import type { PackLicenseCode, PackProvenance } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PackLicenseBadgeProps {
  license?: PackLicenseCode | string | null | undefined;
  provenance?: PackProvenance | null | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

const LICENSE_SHORT_LABELS: Record<string, string> = {
  CC_BY_4_0: 'CC-BY 4.0',
  CC_BY_NC_4_0: 'CC-BY-NC 4.0',
  CC_BY_SA_4_0: 'CC-BY-SA 4.0',
  PUBLIC_DOMAIN: 'Domínio Público',
  ALETHEIA_OPEN_COMMUNITY: 'Comunidade Aberta',
  ALETHEIA_EDITORIAL_STANDARD: 'Padrão Editorial',
};

export function PackLicenseBadge({
  license,
  provenance,
  className = '',
  style = {},
}: PackLicenseBadgeProps) {
  const { t } = useLocale();

  if (!license) {
    return null;
  }

  const licenseKey = `curriculum.marketplace.license.${license}`;
  const localizedLabel = t(licenseKey);
  const displayLabel =
    localizedLabel !== licenseKey ? localizedLabel : (LICENSE_SHORT_LABELS[license] ?? license);

  const tooltipKey = `curriculum.marketplace.license.tooltip_${license}`;
  const localizedTooltip = t(tooltipKey);
  let tooltip = localizedTooltip !== tooltipKey ? localizedTooltip : displayLabel;

  if (provenance?.authorDisplayName) {
    tooltip += ` • ${t('curriculum.marketplace.license.provenanceAuthor', { author: provenance.authorDisplayName })}`;
  }
  if (provenance?.checksumSha256) {
    tooltip += ` • ${t('curriculum.marketplace.license.provenanceChecksum')}`;
  }

  return (
    <span
      data-testid="pack-license-badge"
      data-license={license}
      title={tooltip}
      className={`pack-license-badge ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.6875rem',
        fontWeight: 600,
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        backgroundColor: '#F1F5F9',
        color: '#334155',
        border: '1px solid #CBD5E1',
        lineHeight: 1.3,
        cursor: 'help',
        ...style,
      }}
    >
      <span aria-hidden="true">📜</span>
      <span>{displayLabel}</span>
      {provenance?.checksumSha256 && (
        <span
          data-testid="pack-provenance-verified"
          title={t('curriculum.marketplace.license.provenanceChecksum')}
          style={{ fontSize: '0.625rem', color: '#059669', marginLeft: '0.125rem' }}
        >
          ✓
        </span>
      )}
    </span>
  );
}
