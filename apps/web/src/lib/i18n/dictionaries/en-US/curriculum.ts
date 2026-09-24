import type { Dictionary } from '../pt-BR';

export const curriculum: Dictionary['curriculum'] = {
  moderation: {
    reportModalTitle: 'Report Curriculum Pack',
    reportBtn: 'Report Pack 🚩',
    reportBtnShort: 'Report',
    reasonLabel: 'Report Reason',
    reasons: {
      SPAM_COMMERCIAL: 'Spam or Commercial Content',
      HARMFUL_INAPPROPRIATE: 'Harmful or Inappropriate Content',
      COPYRIGHT_PLAGIARISM: 'Copyright Violation or Plagiarism',
      MALFORMED_QUALITY: 'Malformed Structure or Low Technical Quality',
      OTHER: 'Other Reason',
    },
    detailsLabel: 'Report Details (optional)',
    detailsPlaceholder: 'Describe in detail the issue observed in this pack...',
    cancelBtn: 'Cancel',
    submitReport: 'Submit Report',
    submittingReport: 'Submitting...',
    reportSuccessMsg: 'Report submitted to platform moderators.',
    reportConflictMsg: 'Your family has already reported this pack.',
    reportErrorMsg: 'Failed to submit report. Please try again later.',
    badgeNovice: 'Novice Author',
    badgeVerified: 'Verified Author',
    badgeTrusted: 'Trusted Author',
    scoreTooltip: 'Trust Score: {score}/100',
  },
};
