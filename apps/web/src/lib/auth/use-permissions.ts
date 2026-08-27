import type { FamilyRole } from '@aletheia/contracts';
import { useAuthRole } from './rbac-context';

export type PermissionAction =
  | 'delete_learner'
  | 'delete_learners'
  | 'create_learner'
  | 'create_learners'
  | 'manage_learner'
  | 'manage_learners'
  | 'edit_learner'
  | 'edit_learners'
  | 'edit_family_settings'
  | 'edit_settings'
  | 'invite_members'
  | 'invite_member'
  | 'invite_guardian'
  | 'delete_family'
  | 'log_learning'
  | 'log_record'
  | 'generate_transcripts'
  | 'generate_transcript'
  | 'manage_attendance'
  | 'manage_lessons'
  | 'manage_lesson'
  | 'create_lesson'
  | 'log_attendance'
  | 'manage_devotional'
  | 'manage_curriculum'
  | 'upload_portfolio_items'
  | 'upload_portfolio_item'
  | 'upload_portfolio'
  | 'manage_portfolio'
  | 'export_family_data'
  | 'export_data'
  | 'modify_compliance_targets'
  | 'modify_compliance_target';

export interface RbacPermissions {
  role: FamilyRole | null;
  canDeleteLearners: boolean;
  canManageLearners: boolean;
  canCreateLearners: boolean;
  canEditFamilySettings: boolean;
  canInviteMembers: boolean;
  canDeleteFamily: boolean;
  canLogLearning: boolean;
  canGenerateTranscripts: boolean;
  canManageAttendance: boolean;
  canManageLessons: boolean;
  canManageDevotional: boolean;
  canManageCurriculum: boolean;
  canLogAttendance: boolean;
  canUploadPortfolioItems: boolean;
  canManagePortfolio: boolean;
  canExportFamilyData: boolean;
  canModifyComplianceTargets: boolean;

  // Property aliases
  delete_learner: boolean;
  delete_learners: boolean;
  create_learner: boolean;
  manage_learners: boolean;
  edit_learner: boolean;
  edit_family_settings: boolean;
  edit_settings: boolean;
  invite_members: boolean;
  delete_family: boolean;
  log_learning: boolean;
  generate_transcripts: boolean;
  manage_attendance: boolean;
  manage_lessons: boolean;
  manage_devotional: boolean;
  manage_curriculum: boolean;
  log_attendance: boolean;
  upload_portfolio_items: boolean;
  manage_portfolio: boolean;
  export_family_data: boolean;
  modify_compliance_targets: boolean;

  can: (action: PermissionAction | string) => boolean;
}

export function hasPermission(
  role: FamilyRole | null | undefined,
  action: PermissionAction | string,
): boolean {
  if (!role) return false;
  const normalizedAction = action.toLowerCase().replace(/-/g, '_').trim();

  switch (normalizedAction) {
    case 'delete_learner':
    case 'delete_learners':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'create_learner':
    case 'create_learners':
    case 'manage_learner':
    case 'manage_learners':
    case 'edit_learner':
    case 'edit_learners':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'edit_family_settings':
    case 'edit_settings':
    case 'edit_family':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'invite_members':
    case 'invite_member':
    case 'invite_guardian':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'delete_family':
      return role === 'OWNER_GUARDIAN';

    case 'log_learning':
    case 'log_record':
    case 'create_record':
      return (
        role === 'OWNER_GUARDIAN' ||
        role === 'GUARDIAN' ||
        role === 'CO_GUARDIAN' ||
        role === 'EDUCATOR'
      );

    case 'generate_transcripts':
    case 'generate_transcript':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'manage_attendance':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'manage_lessons':
    case 'manage_lesson':
    case 'create_lesson':
      return (
        role === 'OWNER_GUARDIAN' ||
        role === 'GUARDIAN' ||
        role === 'CO_GUARDIAN' ||
        role === 'EDUCATOR'
      );

    case 'manage_devotional':
    case 'manage_devotionals':
    case 'create_prayer':
    case 'manage_prayers':
      return (
        role === 'OWNER_GUARDIAN' ||
        role === 'GUARDIAN' ||
        role === 'CO_GUARDIAN' ||
        role === 'EDUCATOR'
      );

    case 'manage_curriculum':
    case 'create_subject':
    case 'create_objective':
      return (
        role === 'OWNER_GUARDIAN' ||
        role === 'GUARDIAN' ||
        role === 'CO_GUARDIAN' ||
        role === 'EDUCATOR'
      );

    case 'log_attendance':
    case 'record_attendance':
      return (
        role === 'OWNER_GUARDIAN' ||
        role === 'GUARDIAN' ||
        role === 'CO_GUARDIAN' ||
        role === 'EDUCATOR'
      );

    case 'upload_portfolio_items':
    case 'upload_portfolio_item':
    case 'upload_portfolio':
    case 'manage_portfolio':
      return (
        role === 'OWNER_GUARDIAN' ||
        role === 'GUARDIAN' ||
        role === 'CO_GUARDIAN' ||
        role === 'EDUCATOR'
      );

    case 'export_family_data':
    case 'export_data':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    case 'modify_compliance_targets':
    case 'modify_compliance_target':
      return role === 'OWNER_GUARDIAN' || role === 'GUARDIAN' || role === 'CO_GUARDIAN';

    default:
      return false;
  }
}

export function getPermissions(role: FamilyRole | null | undefined): RbacPermissions {
  const isOwner = role === 'OWNER_GUARDIAN';
  const isGuardianOrOwner = isOwner || role === 'GUARDIAN' || role === 'CO_GUARDIAN';
  const isAnyActiveRole = isGuardianOrOwner || role === 'EDUCATOR';

  const canDeleteLearners = isGuardianOrOwner;
  const canManageLearners = isGuardianOrOwner;
  const canCreateLearners = isGuardianOrOwner;
  const canEditFamilySettings = isGuardianOrOwner;
  const canInviteMembers = isGuardianOrOwner;
  const canDeleteFamily = isOwner;
  const canLogLearning = isAnyActiveRole;
  const canGenerateTranscripts = isGuardianOrOwner;
  const canManageAttendance = isGuardianOrOwner;
  const canManageLessons = isAnyActiveRole;
  const canManageDevotional = isAnyActiveRole;
  const canManageCurriculum = isAnyActiveRole;
  const canLogAttendance = isAnyActiveRole;
  const canUploadPortfolioItems = isAnyActiveRole;
  const canManagePortfolio = isAnyActiveRole;
  const canExportFamilyData = isGuardianOrOwner;
  const canModifyComplianceTargets = isGuardianOrOwner;

  return {
    role: role ?? null,
    canDeleteLearners,
    canManageLearners,
    canCreateLearners,
    canEditFamilySettings,
    canInviteMembers,
    canDeleteFamily,
    canLogLearning,
    canGenerateTranscripts,
    canManageAttendance,
    canManageLessons,
    canManageDevotional,
    canManageCurriculum,
    canLogAttendance,
    canUploadPortfolioItems,
    canManagePortfolio,
    canExportFamilyData,
    canModifyComplianceTargets,

    delete_learner: canDeleteLearners,
    delete_learners: canDeleteLearners,
    create_learner: canCreateLearners,
    manage_learners: canManageLearners,
    edit_learner: canManageLearners,
    edit_family_settings: canEditFamilySettings,
    edit_settings: canEditFamilySettings,
    invite_members: canInviteMembers,
    delete_family: canDeleteFamily,
    log_learning: canLogLearning,
    generate_transcripts: canGenerateTranscripts,
    manage_attendance: canManageAttendance,
    manage_lessons: canManageLessons,
    manage_devotional: canManageDevotional,
    manage_curriculum: canManageCurriculum,
    log_attendance: canLogAttendance,
    upload_portfolio_items: canUploadPortfolioItems,
    manage_portfolio: canManagePortfolio,
    export_family_data: canExportFamilyData,
    modify_compliance_targets: canModifyComplianceTargets,

    can: (action: PermissionAction | string) => hasPermission(role, action),
  };
}

export function usePermissions(overrideRole?: FamilyRole | null): RbacPermissions {
  const authContext = useAuthRole();
  const effectiveRole = overrideRole !== undefined ? overrideRole : authContext?.role ?? null;
  return getPermissions(effectiveRole);
}
