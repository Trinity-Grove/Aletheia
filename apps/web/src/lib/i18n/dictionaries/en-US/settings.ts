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
} as const;
