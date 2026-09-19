// Source of truth for every string already in the app -- copied verbatim
// from the JSX being migrated, never rewritten, so the pt-BR experience is
// provably unchanged by introducing i18n.
export const ptBR = {
  common: {
    home: 'Início',
    logout: 'Sair',
    accessDeniedTitle: 'Acesso restrito',
    accessDeniedDescription: 'Você não tem permissão para acessar esta página.',
  },
  nav: {
    adminCatalog: 'Catálogo administrativo',
    home: 'Início',
    learners: 'Educandos',
    devotional: 'Devocional',
    curriculum: 'Currículo',
    schedule: 'Agenda & Rotina',
    records: 'Diário de Aprendizagem',
    portfolio: 'Portfólio',
    attendance: 'Frequência',
    reports: 'Relatórios',
    support: 'Apoiar o Projeto ❤️',
    settings: 'Configurações',
  },
  notifications: {
    iconAriaLabel: 'Sino',
    bellAriaLabel: 'Notificações ({count} não lidas)',
    title: 'Notificações',
    newCount: '{count} novas',
    markAllRead: 'Marcar lidas',
    markAsRead: 'Marcar como lida',
    empty: 'Nenhuma notificação no momento.',
    timeJustNow: 'Agora',
    timeMinutesAgo: '{count}m atrás',
    timeHoursAgo: '{count}h atrás',
    typeDevotionalReminder: 'Devocional',
    typeDailyScheduleReminder: 'Cronograma',
    typeAttendanceMissingReminder: 'Frequência',
    typePrayerAnsweredAlert: 'Oração Respondida',
    typeSystemNotice: 'Aviso do Sistema',
    typeFallback: 'Notificação',
  },
  learnerFocus: {
    wholeFamily: 'Toda a Família',
    familyIconAriaLabel: 'Família',
    ariaLabel: 'Foco do Educando',
    selectedAriaLabel: 'Educando selecionado: {name}',
  },
} as const;

// Widen every literal string leaf to `string` -- other locale dictionaries
// need to hold their own translated text, not the pt-BR literals.
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof ptBR>;
