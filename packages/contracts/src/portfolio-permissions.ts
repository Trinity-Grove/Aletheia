import type { FamilyRole } from './family.js';

export const portfolioPermissionActions = [
  'view_portfolio',
  'create_portfolio_items',
  'edit_portfolio_items',
  'delete_portfolio_items',
] as const;

export type PortfolioPermissionAction = (typeof portfolioPermissionActions)[number];

const GUARDIAN_ROLES: readonly FamilyRole[] = ['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'];

export function canAccessPortfolio(
  role: FamilyRole | null | undefined,
  action: PortfolioPermissionAction,
): boolean {
  if (!role) return false;
  if (action === 'delete_portfolio_items') return GUARDIAN_ROLES.includes(role);
  return true;
}
