/**
 * Which data-protection law regime applies to a family, based on its
 * country. Scoped to the markets this product already validates for
 * homeschooling (the `jurisdictions` module only has real seed data for
 * Brazil, Uruguay and US-FL/US-TX) plus the largest Spanish-speaking
 * markets and the EU (the app's own locales are pt-BR/en-US/es-ES) --
 * not an attempt to cover all ~190 countries with data-protection law.
 * Country codes are ISO 3166-1 alpha-3, the same format as
 * ISO3_COUNTRIES and Family.countryCode.
 */
export type PrivacyRegime =
  | 'LGPD'
  | 'GDPR'
  | 'COPPA'
  | 'URUGUAY'
  | 'ARGENTINA'
  | 'MEXICO'
  | 'COLOMBIA'
  | 'GENERIC';

/**
 * Product-level grouping for future jurisdiction resolution.
 *
 * These labels are architectural metadata, not legal conclusions. They do not
 * grant or deny consent and intentionally do not encode a country's complete
 * legal obligations.
 */
export type PrivacyProfileCode =
  | 'GDPR_LIKE'
  | 'COMPREHENSIVE'
  | 'DATA_SOVEREIGNTY'
  | 'FEDERAL_REGIONAL'
  | 'SECTORAL_FRAGMENTED'
  | 'LIMITED';

export interface PrivacyProfileDefinition {
  code: PrivacyProfileCode;
  countries: readonly string[];
  requiresSubnationalReview: boolean;
  requiresDataResidencyReview: boolean;
}

const EU_COUNTRY_CODES = new Set([
  'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA',
  'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD',
  'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE',
]);

const COMPREHENSIVE_COUNTRY_CODES = new Set([
  'AUS', 'IDN', 'ISR', 'MYS', 'NGA', 'NZL', 'PHL', 'QAT', 'SAU', 'SGP', 'THA', 'ZAF',
]);

const DATA_SOVEREIGNTY_COUNTRY_CODES = new Set(['CHN', 'IND', 'KAZ', 'RUS', 'VNM']);

const PRIVACY_PROFILE_DEFINITIONS: readonly PrivacyProfileDefinition[] = [
  {
    code: 'GDPR_LIKE',
    countries: ['ARG', 'BRA', 'CHE', 'URY', ...EU_COUNTRY_CODES],
    requiresSubnationalReview: false,
    requiresDataResidencyReview: false,
  },
  {
    code: 'COMPREHENSIVE',
    countries: [...COMPREHENSIVE_COUNTRY_CODES],
    requiresSubnationalReview: false,
    requiresDataResidencyReview: false,
  },
  {
    code: 'DATA_SOVEREIGNTY',
    countries: [...DATA_SOVEREIGNTY_COUNTRY_CODES],
    requiresSubnationalReview: false,
    requiresDataResidencyReview: true,
  },
  {
    code: 'FEDERAL_REGIONAL',
    countries: ['CAN'],
    requiresSubnationalReview: true,
    requiresDataResidencyReview: false,
  },
  {
    code: 'SECTORAL_FRAGMENTED',
    countries: ['USA'],
    requiresSubnationalReview: true,
    requiresDataResidencyReview: false,
  },
  {
    code: 'LIMITED',
    countries: [],
    requiresSubnationalReview: false,
    requiresDataResidencyReview: false,
  },
];

export const privacyProfileDefinitions: readonly PrivacyProfileDefinition[] = PRIVACY_PROFILE_DEFINITIONS;

export function resolvePrivacyProfile(countryCode: string): PrivacyProfileDefinition {
  const normalizedCode = countryCode.trim().toUpperCase();
  return PRIVACY_PROFILE_DEFINITIONS.find((profile) => profile.countries.includes(normalizedCode))
    ?? PRIVACY_PROFILE_DEFINITIONS.find((profile) => profile.code === 'LIMITED')!;
}

export function resolvePrivacyRegime(countryCode: string): PrivacyRegime {
  switch (countryCode.trim().toUpperCase()) {
    case 'BRA':
      return 'LGPD';
    case 'USA':
      return 'COPPA';
    case 'URY':
      return 'URUGUAY';
    case 'ARG':
      return 'ARGENTINA';
    case 'MEX':
      return 'MEXICO';
    case 'COL':
      return 'COLOMBIA';
    default:
      return EU_COUNTRY_CODES.has(countryCode) ? 'GDPR' : 'GENERIC';
  }
}
