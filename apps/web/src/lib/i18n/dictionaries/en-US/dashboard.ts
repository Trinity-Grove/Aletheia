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
} as const;
