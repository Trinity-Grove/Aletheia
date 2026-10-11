export const dashboard = {
  gettingStarted: {
    title: 'Primeros Pasos en Aletheia',
    subtitle: 'Complete estos 4 hitos esenciales para estructurar la educación clásica de su familia.',
    progress: '{completed} de {total} completados',
    dismiss: 'Ocultar guía',
    steps: {
      createLearner: {
        title: 'Registrar Educando',
        description: 'Añada los educandos de su núcleo familiar con sus etapas de desarrollo.',
        action: 'Ir a Educandos',
      },
      chooseCurriculum: {
        title: 'Definir Currículo',
        description: 'Elija planes curriculares, asignaturas u objetivos de aprendizaje.',
        action: 'Explorar Currículo',
      },
      scheduleLesson: {
        title: 'Programar Primera Lección',
        description: 'Organice el horario semanal o planifique una lección en el cronograma diario.',
        action: 'Abrir Horario',
      },
      completeFirstActivity: {
        title: 'Completar Primera Actividad',
        description: 'Realice y complete la primera lección con reflexión o notas pedagógicas.',
        action: 'Portal del Alumno',
      },
    },
  },
} as const;
