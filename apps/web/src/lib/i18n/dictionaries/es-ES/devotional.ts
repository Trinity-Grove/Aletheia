export const devotional = {
  page: {
    title: 'Culto Doméstico y Devocional',
    subtitle: 'Cultive la fe en familia a través de la lectura bíblica, reflexión, alabanza y oración diaria.',
    errors: {
      loadDevotional: 'No fue posible cargar el devocional del día.',
      loadDevotionalConnection: 'No fue posible cargar el devocional del día. Compruebe su conexión.',
      loadPrayers: 'No fue posible cargar el muro de oraciones.',
      loadPrayersConnection: 'No fue posible cargar el muro de oraciones. Compruebe su conexión.',
      familyUnauthenticated: 'Familia no autenticada',
      saveDevotional: 'Error al guardar el devocional.',
      savePrayer: 'Error al guardar la oración.',
      answerPrayer: 'Error al registrar la oración respondida.',
      archivePrayer: 'Error al archivar la oración.',
    },
  },
  comparator: {
    backLink: '← Volver al Culto Doméstico y Devocional',
    kicker: 'Sagradas Escrituras • Trinity Grove',
    title: 'Comparador de Traducciones Bíblicas',
    subtitle: 'Examine y compare la Palabra de Dios lado a lado en diversas traducciones clásicas y contemporáneas para enriquecer el estudio y el culto familiar.',
  },
  view: {
    nav: {
      yesterday: '← Ayer',
      today: 'Hoy',
      tomorrow: 'Mañana →',
      compareTranslations: 'Comparar Traducciones 📖',
    },
    actions: {
      create: 'Crear Devocional',
      edit: 'Editar Devocional',
    },
    empty: {
      title: 'Ningún devocional registrado para esta fecha ({date})',
      description: 'Reúna a la familia alrededor de la Palabra de Dios. Registre los pasajes leídos, reflexiones y oraciones de hoy.',
      action: 'Crear Devocional del Día',
    },
    badges: {
      covenantReading: 'Lectura Bíblica y Alianza',
      version: 'Versión: {version}',
    },
    reflection: {
      header: 'Reflexión y Conversación Familiar',
      questionsTitle: 'Preguntas para el Diálogo Familiar:',
    },
    memoryVerse: {
      badge: 'Versículo para Memorizar',
    },
    hymn: {
      badge: 'Himno / Alabanza del Día',
    },
    practicalApplication: {
      badge: 'Aplicación Práctica',
    },
  },
  form: {
    titles: {
      new: 'Nuevo Devocional Diario',
      edit: 'Editar Devocional',
    },
    actions: {
      cancel: 'Cancelar',
      create: 'Crear Devocional',
      save: 'Guardar Cambios',
      lookupScripture: 'Buscar Texto YouVersion',
    },
    labels: {
      date: 'Fecha *',
      bibleVersion: 'Versión Bíblica',
      bibleReference: 'Referencia Bíblica *',
      passageText: 'Texto del Pasaje',
      reflection: 'Reflexión / Comentario Familiar',
      memoryVerse: 'Versículo para Memorizar',
      hymn: 'Himno / Cántico',
      discussionQuestions: 'Preguntas para Diálogo / Catequesis',
      practicalApplication: 'Aplicación Práctica',
    },
    placeholders: {
      bibleReference: 'Ej: Salmo 23:1-6, Juan 3:16...',
      passageText: 'Pegue o busque el texto bíblico de la lectura...',
      reflection: 'Reflexión principal, contexto y lecciones para la familia...',
      memoryVerse: 'Ej: En mi corazón he guardado tus dichos...',
      hymn: 'Ej: Castillo Fuerte, Sublime Gracia...',
      discussionQuestions: '1. ¿Qué nos enseña este texto acerca de Dios?\n2. ¿Cómo podemos practicar esto hoy?',
      practicalApplication: 'Acciones concretas, actitudes de amor y servicio para hoy...',
    },
    errors: {
      referenceRequired: 'Indique una referencia bíblica para buscar (ej: Juan 3:16 o Salmo 23).',
      familyUnauthenticated: 'Familia no autenticada.',
      lookupFailed: 'No fue posible obtener el texto bíblico. Escriba el texto manualmente.',
      lookupNotFound: 'No se encontró texto para esta referencia en esta versión. Pruebe otra versión o escríbalo manualmente.',
      lookupGeneric: 'Error al buscar el texto bíblico.',
      requiredFields: 'La fecha y la referencia bíblica son obligatorias.',
      saveFailed: 'Error al guardar el devocional.',
    },
  },
  prayer: {
    header: {
      title: 'Diario de Oración Familiar',
      answeredCount: '{count} respondida(s)',
      subtitle: 'Intercesiones, súplicas activas y testimonios de oraciones respondidas por el Señor.',
    },
    actions: {
      new: '+ Nuevo Registro',
      markAnswered: 'Marcar como Respondida',
      archive: 'Archivar',
    },
    celebration: {
      title: '¡Celebración de Oración Respondida!',
      subtitle: 'Dios ha sido fiel al escuchar las oraciones de su familia. ¡Comparta el testimonio!',
    },
    tabs: {
      petitions: 'Peticiones de Oración',
      gratitudes: 'Gratitud y Alabanzas',
    },
    empty: {
      petitionsTitle: 'Ninguna petición de oración activa en este momento.',
      gratitudesTitle: 'Ninguna gratitud registrada todavía.',
      description: 'Agregue un nuevo registro para que todos puedan orar juntos.',
    },
    card: {
      answeredBadge: '¡Respondida!',
      inPrayerBadge: 'En Oración',
      gratitudeBadge: 'Gratitud',
      testimonyLabel: 'Testimonio / Respuesta:',
    },
    modalAnswer: {
      title: 'Marcar Oración como Respondida',
      description: '¿Desea registrar un testimonio o nota de cómo Dios respondió a esta oración en su familia?',
      label: 'Nota de Agradecimiento / Testimonio',
      placeholder: 'Ej: Dios suplió nuestra necesidad a través de...',
      cancel: 'Cancelar',
      confirm: 'Confirmar Respuesta',
    },
    modalCreate: {
      petitionTitle: 'Nueva Petición de Oración',
      gratitudeTitle: 'Nueva Gratitud / Alabanza',
      typeLabel: 'Tipo',
      petitionOption: 'Petición de Oración (Intercesión)',
      gratitudeOption: 'Gratitud / Alabanza (Acción de Gracias)',
      titleLabel: 'Título *',
      petitionTitlePlaceholder: 'Ej: Salud de la abuela',
      gratitudeTitlePlaceholder: 'Ej: Bendición en el trabajo',
      detailsLabel: 'Detalles / Motivos',
      detailsPlaceholder: 'Describa detalles para la oración en familia...',
      cancel: 'Cancelar',
      save: 'Guardar',
    },
    errors: {
      titleRequired: 'El título de la petición/alabanza es obligatorio.',
      saveFailed: 'Error al guardar la oración.',
      archiveFailed: 'Error al archivar la oración.',
    },
  },
  comparatorView: {
    labels: {
      bibleReference: 'Referencia Bíblica',
    },
    placeholders: {
      bibleReference: 'Ej: Juan 1:1, Salmo 23:1, Romanos 8:28...',
    },
    actions: {
      compare: 'Comparar Traducciones',
    },
    quickSuggestions: 'Sugerencias rápidas:',
    translationsLabel: 'Traducciones para Comparación:',
    loading: {
      title: 'Consultando traducciones bíblicas...',
      description: 'Buscando pasajes y alineando versiones lado a lado.',
    },
    empty: {
      title: 'Elija un pasaje para comparar',
      description: 'Escriba la referencia deseada o use una de las sugerencias rápidas arriba para visualizar y comparar las diferentes traducciones lado a lado con toda la familia.',
    },
    results: {
      comparisonTitle: 'Comparación: {reference}',
      displayedCount: '{count} traducción mostrada',
      displayedCountPlural: '{count} traducciones mostradas',
      textUnavailable: 'Texto no disponible para esta referencia.',
    },
    errors: {
      emptyReference: 'Por favor, indique una referencia bíblica (ej: Juan 3:16).',
      noTranslations: 'Seleccione al menos una traducción bíblica para comparar.',
      noFamily: 'Familia activa no encontrada. Seleccione una familia antes de comparar.',
      loadFailed: 'No fue posible cargar la comparación para la referencia indicada.',
      generic: 'Error al comparar traducciones bíblicas.',
    },
  },
} as const;
