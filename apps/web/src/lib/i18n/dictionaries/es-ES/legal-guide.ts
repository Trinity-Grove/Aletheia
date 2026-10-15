export const legalGuide = {
  header: {
    title: 'Guía legal y primeros pasos',
    subtitle: 'Entienda los registros importantes y organice los primeros días de su familia en Aletheia.',
    jurisdictionBadge: 'Jurisdicción Activa: {name}',
    confidenceLabel: 'Nivel de Certeza: {level}',
  },
  framework: {
    title: 'Sus Derechos y Amparo Constitucional',
    description: 'La educación en el hogar se fundamenta en la primacía de la familia sobre la educación y en la jurisprudencia que reconoce la licitud de la práctica y la inexistencia de delito de abandono intelectual cuando existe instrucción regular y afecto.',
    minDaysLabel: 'Meta Mínima de Días Lectivos',
    minDaysValue: '{count} días',
    minHoursLabel: 'Carga Horaria Anual Mínima',
    minHoursValue: '{count} horas',
    officialSourceLabel: 'Fuente Oficial y Legislación',
    legalNotice: 'Aletheia apoya el registro riguroso y la conformidad de su familia, pero esta guía tiene fines educativos y no reemplaza el asesoramiento legal individual.',
  },
  evidence: {
    title: 'Cómo Protegerse con Evidencias de Aprendizaje',
    description: 'La mayor seguridad jurídica de la familia educadora es la prueba material. Registros diarios de lecciones, fotos de actividades, lecturas concluidas y seguimiento de asistencia demuestran la seriedad pedagógica ante cualquier inspección.',
    dossierAction: 'Emitir Expediente de Conformidad Anual',
    dossierHint: 'Genere el informe consolidado con hash verificable en la pestaña de Informes.',
  },
  checklist: {
    title: 'Checklist de los Primeros 30 Días',
    subtitle: 'Pasos fundamentales para estructurar la rutina de estudio con tranquilidad y respaldo.',
    progress: '{completed} de {total} etapas completadas ({percentage}%)',
    steps: {
      step1: {
        title: '1. Registrar a su primer estudiante',
        description: 'Añada los datos de su hijo, edad y etapa de desarrollo.',
        action: 'Ir a Estudiantes',
      },
      step2: {
        title: '2. Definir el perfil pedagógico o plan de estudios',
        description: 'Elija el enfoque pedagógico (Clásico, Charlotte Mason, etc.) o adopte un paquete de materias.',
        action: 'Explorar Currículos',
      },
      step3: {
        title: '3. Organizar la rutina semanal de estudios',
        description: 'Distribuya bloques de tiempo equilibrados entre lecciones, lectura y actividades prácticas.',
        action: 'Configurar Horario',
      },
      step4: {
        title: '4. Registrar la 1ª actividad con evidencia',
        description: 'Complete una lección o adjunte una foto/nota en el Diario de Aprendizaje.',
        action: 'Abrir Diario',
      },
      step5: {
        title: '5. Establecer el momento devocional diario',
        description: 'Cultive el hábito de lectura bíblica y reflexión familiar diaria.',
        action: 'Acceder a Devocional',
      },
      step6: {
        title: '6. Ver vista previa del informe de aprendizaje',
        description: 'Compruebe cómo Aletheia organiza automáticamente la asistencia y el progreso de su hijo.',
        action: 'Ver Informes',
      },
    },
  },
  faq: {
    title: 'Preguntas Frecuentes (FAQ Legal)',
    q1: {
      question: '¿La educación en el hogar es un delito en Brasil?',
      answer: 'No. El Supremo Tribunal Federal (STF), en el fallo del Recurso Extraordinario 888.815, reconoció que la educación en el hogar no está prohibida por la Constitución Federal y no constituye el delito de abandono intelectual (art. 246 del Código Penal), siempre que los padres demuestren que el niño está siendo efectivamente instruido.',
    },
    q2: {
      question: '¿Qué hacer si el Consejo Tutelar o el Ministerio Público notifica a la familia?',
      answer: 'Mantenga la calma y presente una respuesta cortés y formal acompañada de su Expediente de Aprendizaje de Aletheia. Demuestre el plan de estudios, asistencia, muestras de actividades y el desarrollo cognitivo y emocional de los educandos.',
    },
    q3: {
      question: '¿Cómo comprobar la asistencia y el aprendizaje ante las autoridades?',
      answer: 'Utilice la pestaña de Informes de Aletheia para exportar el Informe Anual de Conformidad y Portafolio. Reúne fecha, hora, objetivos alcanzados y el código de verificación criptográfica del documento.',
    },
    q4: {
      question: '¿El estudiante podrá volver a la escuela regular o ingresar a la educación superior en el futuro?',
      answer: 'Sí. La legislación educativa garantiza a cualquier estudiante el derecho a pasar por una evaluación de clasificación en la escuela receptora para ser matriculado en el nivel adecuado a sus conocimientos. Para la educación superior, el joven puede rendir exámenes de admisión o pruebas de equivalencia.',
    },
  },
} as const;
