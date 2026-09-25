// Draft legal copy for the platform's mandatory consent definitions
// (Terms of Use, Privacy Policy, and guardian consent for learner data
// processing), split by privacy-law regime (resolved from the family's
// country via resolvePrivacyRegime in @aletheia/contracts). Regimes
// covered are scoped to the markets this product already validates for
// homeschooling (Brazil, Uruguay, USA -- see the `jurisdictions` module's
// seed data) plus the largest Spanish-speaking markets (Argentina,
// Mexico, Colombia) and the EU (the app's own locales are
// pt-BR/en-US/es-ES), with a neutral GENERIC fallback for everyone else.
//
// IMPORTANT: this is a reasonable-effort draft, not legal advice or a
// finalized legal opinion. Every regime here should be reviewed by a
// lawyer familiar with that jurisdiction before being relied on as the
// platform's actual, final legal text -- especially COPPA (US, minors'
// data) and GDPR (cross-border transfer obligations). Content can be
// edited later through the existing admin ConsentDefinition CRUD (a new
// version publishes; the version a given user/family accepted stays
// auditable) without a code change.

import type { PrivacyRegime } from '@aletheia/contracts';

export interface LegalConsentSeedEntry {
  code: string;
  scope: 'FAMILY' | 'LEARNER';
  title: string;
  description: string;
  content: string;
  purposes: string[];
}

interface RegimeProfile {
  regime: PrivacyRegime;
  /** Human label used in generated headings, e.g. "LGPD (Brasil)". */
  label: string;
  /** The specific law name(s) cited in generated text. */
  lawCitation: string;
  /** Legal-basis sentence, specific to this regime's own terminology. */
  legalBasisNote: string;
  /** Data-subject rights sentence, specific to this regime. */
  rightsNote: string;
  /** Optional extra clause (e.g. cross-border transfer, verifiable parental consent). */
  extraClause?: string;
}

const REGIME_PROFILES: RegimeProfile[] = [
  {
    regime: 'LGPD',
    label: 'LGPD (Brasil)',
    lawCitation: 'a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 -- LGPD)',
    legalBasisNote:
      'com base no consentimento do titular (art. 7º, I, e art. 8º da LGPD) e, quando aplicável, na execução do contrato de uso da plataforma (art. 7º, V)',
    rightsNote:
      'Você pode solicitar, a qualquer momento, confirmação de tratamento, acesso, correção, anonimização, portabilidade ou eliminação dos dados, além de revogar o consentimento, nos termos dos arts. 17 e 18 da LGPD.',
  },
  {
    regime: 'GDPR',
    label: 'GDPR/RGPD (União Europeia)',
    lawCitation: 'o Regulamento Geral sobre a Proteção de Dados (Regulamento (UE) 2016/679 -- GDPR/RGPD)',
    legalBasisNote:
      'com base no consentimento do titular (art. 6(1)(a) do GDPR) e, quando aplicável, na execução do contrato de uso da plataforma (art. 6(1)(b))',
    rightsNote:
      'Você tem direito de acesso, retificação, apagamento ("direito ao esquecimento"), limitação do tratamento, portabilidade, oposição, e o direito de retirar o consentimento a qualquer momento (arts. 15 a 21 do GDPR), além do direito de apresentar reclamação junto à autoridade de controle do seu país de residência.',
    extraClause:
      'Caso dados sejam transferidos para fora do Espaço Econômico Europeu, isso ocorrerá com garantias adequadas (ex.: cláusulas contratuais-padrão), conforme exigido pelo Capítulo V do GDPR.',
  },
  {
    regime: 'COPPA',
    label: 'COPPA (Estados Unidos)',
    lawCitation:
      'o Children\'s Online Privacy Protection Act (COPPA, 15 U.S.C. §§ 6501-6506) e demais leis de privacidade aplicáveis nos Estados Unidos',
    legalBasisNote:
      'com base no consentimento parental verificável, exigido pela COPPA para o tratamento de dados de menores de 13 anos, prestado pelo responsável legal no momento do cadastro do educando',
    rightsNote:
      'Como responsável legal, você pode revisar os dados coletados sobre o educando, solicitar sua exclusão, e recusar qualquer coleta adicional a qualquer momento, conforme os direitos assegurados pela COPPA ao titular do consentimento parental.',
    extraClause:
      'A plataforma não coleta dados de menores diretamente: o cadastro do educando e o consentimento correspondente são sempre realizados pelo responsável legal adulto.',
  },
  {
    regime: 'URUGUAY',
    label: 'Uruguai',
    lawCitation: 'a Ley Nº 18.331 de Protección de Datos Personales y Acción de Habeas Data (Uruguai)',
    legalBasisNote: 'com base no consentimento livre, prévio e informado do titular, exigido pela Ley Nº 18.331',
    rightsNote:
      'Você pode exercer os direitos de acesso, retificação, atualização e eliminação de dados, além do habeas data, perante a Unidad Reguladora y de Control de Datos Personales (URCDP), conforme a Ley Nº 18.331.',
  },
  {
    regime: 'ARGENTINA',
    label: 'Argentina',
    lawCitation: 'a Ley Nº 25.326 de Protección de los Datos Personales (Argentina)',
    legalBasisNote: 'com base no consentimento livre, expresso e informado do titular, exigido pela Ley Nº 25.326',
    rightsNote:
      'Você pode exercer os direitos de acesso, retificação, atualização e supressão de dados perante a Agencia de Acceso a la Información Pública (AAIP), conforme a Ley Nº 25.326.',
  },
  {
    regime: 'MEXICO',
    label: 'México',
    lawCitation:
      'a Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP, México)',
    legalBasisNote: 'com base no consentimento do titular, exigido pela LFPDPPP',
    rightsNote:
      'Você pode exercer os direitos ARCO (Acesso, Retificação, Cancelamento e Oposição) perante o Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) ou órgão que o suceda, conforme a LFPDPPP.',
  },
  {
    regime: 'COLOMBIA',
    label: 'Colômbia',
    lawCitation: 'a Ley 1581 de 2012 e o Decreto 1377 de 2013 (Colômbia)',
    legalBasisNote: 'com base na autorização prévia, expressa e informada do titular, exigida pela Ley 1581 de 2012',
    rightsNote:
      'Você pode exercer os direitos de conhecimento, atualização, retificação e supressão de dados perante a Superintendencia de Industria y Comercio (SIC), conforme a Ley 1581 de 2012.',
  },
  {
    regime: 'GENERIC',
    label: 'legislação aplicável ao país da família',
    lawCitation: 'a legislação de proteção de dados pessoais aplicável ao país da sua família',
    legalBasisNote: 'com base no seu consentimento e, quando aplicável, na execução do contrato de uso da plataforma',
    rightsNote:
      'Você pode solicitar, a qualquer momento, acesso, correção, portabilidade ou eliminação dos seus dados, além de revogar o consentimento, na medida em que a legislação aplicável ao seu país assim preveja.',
  },
];

const CONTROLLER_NOTICE =
  'A Aletheia é a controladora/responsável pelo tratamento dos dados descritos neste documento.';

function buildTermsOfUse(profile: RegimeProfile): LegalConsentSeedEntry {
  return {
    code: `TERMS_OF_USE_${profile.regime}`,
    scope: 'FAMILY',
    title: 'Termos de Uso',
    description: `Termos de Uso da plataforma Aletheia (${profile.label}).`,
    purposes: ['platform_usage_agreement'],
    content: `# Termos de Uso

## 1. Objeto
Estes Termos de Uso regem o acesso e uso da plataforma Aletheia por famílias educadoras e seus responsáveis legais.

## 2. Cadastro e responsabilidade
Ao se cadastrar, você declara ser maior de idade e responsável legal pelos educandos que cadastrar na plataforma. Você é responsável pela veracidade dos dados informados e pela guarda de suas credenciais de acesso.

## 3. Uso da plataforma
A plataforma é destinada a apoiar o planejamento, registro e acompanhamento de atividades educacionais familiares. É vedado o uso para fins ilícitos ou que violem direitos de terceiros.

## 4. Tratamento de dados pessoais
O tratamento de dados pessoais realizado pela Aletheia segue a Política de Privacidade, elaborada em conformidade com ${profile.lawCitation}. ${CONTROLLER_NOTICE}

## 5. Propriedade intelectual
O conteúdo produzido pela plataforma (modelos, currículos oficiais) pertence à Aletheia; o conteúdo criado pela família permanece de titularidade da família.

## 6. Alterações
Estes termos podem ser atualizados; mudanças relevantes exigem novo aceite.

## 7. Contato
Dúvidas sobre estes termos podem ser encaminhadas pelos canais de suporte da plataforma.`,
  };
}

function buildPrivacyPolicy(profile: RegimeProfile): LegalConsentSeedEntry {
  return {
    code: `PRIVACY_POLICY_${profile.regime}`,
    scope: 'FAMILY',
    title: 'Política de Privacidade',
    description: `Política de Privacidade da plataforma Aletheia (${profile.label}).`,
    purposes: ['data_processing_disclosure'],
    content: `# Política de Privacidade

## 1. Controlador
${CONTROLLER_NOTICE}

## 2. Dados coletados
Coletamos dados da conta (nome, e-mail, senha), dados da família (nome, país) e dados dos educandos cadastrados (nome, data de nascimento, ano/etapa escolar e, quando enviada, foto).

## 3. Finalidade e base legal
Os dados são tratados para viabilizar o cadastro, a organização de currículos e o registro de atividades educacionais, em conformidade com ${profile.lawCitation}, ${profile.legalBasisNote}.
${profile.extraClause ? `\n## 4. Observação adicional\n${profile.extraClause}\n` : ''}
## ${profile.extraClause ? '5' : '4'}. Compartilhamento
Não vendemos dados pessoais. Dados podem ser compartilhados com provedores estritamente necessários à operação da plataforma (ex.: hospedagem, armazenamento de arquivos), sob obrigação contratual de confidencialidade.

## ${profile.extraClause ? '6' : '5'}. Retenção
Os dados são mantidos enquanto a conta estiver ativa e pelo período adicional necessário para cumprimento de obrigações legais.

## ${profile.extraClause ? '7' : '6'}. Direitos do titular
${profile.rightsNote}

## ${profile.extraClause ? '8' : '7'}. Segurança
Adotamos medidas técnicas e administrativas razoáveis para proteger os dados contra acessos não autorizados e incidentes de segurança.

## ${profile.extraClause ? '9' : '8'}. Contato
Solicitações relativas a esta política podem ser feitas pelos canais de suporte da plataforma.`,
  };
}

function buildLearnerDataProcessing(profile: RegimeProfile): LegalConsentSeedEntry {
  return {
    code: `LEARNER_DATA_PROCESSING_${profile.regime}`,
    scope: 'LEARNER',
    title: 'Consentimento para tratamento de dados do educando',
    description: `Consentimento do responsável para tratamento de dados do educando (${profile.label}).`,
    purposes: ['learner_data_processing'],
    content: `Declaro ser o pai, a mãe ou o responsável legal por este estudante, ou ter autorização expressa de quem seja, e consinto com o tratamento dos dados dele -- nome, data de nascimento, ano escolar e foto, quando enviada -- para organizar e registrar suas atividades educacionais na plataforma, em conformidade com ${profile.lawCitation} e a Política de Privacidade.${
      profile.extraClause ? ` ${profile.extraClause}` : ''
    }

Este consentimento pode ser revisto ou retirado a qualquer momento nas configurações de privacidade da família.`,
  };
}

export const TERMS_OF_USE_DEFINITIONS: LegalConsentSeedEntry[] = REGIME_PROFILES.map(buildTermsOfUse);
export const PRIVACY_POLICY_DEFINITIONS: LegalConsentSeedEntry[] = REGIME_PROFILES.map(buildPrivacyPolicy);
export const LEARNER_DATA_PROCESSING_DEFINITIONS: LegalConsentSeedEntry[] =
  REGIME_PROFILES.map(buildLearnerDataProcessing);

export const ALL_LEGAL_CONSENT_DEFINITIONS: LegalConsentSeedEntry[] = [
  ...TERMS_OF_USE_DEFINITIONS,
  ...PRIVACY_POLICY_DEFINITIONS,
  ...LEARNER_DATA_PROCESSING_DEFINITIONS,
];
