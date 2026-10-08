export const settings = {
  pageTitle: 'Settings & Family Dashboard',
  pageDescription:
    'Manage pedagogical identity, daily liturgy preferences, security, and full sovereignty data backups.',
  loading: 'Loading settings...',
  groups: {
    family: 'Family & Liturgy',
    communication: 'Communication',
    security: 'Security & Sovereignty',
    community: 'Community',
  },
  tabs: {
    general: 'Identity & General',
    family: 'Family & Guardians',
    profile: 'Pedagogical & Theological Profile',
    notifications: 'Notifications & Reminders',
    account: 'Account & Security',
    privacy: 'Privacy & Compliance',
    backup: 'Backup & Sovereignty',
    support: 'Community Support',
  },
  badges: {
    mfaActive: '2FA Active',
    mfaRecommended: 'Recommended',
    backupReady: 'Ready',
    donor: 'Supporter',
  },
  activity: {
    emptyTitle: 'No activity recorded',
    emptyDesc:
      'Events such as login, password changes, and email updates will appear here.',
  },
  security: {
    currentPasswordLabel: 'Current password',
    newPasswordLabel: 'New password (minimum 8 characters)',
    confirmPasswordLabel: 'Confirm new password',
    newEmailLabel: 'New email',
  },
  backup: {
    familyData: 'Family Data & Settings',
    learnerProfiles: 'Learner Pedagogical Profiles',
    devotionalReadings: 'Readings & Devotional Journal',
    prayerRequests: 'Requests & Prayer Journal',
    academicYears: 'Academic Years, Subjects & Curricula',
    schedules: 'Schedules & Weekly Routines',
    learningRecords: 'Learning Records & Mastery',
    portfolioItems: 'Portfolio Items & Evidence',
    attendanceRecords: 'Daily Attendance Records',
    complianceGoals: 'Compliance Goals & History',
    formatJson: 'JSON (UTF-8)',
    guardiansOnlyNotice:
      'Only guardians have permission to download the full family backup.',
  },
  general: {
    readOnlyMode: 'Read-Only Mode:',
    familyNameLabel: 'Family Academy / Homeschool Name',
    familyNamePlaceholder: 'e.g., Silva Family Academy',
    familyNameHelper:
      'This name will be displayed in official transcript and academic report headers.',
    timezoneLabel: 'Time Zone',
    languageLabel: 'System Language',
    pedagogicalFrameworkLabel:
      'Pedagogical Framework & Standard Grading Scale',
  },
  members: {
    emailLabel: 'Email',
    roleLabel: 'Role in family',
  },
  mfaCard: {
    disabled: 'Disabled',
    confirmPasswordToEnable: 'Confirm your current password',
    qrAlt: 'Authenticator QR Code',
    generatingQr: 'Generating QR...',
    stepRecoveryCodes: '2. Recovery codes',
    stepEnterCode: '3. Enter the 6-digit code displayed by the app',
    active: 'Active',
    confirmPasswordToDisable: 'Confirm your current password to disable',
  },
  notificationsCard: {
    devotionalLabel: 'Family Devotional Reminder',
    scheduleLabel: 'Lesson Schedule Reminder',
    attendanceLabel: 'Pending Attendance Reminder',
    attendanceDesc:
      'Notify at the end of the day if any learners are missing attendance records.',
    inAppLabel: 'Browser / In-App Notifications',
    inAppDesc:
      'Display badge and notice counter on the top bar bell icon.',
    emailLabel: 'Email Summary and Notifications',
    emailDesc:
      'Receive important notices and answered prayers in parent email.',
  },
  profile: {
    loading: 'Loading profiles...',
    primaryModelLabel: 'Primary Pedagogical Model',
    secondaryModelLabel: 'Add secondary model',
    weightLabel: 'Weight (0-1)',
    theologyLabel: 'Preferred Theological Tradition',
  },
  privacy: {
    bannerTitle: 'Terms Update (LGPD):',
    consentDeclaration: 'Legal Consent Declaration:',
    attention: 'Attention:',
  },
} as const;
