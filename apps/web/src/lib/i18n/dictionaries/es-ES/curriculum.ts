import type { Dictionary } from '../pt-BR';

export const curriculum: Dictionary['curriculum'] = {
  moderation: {
    reportModalTitle: 'Denunciar Paquete Curricular',
    reportBtn: 'Denunciar Paquete 🚩',
    reportBtnShort: 'Denunciar',
    reasonLabel: 'Motivo de la Denuncia',
    reasons: {
      SPAM_COMMERCIAL: 'Spam o Contenido Comercial',
      HARMFUL_INAPPROPRIATE: 'Contenido Nocivo o Inapropiado',
      COPYRIGHT_PLAGIARISM: 'Violación de Derechos de Autor o Plagio',
      MALFORMED_QUALITY: 'Estructura Corrupta o Baja Calidad Técnica',
      OTHER: 'Otro Motivo',
    },
    detailsLabel: 'Detalles de la Denuncia (opcional)',
    detailsPlaceholder: 'Describa detalladamente el problema observado en este paquete...',
    cancelBtn: 'Cancelar',
    submitReport: 'Enviar Denuncia',
    submittingReport: 'Enviando...',
    reportSuccessMsg: 'Denuncia enviada a los moderadores de la plataforma.',
    reportConflictMsg: 'Su familia ya ha enviado una denuncia para este paquete.',
    reportErrorMsg: 'Error al enviar la denuncia. Inténtelo de nuevo más tarde.',
    badgeNovice: 'Autor Principiante',
    badgeVerified: 'Autor Verificado',
    badgeTrusted: 'Autor Confiable',
    scoreTooltip: 'Índice de Confianza: {score}/100',
  },
};
