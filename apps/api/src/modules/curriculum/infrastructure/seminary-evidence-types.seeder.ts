import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface SeminaryEvidenceTypeSeedRow {
  code: string;
  name: string;
  description: string;
}

export const SEMINARY_EVIDENCE_TYPE_SEED_ROWS: SeminaryEvidenceTypeSeedRow[] = [
  {
    code: 'THEOLOGICAL_ESSAY',
    name: 'Ensaio Teológico Sistemático',
    description: 'Ensaio teológico sistemático argumentativo com fundamentação bíblica, histórica e confessional.',
  },
  {
    code: 'EXEGESIS_PAPER',
    name: 'Artigo Exegético Estruturado',
    description: 'Artigo exegético estruturado com análise histórico-gramatical, canônica e línguas originais.',
  },
  {
    code: 'BOOK_REVIEW',
    name: 'Resenha Crítica de Fonte Primária',
    description: 'Resenha crítica e analítica de obra clássica ou fonte primária da teologia cristã.',
  },
  {
    code: 'ORAL_DEFENSE',
    name: 'Defesa Oral / Seminário',
    description: 'Defesa oral de proposição teológica ou apresentação expositiva em seminário.',
  },
  {
    code: 'THEOLOGICAL_DEBATE',
    name: 'Registro de Debate Teológico',
    description: 'Registro e análise crítica de debate teológico com rigor argumentativo e caridade hermenêutica.',
  },
];

@Injectable()
export class SeminaryEvidenceTypesSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<number> {
    const now = new Date();

    for (const row of SEMINARY_EVIDENCE_TYPE_SEED_ROWS) {
      await this.prisma.evidenceTypeDefinition.upsert({
        where: { code_version: { code: row.code, version: 1 } },
        create: {
          code: row.code,
          version: 1,
          status: 'PUBLISHED',
          name: row.name,
          description: row.description,
          metadata: {},
          publishedAt: now,
        },
        update: {
          status: 'PUBLISHED',
          name: row.name,
          description: row.description,
          metadata: {},
          publishedAt: now,
        },
      });
    }

    return SEMINARY_EVIDENCE_TYPE_SEED_ROWS.length;
  }
}
