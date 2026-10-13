export const dashboard = {
  gettingStarted: {
    title: 'Getting Started with Aletheia',
    subtitle: "Complete these 4 essential milestones to set up your family's classical education.",
    progress: '{completed} of {total} completed',
    dismiss: 'Dismiss guide',
    steps: {
      createLearner: {
        title: 'Register Learner',
        description: "Add your family's learners with their developmental stages.",
        action: 'Go to Learners',
      },
      chooseCurriculum: {
        title: 'Set Curriculum',
        description: 'Choose curriculum plans, subjects, or learning objectives.',
        action: 'Explore Curriculum',
      },
      scheduleLesson: {
        title: 'Schedule First Lesson',
        description: 'Organize weekly routine or plan a lesson on the daily schedule.',
        action: 'Open Schedule',
      },
      completeFirstActivity: {
        title: 'Complete First Activity',
        description: 'Execute and complete the first lesson with reflection or pedagogical notes.',
        action: 'Student Portal',
      },
    },
  },
  tour: {
    welcome: {
      title: 'Welcome to Aletheia!',
      subtitle: 'Would you like a quick guided tour of the system’s main features?',
      start: 'Start Guided Tour (3 min)',
      dismissNever: "Skip and don't show again",
    },
    steps: {
      step1: {
        title: 'Navigation & Modules',
        description: 'Access Learners, Curriculum, Weekly Schedule, Learning Journal, Photographic Portfolio, and Structured Reports.',
      },
      step2: {
        title: 'Learner Focus',
        description: 'Easily switch between tracking each child individually or viewing the consolidated family overview.',
      },
      step3: {
        title: 'Scripture & Devotional',
        description: 'Daily spiritual inspiration with prayer records and family biblical reflections.',
      },
      step4: {
        title: 'Daily Journey & Activities',
        description: 'Track instruction time in real time and complete lessons with reflective records.',
      },
      step5: {
        title: 'All Set to Begin!',
        description: "You've explored the main highlights of Aletheia. Congratulations on beginning this educational journey!",
      },
    },
    controls: {
      next: 'Next',
      prev: 'Previous',
      skip: 'Skip and exit',
      finish: 'Finish Tour',
      stepIndicator: 'Step {current} of {total}',
    },
    startTourNav: 'Take System Tour',
  },
} as const;
