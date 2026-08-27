import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FamilyRole } from '@aletheia/contracts';
import {
  AuthProvider,
  useAuthRole,
  usePermissions,
  getPermissions,
} from '../src/lib/auth/rbac-context';
import { RequireRole, Can, RequirePermission } from '../src/components/auth/role-guard';
import { RoleBadge, ROLE_LABELS } from '../src/components/auth/role-badge';

describe('Frontend RBAC Context & Permission Matrix', () => {
  afterEach(() => {
    cleanup();
  });

  describe('usePermissions() and Permission Matrix', () => {
    it('grants full administrative permissions for OWNER_GUARDIAN', () => {
      const perms = getPermissions('OWNER_GUARDIAN');

      expect(perms.role).toBe('OWNER_GUARDIAN');
      expect(perms.canDeleteLearners).toBe(true);
      expect(perms.canEditFamilySettings).toBe(true);
      expect(perms.canInviteMembers).toBe(true);
      expect(perms.canDeleteFamily).toBe(true);
      expect(perms.canLogLearning).toBe(true);
      expect(perms.canGenerateTranscripts).toBe(true);
      expect(perms.canManageAttendance).toBe(true);
      expect(perms.canManageLessons).toBe(true);
      expect(perms.canLogAttendance).toBe(true);
      expect(perms.canUploadPortfolioItems).toBe(true);
      expect(perms.canModifyComplianceTargets).toBe(true);

      // Method can() checks
      expect(perms.can('delete_learner')).toBe(true);
      expect(perms.can('delete_family')).toBe(true);
      expect(perms.can('edit_family_settings')).toBe(true);
      expect(perms.can('invite_members')).toBe(true);
      expect(perms.can('log_learning')).toBe(true);
      expect(perms.can('generate_transcripts')).toBe(true);
      expect(perms.can('manage_attendance')).toBe(true);
    });

    it('grants guardian permissions for GUARDIAN and CO_GUARDIAN (except delete family)', () => {
      const guardianRoles: FamilyRole[] = ['GUARDIAN', 'CO_GUARDIAN'];

      for (const role of guardianRoles) {
        const perms = getPermissions(role);

        expect(perms.role).toBe(role);
        expect(perms.canDeleteLearners).toBe(true);
        expect(perms.canEditFamilySettings).toBe(true);
        expect(perms.canInviteMembers).toBe(true);
        expect(perms.canDeleteFamily).toBe(false); // cannot delete family
        expect(perms.canLogLearning).toBe(true);
        expect(perms.canGenerateTranscripts).toBe(true);
        expect(perms.canManageAttendance).toBe(true);
        expect(perms.canManageLessons).toBe(true);
        expect(perms.canLogAttendance).toBe(true);
        expect(perms.canUploadPortfolioItems).toBe(true);
        expect(perms.canModifyComplianceTargets).toBe(true);

        expect(perms.can('delete_learner')).toBe(true);
        expect(perms.can('delete_family')).toBe(false);
        expect(perms.can('edit_family_settings')).toBe(true);
        expect(perms.can('invite_members')).toBe(true);
        expect(perms.can('log_learning')).toBe(true);
        expect(perms.can('generate_transcripts')).toBe(true);
        expect(perms.can('manage_attendance')).toBe(true);
      }
    });

    it('grants pedagogical permissions for EDUCATOR and denies administrative permissions', () => {
      const perms = getPermissions('EDUCATOR');

      expect(perms.role).toBe('EDUCATOR');
      // Allowed permissions
      expect(perms.canLogLearning).toBe(true);
      expect(perms.canManageLessons).toBe(true);
      expect(perms.canLogAttendance).toBe(true);
      expect(perms.canUploadPortfolioItems).toBe(true);

      // Forbidden permissions
      expect(perms.canDeleteLearners).toBe(false);
      expect(perms.canEditFamilySettings).toBe(false);
      expect(perms.canInviteMembers).toBe(false);
      expect(perms.canModifyComplianceTargets).toBe(false);
      expect(perms.canDeleteFamily).toBe(false);
      expect(perms.canGenerateTranscripts).toBe(false);
      expect(perms.canManageAttendance).toBe(false);

      // Method can() checks
      expect(perms.can('log_learning')).toBe(true);
      expect(perms.can('manage_lessons')).toBe(true);
      expect(perms.can('log_attendance')).toBe(true);
      expect(perms.can('upload_portfolio_items')).toBe(true);

      expect(perms.can('delete_learner')).toBe(false);
      expect(perms.can('edit_family_settings')).toBe(false);
      expect(perms.can('invite_members')).toBe(false);
      expect(perms.can('modify_compliance_targets')).toBe(false);
      expect(perms.can('delete_family')).toBe(false);
    });

    it('denies all permissions when role is null or unauthenticated', () => {
      const perms = getPermissions(null);

      expect(perms.role).toBeNull();
      expect(perms.canDeleteLearners).toBe(false);
      expect(perms.canEditFamilySettings).toBe(false);
      expect(perms.canInviteMembers).toBe(false);
      expect(perms.canDeleteFamily).toBe(false);
      expect(perms.canLogLearning).toBe(false);
      expect(perms.canGenerateTranscripts).toBe(false);
      expect(perms.canManageAttendance).toBe(false);
      expect(perms.canManageLessons).toBe(false);
      expect(perms.canLogAttendance).toBe(false);
      expect(perms.canUploadPortfolioItems).toBe(false);
      expect(perms.canModifyComplianceTargets).toBe(false);
      expect(perms.can('delete_learner')).toBe(false);
    });

    it('integrates usePermissions with AuthProvider context', () => {
      function TestComponent() {
        const perms = usePermissions();
        const auth = useAuthRole();
        return (
          <div>
            <span data-testid="active-role">{perms.role ?? 'NO_ROLE'}</span>
            <span data-testid="can-delete-learner">
              {perms.canDeleteLearners ? 'ALLOWED' : 'DENIED'}
            </span>
            <span data-testid="can-delete-family">
              {perms.canDeleteFamily ? 'ALLOWED' : 'DENIED'}
            </span>
            <button
              data-testid="switch-role-btn"
              onClick={() => auth?.setRole('OWNER_GUARDIAN')}
            >
              Mudar Papel
            </button>
          </div>
        );
      }

      const { rerender } = render(
        <AuthProvider role="EDUCATOR">
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('active-role')).toHaveTextContent('EDUCATOR');
      expect(screen.getByTestId('can-delete-learner')).toHaveTextContent('DENIED');
      expect(screen.getByTestId('can-delete-family')).toHaveTextContent('DENIED');

      rerender(
        <AuthProvider role="OWNER_GUARDIAN">
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('active-role')).toHaveTextContent('OWNER_GUARDIAN');
      expect(screen.getByTestId('can-delete-learner')).toHaveTextContent('ALLOWED');
      expect(screen.getByTestId('can-delete-family')).toHaveTextContent('ALLOWED');
    });

    it('allows dynamic role change via setRole in AuthProvider', () => {
      function DynamicRoleComponent() {
        const auth = useAuthRole();
        const perms = usePermissions();

        return (
          <div>
            <span data-testid="current-role">{perms.role ?? 'NONE'}</span>
            <button
              data-testid="promote-to-owner-btn"
              onClick={() => auth?.setRole('OWNER_GUARDIAN')}
            >
              Promover
            </button>
          </div>
        );
      }

      render(
        <AuthProvider initialRole="EDUCATOR">
          <DynamicRoleComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('current-role')).toHaveTextContent('EDUCATOR');
      fireEvent.click(screen.getByTestId('promote-to-owner-btn'));
      expect(screen.getByTestId('current-role')).toHaveTextContent('OWNER_GUARDIAN');
    });

    it('useAuthRole exposes role boolean helpers', () => {
      function AuthDetailsComponent() {
        const auth = useAuthRole();
        return (
          <div>
            <span data-testid="is-owner">{auth?.isOwnerGuardian ? 'YES' : 'NO'}</span>
            <span data-testid="is-guardian">{auth?.isGuardian ? 'YES' : 'NO'}</span>
            <span data-testid="is-educator">{auth?.isEducator ? 'YES' : 'NO'}</span>
          </div>
        );
      }

      render(
        <AuthProvider initialRole="CO_GUARDIAN">
          <AuthDetailsComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('is-owner')).toHaveTextContent('NO');
      expect(screen.getByTestId('is-guardian')).toHaveTextContent('YES');
      expect(screen.getByTestId('is-educator')).toHaveTextContent('NO');
    });
  });

  describe('<RequireRole /> Guard Component', () => {
    it('renders children for authorized roles and renders fallback/null for unauthorized roles', () => {
      const { rerender } = render(
        <RequireRole roles={['GUARDIAN']} currentRole="GUARDIAN">
          <div data-testid="protected-content">Conteúdo de Guardião</div>
        </RequireRole>,
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toHaveTextContent('Conteúdo de Guardião');

      // Unauthorized role without fallback renders null
      rerender(
        <RequireRole roles={['GUARDIAN']} currentRole="EDUCATOR">
          <div data-testid="protected-content">Conteúdo de Guardião</div>
        </RequireRole>,
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Unauthorized role with fallback renders fallback
      rerender(
        <RequireRole
          roles={['GUARDIAN']}
          currentRole="EDUCATOR"
          fallback={<div data-testid="fallback-content">Acesso Negado</div>}
        >
          <div data-testid="protected-content">Conteúdo de Guardião</div>
        </RequireRole>,
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toHaveTextContent('Acesso Negado');
    });

    it('works seamlessly with AuthProvider context', () => {
      render(
        <AuthProvider initialRole="OWNER_GUARDIAN">
          <RequireRole roles={['OWNER_GUARDIAN', 'GUARDIAN']}>
            <div data-testid="admin-panel">Painel Administrativo</div>
          </RequireRole>
        </AuthProvider>,
      );

      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    });

    it('supports single role or array of roles in props', () => {
      render(
        <RequireRole roles="EDUCATOR" currentRole="EDUCATOR">
          <div data-testid="single-role-child">Educador Ativo</div>
        </RequireRole>,
      );

      expect(screen.getByTestId('single-role-child')).toBeInTheDocument();
    });
  });

  describe('<Can /> and <RequirePermission /> UI Guard Component', () => {
    it('renders children only when authorized for the specified action', () => {
      const { rerender } = render(
        <Can action="delete_learner" role="OWNER_GUARDIAN">
          <button data-testid="delete-learner-btn">Excluir Educando</button>
        </Can>,
      );

      expect(screen.getByTestId('delete-learner-btn')).toBeInTheDocument();

      // For EDUCATOR, action delete_learner is forbidden
      rerender(
        <Can
          action="delete_learner"
          role="EDUCATOR"
          fallback={<span data-testid="no-permission-alert">Sem permissão</span>}
        >
          <button data-testid="delete-learner-btn">Excluir Educando</button>
        </Can>,
      );

      expect(screen.queryByTestId('delete-learner-btn')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-permission-alert')).toBeInTheDocument();
    });

    it('works with RequirePermission alias', () => {
      render(
        <RequirePermission action="log_learning" role="EDUCATOR">
          <button data-testid="log-learning-btn">Registrar Aprendizado</button>
        </RequirePermission>,
      );

      expect(screen.getByTestId('log-learning-btn')).toBeInTheDocument();
    });

    it('reads role from AuthProvider if role prop is omitted', () => {
      render(
        <AuthProvider initialRole="CO_GUARDIAN">
          <Can action="delete_family">
            <button data-testid="delete-family-btn">Excluir Família</button>
          </Can>
          <Can action="edit_family_settings">
            <button data-testid="edit-settings-btn">Editar Configurações</button>
          </Can>
        </AuthProvider>,
      );

      expect(screen.queryByTestId('delete-family-btn')).not.toBeInTheDocument();
      expect(screen.getByTestId('edit-settings-btn')).toBeInTheDocument();
    });
  });

  describe('<RoleBadge /> Component', () => {
    it('renders proper label and styling for OWNER_GUARDIAN', () => {
      render(<RoleBadge role="OWNER_GUARDIAN" />);

      const badge = screen.getByTestId('role-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(ROLE_LABELS.OWNER_GUARDIAN);
      expect(badge).toHaveAttribute('data-role', 'OWNER_GUARDIAN');
      expect(badge.style.backgroundColor).toBeTruthy();
      expect(badge.style.color).toBeTruthy();
    });

    it('renders correct labels for all family roles', () => {
      const roles: FamilyRole[] = [
        'OWNER_GUARDIAN',
        'GUARDIAN',
        'CO_GUARDIAN',
        'EDUCATOR',
      ];

      for (const role of roles) {
        cleanup();
        render(<RoleBadge role={role} />);
        const badge = screen.getByTestId('role-badge');
        expect(badge).toHaveTextContent(ROLE_LABELS[role]);
      }
    });

    it('renders null when role is not provided', () => {
      const { container } = render(<RoleBadge role={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('supports custom size and custom className/style', () => {
      render(
        <RoleBadge
          role="EDUCATOR"
          size="lg"
          className="custom-badge-class"
          style={{ margin: '8px' }}
        />,
      );

      const badge = screen.getByTestId('role-badge');
      expect(badge).toHaveClass('custom-badge-class');
      expect(badge.style.margin).toBe('8px');
    });
  });
});
