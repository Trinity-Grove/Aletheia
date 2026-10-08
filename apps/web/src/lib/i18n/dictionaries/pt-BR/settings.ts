export const settings = {
  pageTitle: 'Configurações & Painel da Família',
  pageDescription:
    'Gerencie identidade pedagógica, preferências de liturgia diária, segurança e backup completo de soberania.',
  loading: 'Carregando configurações...',
  groups: {
    family: 'Família & Liturgia',
    communication: 'Comunicação',
    security: 'Segurança & Soberania',
    community: 'Comunidade',
  },
  tabs: {
    general: 'Identidade & Geral',
    family: 'Família & Responsáveis',
    profile: 'Perfil Pedagógico & Teológico',
    notifications: 'Notificações & Lembretes',
    account: 'Conta & Segurança',
    privacy: 'Privacidade & LGPD',
    backup: 'Backup & Soberania',
    support: 'Apoio Comunitário',
  },
  badges: {
    mfaActive: '2FA Ativo',
    mfaRecommended: 'Recomendado',
    backupReady: 'Pronto',
    donor: 'Apoiador',
  },
  activity: {
    emptyTitle: 'Nenhuma atividade registrada',
    emptyDesc:
      'Eventos como login, alteração de senha e de e-mail aparecerão aqui.',
  },
  security: {
    currentPasswordLabel: 'Senha atual',
    newPasswordLabel: 'Nova senha (mínimo 8 caracteres)',
    confirmPasswordLabel: 'Confirmar nova senha',
    newEmailLabel: 'Novo e-mail',
  },
  backup: {
    familyData: 'Dados da Família & Configurações',
    learnerProfiles: 'Perfis Pedagógicos dos Educandos',
    devotionalReadings: 'Leituras & Diário Devocional',
    prayerRequests: 'Pedidos & Diário de Orações',
    academicYears: 'Anos Letivos, Disciplinas & Currículos',
    schedules: 'Cronogramas & Rotinas Semanais',
    learningRecords: 'Registros de Aprendizagem & Domínio',
    portfolioItems: 'Itens de Portfólio & Evidências',
    attendanceRecords: 'Registros Diários de Frequência',
    complianceGoals: 'Metas de Conformidade & Históricos',
    formatJson: 'JSON (UTF-8)',
    guardiansOnlyNotice:
      'Apenas responsáveis têm permissão para baixar o backup integral da família.',
  },
  general: {
    readOnlyMode: 'Modo Somente Leitura:',
    familyNameLabel: 'Nome da Academia Familiar / Homeschool',
    familyNamePlaceholder: 'Ex: Academia Familiar Silva',
    familyNameHelper:
      'Este nome será exibido nos cabeçalhos de históricos e relatórios acadêmicos oficiais.',
    timezoneLabel: 'Fuso Horário',
    languageLabel: 'Idioma do Sistema',
    pedagogicalFrameworkLabel:
      'Estrutura Pedagógica & Escala de Avaliação Padrão',
  },
  members: {
    emailLabel: 'E-mail',
    roleLabel: 'Papel na família',
  },
  mfaCard: {
    disabled: 'Desativado',
    confirmPasswordToEnable: 'Confirme sua senha atual',
    qrAlt: 'Código QR do autenticador',
    generatingQr: 'Gerando QR...',
    stepRecoveryCodes: '2. Códigos de recuperação',
    stepEnterCode: '3. Digite o código de 6 dígitos exibido pelo aplicativo',
    active: 'Ativo',
    confirmPasswordToDisable: 'Confirme sua senha atual para desativar',
  },
  notificationsCard: {
    devotionalLabel: 'Lembrete do Devocional Familiar',
    scheduleLabel: 'Lembrete do Cronograma de Aulas',
    attendanceLabel: 'Lembrete de Frequência Pendente',
    attendanceDesc:
      'Avisar ao final do dia se houver educandos sem registro de presença efetuado.',
    inAppLabel: 'Notificações no Navegador / In-App',
    inAppDesc:
      'Exibir balão e contador de avisos no sino da barra superior da plataforma.',
    emailLabel: 'Resumo e Notificações por E-mail',
    emailDesc:
      'Receber avisos importantes e orações respondidas no e-mail dos pais.',
  },
  profile: {
    loading: 'Carregando perfis...',
    primaryModelLabel: 'Modelo Pedagógico Principal',
    secondaryModelLabel: 'Adicionar modelo secundário',
    weightLabel: 'Peso (0-1)',
    theologyLabel: 'Tradição Teológica Preferencial',
  },
  privacy: {
    bannerTitle: 'Atualização de Termos (LGPD):',
    consentDeclaration: 'Declaração de Consentimento Legal:',
    attention: 'Atenção:',
  },
} as const;
