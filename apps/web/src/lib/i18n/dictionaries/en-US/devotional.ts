export const devotional = {
  page: {
    title: 'Family Devotional & Worship',
    subtitle: 'Cultivate faith as a family through Scripture reading, reflection, praise, and daily prayer.',
    errors: {
      loadDevotional: 'Could not load devotional for the day.',
      loadDevotionalConnection: 'Could not load devotional for the day. Please check your connection.',
      loadPrayers: 'Could not load prayer journal.',
      loadPrayersConnection: 'Could not load prayer journal. Please check your connection.',
      familyUnauthenticated: 'Family not authenticated',
      saveDevotional: 'Failed to save devotional.',
      savePrayer: 'Failed to save prayer request.',
      answerPrayer: 'Failed to mark prayer as answered.',
      archivePrayer: 'Failed to archive prayer.',
    },
  },
  comparator: {
    backLink: '← Back to Family Devotional',
    kicker: 'Holy Scriptures • Trinity Grove',
    title: 'Bible Translation Comparator',
    subtitle: 'Examine and compare the Word of God side by side across classic and contemporary translations to enrich study and family worship.',
  },
  view: {
    nav: {
      yesterday: '← Yesterday',
      today: 'Today',
      tomorrow: 'Tomorrow →',
      compareTranslations: 'Compare Translations 📖',
    },
    actions: {
      create: 'Create Devotional',
      edit: 'Edit Devotional',
    },
    empty: {
      title: 'No devotional recorded for this date ({date})',
      description: 'Gather the family around God’s Word. Record read passages, reflections, and today’s prayers.',
      action: 'Create Today’s Devotional',
    },
    badges: {
      covenantReading: 'Scripture Reading & Covenant',
      version: 'Version: {version}',
    },
    reflection: {
      header: 'Family Reflection & Discussion',
      questionsTitle: 'Family Discussion Questions:',
    },
    memoryVerse: {
      badge: 'Memory Verse',
    },
    hymn: {
      badge: 'Hymn / Praise Song of the Day',
    },
    practicalApplication: {
      badge: 'Practical Application',
    },
  },
  form: {
    titles: {
      new: 'New Daily Devotional',
      edit: 'Edit Devotional',
    },
    actions: {
      cancel: 'Cancel',
      create: 'Create Devotional',
      save: 'Save Changes',
      lookupScripture: 'Fetch YouVersion Scripture',
    },
    labels: {
      date: 'Date *',
      bibleVersion: 'Bible Version',
      bibleReference: 'Bible Reference *',
      passageText: 'Passage Text',
      reflection: 'Reflection / Family Commentary',
      memoryVerse: 'Memory Verse',
      hymn: 'Hymn / Song',
      discussionQuestions: 'Discussion Questions / Catechesis',
      practicalApplication: 'Practical Application',
    },
    placeholders: {
      bibleReference: 'e.g. Psalm 23:1-6, John 3:16...',
      passageText: 'Paste or fetch Scripture passage reading...',
      reflection: 'Main reflection, context, and family takeaways...',
      memoryVerse: 'e.g. I have hidden your word in my heart...',
      hymn: 'e.g. A Mighty Fortress, Amazing Grace...',
      discussionQuestions: '1. What does this text teach us about God?\n2. How can we practice this today?',
      practicalApplication: 'Concrete actions, attitudes of love and service for today...',
    },
    errors: {
      referenceRequired: 'Please provide a Bible reference to fetch (e.g., John 3:16 or Psalm 23).',
      familyUnauthenticated: 'Family not authenticated.',
      lookupFailed: 'Could not fetch Bible text. Please enter it manually.',
      lookupNotFound: 'No text found for this reference in this version. Try another version or enter it manually.',
      lookupGeneric: 'Error fetching Bible text.',
      requiredFields: 'Date and Bible Reference are required.',
      saveFailed: 'Failed to save devotional.',
    },
  },
  prayer: {
    header: {
      title: 'Family Prayer Journal',
      answeredCount: '{count} answered',
      subtitle: 'Intercessions, active petitions, and testimonies of prayers answered by the Lord.',
    },
    actions: {
      new: '+ New Prayer',
      markAnswered: 'Mark as Answered',
      archive: 'Archive',
    },
    celebration: {
      title: 'Answered Prayer Celebration!',
      subtitle: 'God has been faithful in hearing your family’s prayers. Share the testimony!',
    },
    tabs: {
      petitions: 'Prayer Petitions',
      gratitudes: 'Praise & Thanksgiving',
    },
    empty: {
      petitionsTitle: 'No active prayer petitions at this time.',
      gratitudesTitle: 'No praise or thanksgiving recorded yet.',
      description: 'Add a new request so everyone can pray together.',
    },
    card: {
      answeredBadge: 'Answered!',
      inPrayerBadge: 'In Prayer',
      gratitudeBadge: 'Thanksgiving',
      testimonyLabel: 'Testimony / Answer:',
    },
    modalAnswer: {
      title: 'Mark Prayer as Answered',
      description: 'Would you like to record a testimony or note of how God answered this prayer in your family?',
      label: 'Thanksgiving Note / Testimony',
      placeholder: 'e.g. God provided for our need through...',
      cancel: 'Cancel',
      confirm: 'Confirm Answer',
    },
    modalCreate: {
      petitionTitle: 'New Prayer Petition',
      gratitudeTitle: 'New Praise / Thanksgiving',
      typeLabel: 'Type',
      petitionOption: 'Prayer Petition (Intercession)',
      gratitudeOption: 'Praise / Thanksgiving (Thanksgiving)',
      titleLabel: 'Title *',
      petitionTitlePlaceholder: 'e.g. Grandma’s health',
      gratitudeTitlePlaceholder: 'e.g. Blessing at work',
      detailsLabel: 'Details / Requests',
      detailsPlaceholder: 'Describe details for family prayer...',
      cancel: 'Cancel',
      save: 'Save',
    },
    errors: {
      titleRequired: 'The request/praise title is required.',
      saveFailed: 'Failed to save prayer.',
      archiveFailed: 'Failed to archive prayer.',
    },
  },
  comparatorView: {
    labels: {
      bibleReference: 'Bible Reference',
    },
    placeholders: {
      bibleReference: 'e.g. John 1:1, Psalm 23:1, Romans 8:28...',
    },
    actions: {
      compare: 'Compare Translations',
    },
    quickSuggestions: 'Quick suggestions:',
    translationsLabel: 'Translations for Comparison:',
    loading: {
      title: 'Querying Bible translations...',
      description: 'Fetching passages and aligning versions side by side.',
    },
    empty: {
      title: 'Choose a passage to compare',
      description: 'Type the desired reference or use one of the quick suggestions above to view and compare different translations side by side with the family.',
    },
    results: {
      comparisonTitle: 'Comparison: {reference}',
      displayedCount: '{count} translation displayed',
      displayedCountPlural: '{count} translations displayed',
      textUnavailable: 'Text not available for this reference.',
    },
    errors: {
      emptyReference: 'Please provide a Bible reference (e.g. John 3:16).',
      noTranslations: 'Select at least one Bible translation to compare.',
      noFamily: 'Active family not found. Please select a family before comparing.',
      loadFailed: 'Could not load comparison for the requested reference.',
      generic: 'Error comparing Bible translations.',
    },
  },
} as const;
