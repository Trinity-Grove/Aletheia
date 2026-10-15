export const attendance = {
  page: {
    title: 'Attendance and study hours',
    subtitle: 'Track study days and each learner’s hours throughout the year.',
    loading: 'Loading attendance tracking...',
    errorLog: 'Failed to log attendance',
    errorBulkLog: 'Failed to log collective attendance',
  },
  status: {
    present: 'Present',
    absent: 'Absent',
    partial: 'Partial',
    excused: 'Excused',
    holiday: 'Holiday / Break',
  },
  tracking: {
    logAttendance: 'Log Attendance',
    bulkLog: 'Bulk Log',
    schoolDays: 'School Days',
    hoursLogged: 'Hours Logged',
    complianceGoal: 'Compliance Goal',
    yearProgress: 'School Year Progress',
  },
} as const;
