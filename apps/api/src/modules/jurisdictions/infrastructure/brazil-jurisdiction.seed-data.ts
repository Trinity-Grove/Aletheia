import type { JurisdictionComplianceMetadata } from '@aletheia/contracts';

// Brasil (BR) jurisdiction seed -- issue #26's own named first-slice
// delivery ("Brasil como organizador/complemento").
//
// IMPORTANT LEGAL CAVEAT (read before touching this file or trusting its
// numbers as settled fact -- researched 2026-09-15, sources below):
//
// Brazil has NO federal law that regulates or explicitly authorizes
// homeschooling ("educação domiciliar") as of this writing. The relevant
// history:
//   - Lei de Diretrizes e Bases da Educação (LDB), Lei 9.394/1996, Art. 24,
//     I sets the minimum instructional time for compulsory basic education
//     in general (school-based) as 800 hours across a minimum of 200 days
//     of effective school work per year. This is a real, currently-in-force
//     statutory minimum -- but it was written for enrollment in a school,
//     not for homeschooling, which the same law does not contemplate.
//   - STF (Supremo Tribunal Federal), Tema 822 / RE 888.815 (2018): ruled
//     homeschooling is not per se incompatible with the Constitution, but
//     that practicing it lawfully requires specific federal regulation --
//     which Congress has not enacted.
//   - PL 1.338/2022: bill regulating homeschooling, approved by the Câmara
//     dos Deputados in 2022; as of early 2026 still pending a Senate floor
//     vote, with the executive branch publicly opposed.
//   - Throughout 2025, the STF struck down state/Distrito Federal laws
//     (Santa Catarina, DF) that tried to authorize homeschooling locally in
//     the absence of federal legislation, reaffirming that only a federal
//     law can create that framework.
//
// Net effect: homeschooling families in Brazil operate in a genuine legal
// gray zone today. There is no codified homeschooling-specific minimum
// days/hours, subject list, evaluation, or notification requirement to
// seed as settled fact. The `minInstructionalDays`/`minInstructionalHours`
// values below are the LDB Art. 24, I general compulsory-education minimums
// applied here BY ANALOGY -- the same reference point this platform's
// pre-existing free-text jurisdiction/manual min-days-hours fields have
// informally used -- not a homeschooling-specific legal requirement. This
// is why `confidenceLevel` is CONTESTED, not ESTABLISHED, and why
// `legalBasisNotes` spells this out for anyone reading the row directly.
//
// Do not present this as legal advice or a compliance guarantee (issue #26
// acceptance criterion: "conteúdo deixa claro que a plataforma não
// substitui legislação nem aconselhamento jurídico"). If Congress passes
// PL 1.338/2022 or equivalent, or the STF rules again, this becomes a new
// PUBLISHED version -- this version is never rewritten in place.
export const BRAZIL_JURISDICTION_SEED: {
  code: string;
  name: string;
  description: string;
  metadata: JurisdictionComplianceMetadata;
} = {
  code: 'BR',
  name: 'Brasil',
  description:
    'Brasil (nível federal). Educação domiciliar não é regulamentada por lei federal; ver legalBasisNotes e ' +
    'confidenceLevel antes de usar estes parâmetros para qualquer decisão de conformidade.',
  metadata: {
    minInstructionalDays: 200,
    minInstructionalHours: 800,
    minLearnerAge: null,
    maxLearnerAge: null,
    requiredSubjects: [],
    evaluationRequirements:
      'Nao ha avaliacao formal definida em lei para educacao domiciliar. O PL 1.338/2022 (ainda pendente no ' +
      'Senado) preve avaliacao periodica do desempenho escolar, mas essa exigencia nao esta em vigor.',
    notificationRequirements:
      'Nao ha exigencia legal vigente de notificacao/matricula para familias praticando educacao domiciliar no ' +
      'Brasil. Familias atualmente atuam em zona de incerteza juridica quanto a risco de responsabilizacao por ' +
      'abandono intelectual, mesmo comprovando rotina de estudos.',
    filingDeadlines: null,
    officialSource:
      'LDB (Lei 9.394/1996), Art. 24, I; STF, Tema 822 / RE 888.815 (2018); PL 1.338/2022 (Camara dos ' +
      'Deputados, aprovado em 2022, pendente no Senado); decisoes do STF em 2025 declarando inconstitucionais ' +
      'leis estaduais/distritais que tentaram autorizar a pratica localmente (Santa Catarina, Distrito Federal).',
    sourceCheckedOn: '2026-09-15',
    confidenceLevel: 'CONTESTED',
    legalBasisNotes:
      'A pratica de educacao domiciliar no Brasil nao e proibida (STF, 2018), mas tambem nao e regulamentada: ' +
      'depende de lei federal especifica que o Congresso ainda nao aprovou. Os valores minInstructionalDays=200 ' +
      'e minInstructionalHours=800 vem do Art. 24, I da LDB, que rege a educacao basica escolar em geral -- ' +
      'sao aplicados aqui por analogia, nao como exigencia especifica de educacao domiciliar, porque nao existe ' +
      'hoje um parametro proprio codificado em lei para esse fim. Esta definicao NAO constitui aconselhamento ' +
      'juridico nem garantia de conformidade; familias devem consultar orientacao juridica propria dado o ' +
      'cenario ainda em disputa (PL 1.338/2022 pendente no Senado; posicao do Executivo contraria; decisoes do ' +
      'STF em 2025 contra leis estaduais/distritais equivalentes).',
  },
};
