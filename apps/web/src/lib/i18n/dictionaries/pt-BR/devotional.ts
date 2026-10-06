export const devotional = {
  page: {
    title: 'Culto Doméstico & Devocional',
    subtitle: 'Cultive a fé em família através da leitura da Bíblia, reflexão, louvor e oração diária.',
    errors: {
      loadDevotional: 'Não foi possível carregar o devocional do dia.',
      loadDevotionalConnection: 'Não foi possível carregar o devocional do dia. Verifique sua conexão.',
      loadPrayers: 'Não foi possível carregar o mural de orações.',
      loadPrayersConnection: 'Não foi possível carregar o mural de orações. Verifique sua conexão.',
      familyUnauthenticated: 'Família não autenticada',
      saveDevotional: 'Falha ao salvar devocional.',
      savePrayer: 'Falha ao salvar oração.',
      answerPrayer: 'Falha ao registrar oração respondida.',
      archivePrayer: 'Falha ao arquivar oração.',
    },
  },
  comparator: {
    backLink: '← Voltar ao Culto Doméstico & Devocional',
    kicker: 'Escrituras Sagradas • Trinity Grove',
    title: 'Comparador de Traduções Bíblicas',
    subtitle: 'Examine e compare a Palavra de Deus lado a lado em diversas traduções clássicas e contemporâneas para enriquecer o estudo e o culto familiar.',
  },
  view: {
    nav: {
      yesterday: '← Ontem',
      today: 'Hoje',
      tomorrow: 'Amanhã →',
      compareTranslations: 'Comparar Traduções 📖',
    },
    actions: {
      create: 'Criar Devocional',
      edit: 'Editar Devocional',
    },
    empty: {
      title: 'Nenhum devocional registrado para esta data ({date})',
      description: 'Reúna a família ao redor da Palavra de Deus. Registre as passagens lidas, reflexões e orações de hoje.',
      action: 'Criar Devocional do Dia',
    },
    badges: {
      covenantReading: 'Leitura Bíblica & Aliança',
      version: 'Versão: {version}',
    },
    reflection: {
      header: 'Reflexão & Conversa em Família',
      questionsTitle: 'Perguntas para Diálogo Familiar:',
    },
    memoryVerse: {
      badge: 'Versículo para Memorização',
    },
    hymn: {
      badge: 'Hino / Louvor do Dia',
    },
    practicalApplication: {
      badge: 'Aplicação Prática',
    },
  },
  form: {
    titles: {
      new: 'Novo Devocional Diário',
      edit: 'Editar Devocional',
    },
    actions: {
      cancel: 'Cancelar',
      create: 'Criar Devocional',
      save: 'Salvar Alterações',
      lookupScripture: 'Buscar Texto YouVersion',
    },
    labels: {
      date: 'Data *',
      bibleVersion: 'Versão Bíblica',
      bibleReference: 'Referência Bíblica *',
      passageText: 'Texto da Passagem',
      reflection: 'Reflexão / Comentário Familiar',
      memoryVerse: 'Versículo para Memorização',
      hymn: 'Hino / Cântico',
      discussionQuestions: 'Perguntas para Diálogo / Catequese',
      practicalApplication: 'Aplicação Prática',
    },
    placeholders: {
      bibleReference: 'Ex: Salmos 23:1-6, João 3:16...',
      passageText: 'Cole ou busque o texto bíblico da leitura...',
      reflection: 'Reflexão principal, contexto e lições para a família...',
      memoryVerse: 'Ex: Guardei no coração a tua palavra...',
      hymn: 'Ex: Castelo Forte, Maravilhosa Graça...',
      discussionQuestions: '1. O que este texto nos ensina sobre Deus?\n2. Como podemos praticar isso hoje?',
      practicalApplication: 'Ações concretas, atitudes de amor e serviço para hoje...',
    },
    errors: {
      referenceRequired: 'Informe uma referência bíblica para buscar (ex: João 3:16 ou Salmos 23).',
      familyUnauthenticated: 'Família não autenticada.',
      lookupFailed: 'Não foi possível obter o texto bíblico. Digite o texto manualmente.',
      lookupNotFound: 'Não foi encontrado texto para essa referência nessa versão. Tente outra versão ou digite o texto manualmente.',
      lookupGeneric: 'Erro ao buscar texto bíblico.',
      requiredFields: 'Data e Referência Bíblica são obrigatórias.',
      saveFailed: 'Falha ao salvar devocional.',
    },
  },
  prayer: {
    header: {
      title: 'Diário de Oração da Família',
      answeredCount: '{count} respondida(s)',
      subtitle: 'Intercessões, súplicas ativas e testemunhos de orações respondidas pelo Senhor.',
    },
    actions: {
      new: '+ Novo Registro',
      markAnswered: 'Marcar como Respondida',
      archive: 'Arquivar',
    },
    celebration: {
      title: 'Celebração de Resposta de Oração!',
      subtitle: 'Deus tem sido fiel em ouvir as orações da sua família. Compartilhe o testemunho!',
    },
    tabs: {
      petitions: 'Pedidos de Oração',
      gratitudes: 'Gratidões & Louvores',
    },
    empty: {
      petitionsTitle: 'Nenhum pedido de oração ativo no momento.',
      gratitudesTitle: 'Nenhuma gratidão registrada ainda.',
      description: 'Adicione um novo registro para que todos possam orar juntos.',
    },
    card: {
      answeredBadge: 'Respondida!',
      inPrayerBadge: 'Em Oração',
      gratitudeBadge: 'Gratidão',
      testimonyLabel: 'Testemunho / Resposta:',
    },
    modalAnswer: {
      title: 'Marcar Oração como Respondida',
      description: 'Deseja registrar um testemunho ou nota de como Deus respondeu a esta oração na vida da família?',
      label: 'Nota de Agradecimento / Testemunho',
      placeholder: 'Ex: Deus supriu a nossa necessidade através de...',
      cancel: 'Cancelar',
      confirm: 'Confirmar Resposta',
    },
    modalCreate: {
      petitionTitle: 'Novo Pedido de Oração',
      gratitudeTitle: 'Nova Gratidão / Louvor',
      typeLabel: 'Tipo',
      petitionOption: 'Pedido de Oração (Petição / Intercessão)',
      gratitudeOption: 'Gratidão / Louvor (Ação de Graças)',
      titleLabel: 'Título *',
      petitionTitlePlaceholder: 'Ex: Saúde da vovó',
      gratitudeTitlePlaceholder: 'Ex: Bênção no trabalho',
      detailsLabel: 'Detalhes / Motivos',
      detailsPlaceholder: 'Descreva detalhes para oração em família...',
      cancel: 'Cancelar',
      save: 'Salvar',
    },
    errors: {
      titleRequired: 'O título do pedido/louvor é obrigatório.',
      saveFailed: 'Falha ao salvar oração.',
      archiveFailed: 'Falha ao arquivar oração.',
    },
  },
  comparatorView: {
    labels: {
      bibleReference: 'Referência Bíblica',
    },
    placeholders: {
      bibleReference: 'Ex: João 1:1, Salmos 23:1, Romanos 8:28...',
    },
    actions: {
      compare: 'Comparar Traduções',
    },
    quickSuggestions: 'Sugestões rápidas:',
    translationsLabel: 'Traduções para Comparação:',
    loading: {
      title: 'Consultando traduções bíblicas...',
      description: 'Buscando passagens e alinhando versões lado a lado.',
    },
    empty: {
      title: 'Escolha uma passagem para comparar',
      description: 'Digite a referência desejada ou use uma das sugestões rápidas acima para visualizar e comparar as diferentes traduções lado a lado com toda a família.',
    },
    results: {
      comparisonTitle: 'Comparação: {reference}',
      displayedCount: '{count} tradução exibida',
      displayedCountPlural: '{count} traduções exibidas',
      textUnavailable: 'Texto não disponível para esta referência.',
    },
    errors: {
      emptyReference: 'Por favor, informe uma referência bíblica (ex: João 3:16).',
      noTranslations: 'Selecione pelo menos uma tradução bíblica para comparar.',
      noFamily: 'Família ativa não encontrada. Selecione uma família antes de comparar.',
      loadFailed: 'Não foi possível carregar a comparação para a referência informada.',
      generic: 'Erro ao comparar traduções bíblicas.',
    },
  },
} as const;
