export const legalGuide = {
  header: {
    title: 'Legal guide and getting started',
    subtitle: "Understand important records and organize your family's first days in Aletheia.",
    jurisdictionBadge: 'Active Jurisdiction: {name}',
    confidenceLabel: 'Confidence Level: {level}',
  },
  framework: {
    title: 'Your Rights & Constitutional Protection',
    description: 'Homeschooling is rooted in the primacy of the family over education and recognized legal precedents affirming the lawfulness of home education and the absence of intellectual abandonment when regular instruction and care are provided.',
    minDaysLabel: 'Minimum School Days Goal',
    minDaysValue: '{count} days',
    minHoursLabel: 'Minimum Annual Instructional Hours',
    minHoursValue: '{count} hours',
    officialSourceLabel: 'Official Source & Legislation',
    legalNotice: 'Aletheia supports thorough recordkeeping and compliance for your family, but this guide is for educational purposes and does not replace individualized legal advice.',
  },
  evidence: {
    title: 'How to Protect Yourself with Learning Evidence',
    description: 'The greatest legal safeguard for homeschooling families is tangible proof. Daily lesson logs, activity photos, completed readings, and attendance records demonstrate pedagogical diligence before any inspection.',
    dossierAction: 'Issue Annual Compliance Dossier',
    dossierHint: 'Generate the consolidated report with a verifiable hash in the Reports tab.',
  },
  checklist: {
    title: 'First 30 Days Checklist',
    subtitle: 'Fundamental steps to structure your study routine with confidence and legal grounding.',
    progress: '{completed} of {total} steps completed ({percentage}%)',
    steps: {
      step1: {
        title: '1. Register your first learner',
        description: "Add your child's details, age, and developmental stage.",
        action: 'Go to Learners',
      },
      step2: {
        title: '2. Set pedagogical profile or curriculum grid',
        description: 'Choose a pedagogical approach (Classical, Charlotte Mason, etc.) or adopt a subject package.',
        action: 'Explore Curricula',
      },
      step3: {
        title: '3. Set up the weekly study routine',
        description: 'Distribute balanced time blocks between lessons, reading, and hands-on activities.',
        action: 'Configure Schedule',
      },
      step4: {
        title: '4. Log the 1st activity with evidence',
        description: 'Complete a lesson or attach a photo/note in the Learning Journal.',
        action: 'Open Journal',
      },
      step5: {
        title: '5. Establish the daily devotional time',
        description: 'Cultivate the habit of daily Bible reading and family reflection.',
        action: 'Access Devotional',
      },
      step6: {
        title: '6. View learning report preview',
        description: "Check how Aletheia automatically organizes your child's attendance and progress.",
        action: 'View Reports',
      },
    },
  },
  faq: {
    title: 'Frequently Asked Questions (Legal FAQ)',
    q1: {
      question: 'Is homeschooling illegal or considered a crime in Brazil?',
      answer: 'No. The Brazilian Supreme Federal Court (STF), in the ruling of Extraordinary Appeal 888.815, established that homeschooling is not prohibited by the Federal Constitution and does not constitute the crime of intellectual abandonment (Article 246 of the Penal Code), as long as parents prove the child is receiving effective instruction.',
    },
    q2: {
      question: 'What should we do if notified by the Guardianship Council or Public Prosecutor?',
      answer: 'Stay calm and present a courteous, formal response accompanied by your Aletheia Learning Dossier. Demonstrate the study plan, attendance records, sample activities, and the cognitive and emotional progress of the learners.',
    },
    q3: {
      question: 'How can attendance and learning be demonstrated to the authorities?',
      answer: 'Use the Reports tab in Aletheia to export the Annual Compliance Report and Portfolio. It aggregates dates, hours, achieved objectives, and a cryptographic verification code for the document.',
    },
    q4: {
      question: 'Can the learner return to regular school or enter higher education in the future?',
      answer: 'Yes. National educational frameworks guarantee learners the right to placement evaluations at any receiving school to be enrolled at their appropriate grade level. For higher education, learners can take standard national admissions exams or equivalency evaluations.',
    },
  },
} as const;
