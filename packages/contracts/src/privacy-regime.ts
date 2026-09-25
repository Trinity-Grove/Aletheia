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

const EU_COUNTRY_CODES = new Set([
  'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA',
  'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD',
  'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE',
]);

export function resolvePrivacyRegime(countryCode: string): PrivacyRegime {
  switch (countryCode) {
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
