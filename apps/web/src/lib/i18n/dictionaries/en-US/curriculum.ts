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
    admin: {
      title: 'Platform Moderation Dashboard',
      subtitle: 'Manage submitted curriculum packs and resolve community reports.',
      tabQueue: 'Moderation Queue ({count})',
      tabReports: 'Community Reports ({count})',
      queueEmpty: 'No packs currently pending moderation.',
      reportsEmpty: 'No reports found for the selected filter.',
      colPack: 'Curriculum Pack',
      colAuthor: 'Author & Trust',
      colStatus: 'Current Status',
      colReports: 'Open Reports',
      colActions: 'Actions',
      colReporter: 'Reporting Family',
      colReason: 'Reason',
      colDetails: 'Details',
      colDate: 'Date',
      filterAll: 'All',
      filterOpen: 'Open',
      filterUpheld: 'Upheld',
      filterDismissed: 'Dismissed',
      actionApprove: 'Approve',
      actionReject: 'Reject',
      actionSuspend: 'Suspend',
      actionRestore: 'Restore',
      actionUpheld: 'Upheld',
      actionDismissed: 'Dismissed',
      modalNotesLabel: 'Moderation Notes / Justification',
      modalNotesPlaceholder: 'Enter an observation or justification (optional)...',
      confirmTitle: 'Confirm Moderation Action',
      confirmMsg: 'Are you sure you want to apply this action?',
      confirmBtn: 'Confirm',
      cancelBtn: 'Cancel',
      successPackModerated: 'Action applied to pack successfully.',
      successReportResolved: 'Report resolved successfully.',
      errorGeneric: 'An error occurred while processing the request.',
      unauthorizedMessage: 'Access restricted to platform administrators.',
    },
  },
  community: {
    publishBtn: 'Publish to Community 🌍',
    publishModalTitle: 'Publish Pack to Community',
    publishModalDescription:
      'This creates a new community pack from your customized version, with its own code — it does not change the original pack.',
    codeLabel: 'Pack Code',
    codePlaceholder: 'MY_FAMILY_PACK',
    codeHelp: 'Uppercase letters, numbers, "_" or "." — must be unique.',
    nameLabel: 'Pack Name',
    namePlaceholder: 'My Family Pack',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'Describe what makes this pack special...',
    cancelBtn: 'Cancel',
    submitBtn: 'Publish',
    submittingBtn: 'Publishing...',
    publishSuccessMsg: 'Pack published as a draft. Track it under "My Community Packs".',
    publishConflictMsg: 'A pack with that code already exists. Choose another.',
    publishErrorMsg: 'Failed to publish the pack. Please try again later.',
    tabCatalog: 'Catalog',
    tabMyPacks: 'My Community Packs',
    myPacksEmpty: 'You have not published any community packs yet.',
    myPacksLoadError: 'Failed to load your community packs.',
    statusDraft: 'Draft',
    statusPendingReview: 'Under Review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusSuspended: 'Suspended',
    moderationNotesLabel: 'Moderation note:',
    submitForReviewBtn: 'Submit for Review',
    submittingForReviewBtn: 'Submitting...',
    submitForReviewSuccessMsg: 'Pack submitted for platform review.',
    submitForReviewErrorMsg: 'Failed to submit for review. Please try again later.',
  },
  seminary: {
    backToCurriculum: 'Back to Curriculum',
    title: 'Advanced Seminary Theology Module',
    subtitle:
      'Rigorous graduate-level theological training covering 4 concentration cycles, 24 curricular disciplines, and confessional grounding.',
    cycleLabel: 'Cycle {cycle}',
    cycles: {
      cycle1Title: 'Cycle I: Foundations & Method',
      cycle1Description:
        'Bibliological, hermeneutical, exegetical foundations and biblical theology of redemption.',
      cycle2Title: 'Cycle II: Systematic Theology I',
      cycle2Description:
        'Theology Proper, Trinity, Anthropology, Hamartiology, Christology, Pneumatology and Angelology.',
      cycle3Title: 'Cycle III: Systematic Theology II',
      cycle3Description:
        'Soteriology, Ecclesiology, Comparative Eschatology with the 4 millennial schools, Interpretive Models of Revelation and Individual & General Eschatology.',
      cycle4Title: 'Cycle IV: Historical Theology, Thought & Practice',
      cycle4Description:
        'Patristics, Historic Ecumenical Councils, Protestant Reformation, Denominational History, Historical Theology, Christian Apologetics, Philosophy of Religion, Christian Ethics and Missiology.',
    },
    disciplineCount: '{count} disciplines',
    competencyLabel: 'Competency',
    topicsLabel: 'Syllabus & Core Topics',
    readingsLabel: 'Bibliography & Primary Readings',
    suggestedEvidenceLabel: 'Suggested Assessment Formats',
    lensTitle: 'Contextual Confessional Lens',
    lensDescription:
      'Primary sources, historical confessions, and creeds aligned with the family’s preferred tradition, upholding academic integrity.',
    traditionLabel: 'Confessional Tradition:',
    sourcesLabel: 'Documents & Primary Sources:',
    submitPaperBtn: 'Submit Academic Paper',
    eschatologySchoolsTitle: 'Comparative Eschatology: The 4 Millennial Schools',
    eschatologySchoolsDescription:
      'Exegetical and historical comparative overview of the primary interpretations of Revelation 20:',
    millennialSchools: {
      historicPremillennialism: 'Historic Premillennialism',
      historicPremillennialismDesc:
        'Visible Parousia of Christ prior to an earthly millennium, inaugural resurrection of the saints, and historical fulfillment of prophecy.',
      dispensationalPremillennialism: 'Dispensational Premillennialism',
      dispensationalPremillennialismDesc:
        'Strict distinction between Israel and the Church, pretribulational rapture, Daniel’s 70th week, and literal thousand-year reign.',
      amillennialism: 'Amillennialism',
      amillennialismDesc:
        'The millennium as Christ’s present heavenly rule and the Church age between the two advents, culminating in general resurrection.',
      postmillennialism: 'Postmillennialism',
      postmillennialismDesc:
        'Progressive victory and expansion of the Kingdom of God and the Gospel throughout human history before Christ’s consummating return.',
    },
    apocalypseModelsTitle: 'Interpretive Models of the Book of Revelation',
    apocalypseModelsDescription:
      'The four major historical hermeneutical approaches to the Johannine text:',
    apocalypseModels: {
      preterist: 'Preterist',
      preteristDesc:
        'Understands the prophecies of Revelation as primarily fulfilled in the first century, culminating in the fall of Jerusalem in AD 70.',
      historicist: 'Historicist',
      historicistDesc:
        'Interprets Revelation as a continuous prophetic forecast of western Church history from the apostolic era to the consummation.',
      idealist: 'Idealist',
      idealistDesc:
        'Emphasizes ongoing spiritual principles and the perennial cosmic battle between good and evil, without fixing symbols to specific historical chronology.',
      futurist: 'Futurist',
      futuristDesc:
        'Considers the majority of prophetic visions (especially from chapter 4 onward) to be fulfilled in the final end-time period leading up to the Parousia.',
    },
    lensTraditions: {
      reformed: 'Reformed / Presbyterian Tradition',
      reformedSummary:
        'Emphasis on covenant theology, divine sovereignty, historical confessionalism, and the primacy of biblical authority.',
      reformedSources:
        'Westminster Confession of Faith, Westminster Larger and Shorter Catechisms, Heidelberg Catechism, Canons of Dort, Second Helvetic Confession.',
      baptist: 'Confessional Baptist Tradition',
      baptistSummary:
        'Affirmation of believer’s baptism (credobaptism), congregational polity, universal priesthood of believers, and religious liberty.',
      baptistSources:
        '1689 London Baptist Confession of Faith (Second London), New Hampshire Confession of Faith, Baptist Faith and Message.',
      lutheran: 'Lutheran Tradition',
      lutheranSummary:
        'Distinction between Law and Gospel, forensic justification by faith alone, and the sacramental doctrine of the Real Presence in the Lord’s Supper.',
      lutheranSources:
        'Augsburg Confession (1530), Luther’s Small and Large Catechisms, Book of Concord (1580).',
      wesleyanArminian: 'Wesleyan-Arminian / Methodist Tradition',
      wesleyanArminianSummary:
        'Universal prevenient grace, restored free will, the call to entire sanctification, and Christian perfection in love.',
      wesleyanArminianSources:
        '25 Articles of Religion, John Wesley’s Standard Sermons, John Wesley’s Explanatory Notes Upon the New Testament.',
      pentecostal: 'Pentecostal / Charismatic Tradition',
      pentecostalSummary:
        'Baptism in the Holy Spirit subsequent to regeneration, marked by the empowerment and contemporary manifestation of spiritual gifts for mission.',
      pentecostalSources:
        'Statement of Fundamental Truths of the Assemblies of God, Azusa Street Historical Documents, Lausanne Movement Statement on the Holy Spirit.',
      ecumenical: 'Ecumenical Comparative Lens (General Historical Survey)',
      ecumenicalSummary:
        'Broad academic survey of historic Christian traditions, preserving exegetical rigor and the principle of hermeneutical charity.',
      ecumenicalSources:
        'Apostles’ Creed, Nicene-Constantinopolitan Creed, Athanasian Creed, Chalcedonian Definition, and ecumenical patristic consensus.',
    },
  },
};
