import type { Dictionary } from '../pt-BR';

export const support: Dictionary['support'] = {
  // Page Header & Philosophy Banner
  pageTitle: 'Apoyo Comunitario Voluntario',
  pageSubtitle:
    'Creemos que la educación en el hogar y la soberanía de la familia sobre el aprendizaje de sus hijos deben ser accesibles para todos, independientemente de su condición financiera. Por eso, Aletheia es 100% gratuita y sin restricciones.',
  featureNoPaywalls: 'Sin muros de pago ni bloqueos',
  featureNoLimits: 'Sin límites de estudiantes o asignaturas',
  featureFreeAndSovereign: '100% libre y soberano',

  // DonationFormCard
  formTitle: 'Apoyo Voluntario y Comunitario',
  formDescription:
    'Aletheia es y siempre será 100% gratuita para todas las familias educadoras, sin restricciones ni bloqueos. Su contribución voluntaria sostiene nuestros servidores, apoya el desarrollo continuo y preserva nuestra independencia.',
  successTitle: '¡Muchas gracias por su apoyo! ❤️',
  successDescription:
    'Su contribución voluntaria ha sido confirmada con éxito y fortalece la misión de una educación soberana y accesible para todos.',
  anotherContribution: 'Hacer otra contribución',
  pixTitle: 'Pague con PIX para apoyar',
  pixInstruction:
    'Abra la aplicación de su banco, elija Pagar con PIX y apunte la cámara al código QR a continuación:',
  pixQrCodeAlt: 'Código QR PIX',
  pixCopyPasteLabel: 'Código PIX Copia y Pega:',
  pixCopyButton: 'Copiar código PIX',
  pixCopied: '¡Código copiado!',
  pixWaiting: 'Esperando confirmación del banco en tiempo real...',
  frequencyLabel: 'Frecuencia de la Contribución',
  frequencyOneTime: 'Donación Única',
  frequencyMonthly: 'Apoyo Mensual',
  amountLabel: 'Elija un Monto',
  customAmountPlaceholder: 'O ingrese otro monto (ej: 25,00)',
  minimumNote: 'Mínimo de {amount}',
  paymentMethodLabel: 'Método de Pago',
  pixMethodTitle: 'PIX',
  pixMethodSubtitle: 'Instantáneo, sin comisiones intermediarias, confirmación en segundos',
  pixUnavailableMonthly: 'No disponible para apoyo mensual recurrente -- elija tarjeta',
  creditCardTitle: 'Tarjeta de Crédito',
  creditCardSubtitle:
    'Será redirigido al pago seguro de Mercado Pago para completar el pago',
  submitLoading: 'Procesando...',
  submitMonthly: 'Iniciar Apoyo Mensual',
  submitPix: 'Generar PIX para Apoyar',
  submitCard: 'Continuar al Pago',
  minAmountError: 'El monto mínimo de apoyo es {amount}',
  familyNotFoundError: 'Identificación de la familia no encontrada para registrar la contribución.',
  initFlowError: 'Error al iniciar el flujo de contribución.',
  processError: 'Error al procesar el apoyo voluntario.',

  // DonationReceiptsTable
  activeSubscriberTitle: 'Seguidor Mensual Activo',
  activeBadge: 'Activo',
  activeSubscriberDescription: 'Contribución recurrente de {amount} / mes vía {method}.',
  cancelMonthlySupport: 'Cancelar Apoyo Mensual',
  receiptsTitle: 'Historial de Contribuciones y Recibos',
  receiptsDescription:
    'Transparencia integral de todos los apoyos voluntarios registrados para su familia.',
  refreshButton: 'Actualizar',
  loadingHistory: 'Cargando historial de contribuciones...',
  emptyHistoryTitle: 'Aún no hay contribuciones registradas',
  emptyHistoryDescription:
    'Cuando realice un apoyo voluntario, sus recibos detallados y confirmaciones bancarias aparecerán aquí.',
  tableColDate: 'Fecha',
  tableColAmount: 'Monto',
  tableColFrequency: 'Frecuencia',
  tableColMethod: 'Método',
  tableColStatus: 'Estado',
  statusConfirmed: 'Confirmado',
  statusPending: 'Pendiente',
  statusFailed: 'Falló',
  statusCancelled: 'Cancelado',
  methodPix: 'PIX',
  methodGooglePay: 'Google Pay',
  methodCard: 'Tarjeta',
  frequencyMonthlyShort: 'Mensual',
  frequencyOneTimeShort: 'Única',
  cancelModalTitle: '¿Cancelar Apoyo Mensual?',
  cancelModalPrompt:
    '¿Está seguro de que desea cancelar su contribución voluntaria mensual de {amount}?',
  cancelModalReassurance:
    'Recordando que Aletheia seguirá siendo 100% gratuito y con todas las herramientas disponibles para su familia. Ninguna función se restringe al cancelar.',
  keepSupportButton: 'Mantener Apoyo',
  confirmCancelButton: 'Confirmar Cancelación',
  cancellingButton: 'Cancelando...',
  loadHistoryError: 'Error al cargar el historial de apoyo.',
  cancelSubscriptionError: 'Error al cancelar el apoyo mensual.',

  // SupporterSettingsCard
  settingsTitle: 'Apoyo Comunitario y Mecenazgo',
  settingsDescription:
    'Administre su contribución voluntaria para mantener a Aletheia soberana, libre y gratuita.',
  makeContributionButton: 'Hacer una Contribución',
  currentStatusLabel: 'Estado Actual:',
  statusActiveMonthly: 'Seguidor Mensual Activo',
  statusCommunitySupporter: 'Seguidor de la Comunidad',
  statusNoActive: 'Sin apoyo recurrente activo',
  statusActiveDescription: 'Apoyo mensual recurrente de {amount}.',
  statusFreeDescription:
    'Aletheia es 100% libre y sin muros de pago. Cualquier familia puede contribuir voluntariamente cuando lo desee.',
  recentReceiptsTitle: 'Recibos Recientes',
  loadingReceipts: 'Cargando recibos...',
  emptyReceipts: 'Aún no hay recibos registrados.',
  loadInfoError: 'Error al cargar la información de apoyo.',
};
