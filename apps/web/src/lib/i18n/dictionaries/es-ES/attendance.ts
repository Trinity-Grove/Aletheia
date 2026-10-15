export const attendance = {
  page: {
    title: 'Asistencia y horas de estudio',
    subtitle: 'Acompañe los días estudiados y las horas de cada estudiante durante el año.',
    loading: 'Cargando control de asistencia...',
    errorLog: 'Error al registrar asistencia',
    errorBulkLog: 'Error al registrar asistencia colectiva',
  },
  status: {
    present: 'Presente',
    absent: 'Ausente',
    partial: 'Parcial',
    excused: 'Justificado',
    holiday: 'Feriado / Receso',
  },
  tracking: {
    logAttendance: 'Registrar Asistencia',
    bulkLog: 'Registro Colectivo',
    schoolDays: 'Días Lectivos',
    hoursLogged: 'Horas Registradas',
    complianceGoal: 'Meta de Conformidad',
    yearProgress: 'Progreso del Año Lectivo',
  },
} as const;
