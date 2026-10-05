export const attendance = {
  page: {
    title: 'Control de Asistencia y Conformidad Legal',
    subtitle: 'Acompañe los días lectivos y horas anuales de los educandos sin comparaciones entre hermanos.',
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
    bulkLog: 'Registro Coletivo',
    schoolDays: 'Días Lectivos',
    hoursLogged: 'Horas Registradas',
    complianceGoal: 'Meta de Conformidad',
    yearProgress: 'Progreso del Año Lectivo',
  },
} as const;
