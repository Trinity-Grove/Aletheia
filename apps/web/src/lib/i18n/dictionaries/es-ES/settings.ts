export const settings = {
  pageTitle: 'Configuración y Panel de la Familia',
  pageDescription:
    'Gestione la identidad pedagógica, preferencias de liturgia diaria, seguridad y copias de seguridad de soberanía.',
  loading: 'Cargando configuración...',
  groups: {
    family: 'Familia y Liturgia',
    communication: 'Comunicación',
    security: 'Seguridad y Soberanía',
    community: 'Comunidad',
  },
  tabs: {
    general: 'Identidad y General',
    family: 'Familia y Tutores',
    profile: 'Perfil Pedagógico y Teológico',
    notifications: 'Notificaciones y Recordatorios',
    account: 'Cuenta y Seguridad',
    privacy: 'Privacidad y RGPD',
    backup: 'Copia de Seguridad y Soberanía',
    support: 'Apoyo Comunitario',
  },
  badges: {
    mfaActive: '2FA Activo',
    mfaRecommended: 'Recomendado',
    backupReady: 'Listo',
    donor: 'Colaborador',
  },
  activity: {
    emptyTitle: 'Ninguna actividad registrada',
    emptyDesc:
      'Los eventos como inicio de sesión, cambio de contraseña y correo electrónico aparecerán aquí.',
  },
  security: {
    currentPasswordLabel: 'Contraseña actual',
    newPasswordLabel: 'Nueva contraseña (mínimo 8 caracteres)',
    confirmPasswordLabel: 'Confirmar nueva contraseña',
    newEmailLabel: 'Nuevo correo electrónico',
  },
  backup: {
    familyData: 'Datos de la Familia y Configuración',
    learnerProfiles: 'Perfiles Pedagógicos de los Educandos',
    devotionalReadings: 'Lecturas y Diario Devocional',
    prayerRequests: 'Peticiones y Diario de Oración',
    academicYears: 'Años Académicos, Asignaturas y Currículos',
    schedules: 'Horarios y Rutinas Semanales',
    learningRecords: 'Registros de Aprendizaje y Dominio',
    portfolioItems: 'Elementos del Portafolio y Evidencias',
    attendanceRecords: 'Registros Diarios de Asistencia',
    complianceGoals: 'Metas de Cumplimiento e Historial',
    formatJson: 'JSON (UTF-8)',
    guardiansOnlyNotice:
      'Solo los tutores tienen permiso para descargar la copia de seguridad completa de la familia.',
  },
  general: {
    readOnlyMode: 'Modo Solo Lectura:',
    familyNameLabel: 'Nombre de la Academia Familiar / Homeschool',
    familyNamePlaceholder: 'Ej: Academia Familiar Silva',
    familyNameHelper:
      'Este nombre se mostrará en los encabezados de los expedientes e informes académicos oficiales.',
    timezoneLabel: 'Zona Horaria',
    languageLabel: 'Idioma del Sistema',
    pedagogicalFrameworkLabel:
      'Marco Pedagógico y Escala de Evaluación Estándar',
  },
  members: {
    emailLabel: 'Correo electrónico',
    roleLabel: 'Rol en la familia',
  },
  mfaCard: {
    disabled: 'Desactivado',
    confirmPasswordToEnable: 'Confirme su contraseña actual',
    qrAlt: 'Código QR del autenticador',
    generatingQr: 'Generando QR...',
    stepRecoveryCodes: '2. Códigos de recuperación',
    stepEnterCode: '3. Introduzca el código de 6 dígitos que muestra la aplicación',
    active: 'Activo',
    confirmPasswordToDisable: 'Confirme su contraseña actual para desactivar',
  },
  notificationsCard: {
    devotionalLabel: 'Recordatorio del Devocional Familiar',
    scheduleLabel: 'Recordatorio del Horario de Clases',
    attendanceLabel: 'Recordatorio de Asistencia Pendiente',
    attendanceDesc:
      'Avisar al final del día si hay educandos sin registro de asistencia realizado.',
    inAppLabel: 'Notificaciones en Navegador / In-App',
    inAppDesc:
      'Mostrar globo y contador de avisos en la campana de la barra superior.',
    emailLabel: 'Resumen y Notificaciones por Correo',
    emailDesc:
      'Recibir avisos importantes y oraciones respondidas en el correo de los padres.',
  },
  profile: {
    loading: 'Cargando perfiles...',
    primaryModelLabel: 'Modelo Pedagógico Principal',
    secondaryModelLabel: 'Añadir modelo secundario',
    weightLabel: 'Peso (0-1)',
    theologyLabel: 'Tradición Teológica Preferida',
  },
  privacy: {
    bannerTitle: 'Actualización de Términos (LGPD):',
    consentDeclaration: 'Declaración de Consentimiento Legal:',
    attention: 'Atención:',
  },
} as const;
