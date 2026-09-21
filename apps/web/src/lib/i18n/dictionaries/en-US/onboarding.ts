import type { Dictionary } from '../pt-BR';

export const onboarding: Dictionary['onboarding'] = {
  hero: {
    badge: 'Sovereign Foundation',
    title: 'Education with Roots, Faith, and Excellence.',
    subtitle: 'The home is the first and most formative school. Aletheia equips parents to lead with authority, clarity, and faithfulness.',
    quote: '“Train up a child in the way he should go: and when he is old, he will not depart from it.”',
    quoteAuthor: 'Proverbs 22:6',
    isolationFooter: 'Per-family isolated environment with full sovereignty over your educational records.',
    ariaLabel: 'Aletheia Overview',
  },
  wizard: {
    stepIndicator: 'Step 1 of 2 • Family Core',
    welcomeTitle: 'Welcome to Aletheia!',
    welcomeSubtitle: 'Let us set up the sovereign family core for your educational journey.',
    familyNameLabel: 'Family or Core Name',
    familyNamePlaceholder: 'e.g. Oliveira Family',
    familyNameHint: 'Identifies your family in official reports, transcripts, and certificates.',
    countryLabel: 'Country of Residence (ISO-3)',
    countryHint: 'Sets the default regulatory jurisdiction for meeting legal requirements.',
    stateLabel: 'State / Province (Optional)',
    statePlaceholder: 'e.g. FL',
    stateHint: 'Used to align curriculum frameworks and regional legal standards.',
    submitButton: 'Create and Begin',
    submittingButton: 'Creating...',
    errorCreateFamily: 'Failed to create family. Please try again.',
  },
};
