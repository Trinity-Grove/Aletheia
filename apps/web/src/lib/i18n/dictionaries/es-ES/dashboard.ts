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
  tour: {
    welcome: {
      title: '¡Bienvenido a Aletheia!',
      subtitle: '¿Desea un recorrido guiado rápido por las principales herramientas del sistema?',
      start: 'Iniciar Tour Guiado (3 min)',
      dismissNever: 'Omitir y no volver a mostrar',
    },
    steps: {
      step1: {
        title: 'Navegación y Módulos',
        description: 'Acceda a Educandos, Currículo, Horario semanal, Diario de Aprendizaje, Portafolio fotográfico e Informes estructurados.',
      },
      step2: {
        title: 'Enfoque del Educando',
        description: 'Alterne fácilmente entre el seguimiento individual de cada hijo o consulte la vista consolidada de toda la familia.',
      },
      step3: {
        title: 'Versículo y Devocional',
        description: 'Inspiración espiritual diaria con registros de oraciones y reflexiones bíblicas familiares.',
      },
      step4: {
        title: 'Jornada y Actividades',
        description: 'Monitoree el tiempo de instrucción en tiempo real y complete lecciones con registro reflexivo.',
      },
      step5: {
        title: '¡Todo Listo para Empezar!',
        description: 'Ha explorado los puntos principales de Aletheia. ¡Felicitaciones por comenzar este viaje educativo!',
      },
    },
    controls: {
      next: 'Siguiente',
      prev: 'Anterior',
      skip: 'Saltar y salir',
      finish: 'Completar Tour',
      stepIndicator: 'Paso {current} de {total}',
    },
    startTourNav: 'Hacer Tour por el Sistema',
  },
} as const;
