import type { JurisdictionComplianceMetadata } from '@aletheia/contracts';

// Uruguay (UY) jurisdiction seed -- Issue #26 first deliveries
// ("Brasil como organizador/complemento; depois Uruguai e estados priorizados dos EUA").
//
// STATUTORY REFERENCES (researched 2026-09-18):
// - Ley 18.437 (Ley General de Educación), Arts. 7, 8: Establece la obligatoriedad
//   de la educación desde los 4 años de edad hasta completar la educación media superior.
// - Ley 17.823 (Código de la Niñez y la Adolescencia), Art. 38: Deber y derecho de los
//   padres o responsables de inscribir al niño en un centro docente y seguir su proceso educativo.
// - ANEP (Administración Nacional de Educación Pública) / DGEIP: Calendario lectivo de ~180 días.
// - No existe prohibición expresa, pero la acreditación periódica del cumplimiento de metas curriculares
//   y validación de aprendizajes ante ANEP es exigida para evitar infracciones administrativas.
export const URUGUAY_JURISDICTION_SEED: {
  code: string;
  name: string;
  description: string;
  metadata: JurisdictionComplianceMetadata;
} = {
  code: 'UY',
  name: 'Uruguay',
  description:
    'Uruguay (nivel nacional). Marco regulado por la Ley General de Educación (Ley 18.437) y Código de la Niñez y la Adolescencia (Ley 17.823).',
  metadata: {
    minInstructionalDays: 180,
    minInstructionalHours: null,
    minLearnerAge: 4,
    maxLearnerAge: 17,
    requiredSubjects: [
      'idioma_espanol',
      'matematica',
      'ciencias_sociales',
      'ciencias_de_la_naturaleza',
      'artes',
    ],
    evaluationRequirements:
      'Acreditación periódica o validación de aprendizajes ante los órganos desconcentrados de ANEP (Administración Nacional de Educación Pública).',
    notificationRequirements:
      'Deber de los padres de registrar y comunicar la trayectoria formativa del educando ante la autoridad educativa competente.',
    filingDeadlines: null,
    officialSource:
      'Ley 18.437 (Ley General de Educación), Arts. 7, 8; Ley 17.823 (Código de la Niñez y la Adolescencia), Art. 38; Resoluciones y Calendario ANEP.',
    sourceCheckedOn: '2026-09-18',
    confidenceLevel: 'ESTABLISHED',
    legalBasisNotes:
      'En Uruguay, la educación es obligatoria desde los 4 hasta los 17 años. El Estado reconoce el derecho preferente de los padres, pero exige la acreditación periódica del cumplimiento de metas curriculares ante los órganos desconcentrados de ANEP. Esta definición no constituye asesoramiento legal individual.',
  },
};
