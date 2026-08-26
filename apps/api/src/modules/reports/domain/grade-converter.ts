import type { GradingScale, MasteryLevel } from '@aletheia/contracts';

export interface ConvertedGrade {
  calculatedGrade: string;
  letterGrade: string | null;
  numericGrade: number | null;
  narrativeSummary: string | null;
}

export class GradeConverter {
  /**
   * Mastery weights used for averaging or numeric conversion:
   * NOT_STARTED = 0
   * EXPOSURE = 20
   * DEVELOPING = 50
   * WITH_ASSISTANCE = 70
   * AUTONOMOUS = 85
   * MASTERED = 100
   */
  static masteryToScore(level: MasteryLevel): number {
    switch (level) {
      case 'MASTERED':
        return 100;
      case 'AUTONOMOUS':
        return 85;
      case 'WITH_ASSISTANCE':
        return 70;
      case 'DEVELOPING':
        return 50;
      case 'EXPOSURE':
        return 20;
      case 'NOT_STARTED':
      default:
        return 0;
    }
  }

  /**
   * Converts a numeric score (0-100) or average mastery to a MasteryLevel
   */
  static scoreToMastery(score: number): MasteryLevel {
    if (score >= 90) return 'MASTERED';
    if (score >= 80) return 'AUTONOMOUS';
    if (score >= 65) return 'WITH_ASSISTANCE';
    if (score >= 40) return 'DEVELOPING';
    if (score > 0) return 'EXPOSURE';
    return 'NOT_STARTED';
  }

  /**
   * Converts a score (0-100) to a Letter Grade
   */
  static scoreToLetter(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Converts a mastery level or aggregate score to target grading scale details
   */
  static convert(masteryLevel: MasteryLevel, scale: GradingScale, score?: number): ConvertedGrade {
    const effectiveScore = score !== undefined ? score : this.masteryToScore(masteryLevel);
    const letter = this.scoreToLetter(effectiveScore);
    const numeric10 = Math.round((effectiveScore / 10) * 10) / 10;
    const numeric100 = Math.round(effectiveScore * 10) / 10;

    switch (scale) {
      case 'LETTER_A_F':
        return {
          calculatedGrade: letter,
          letterGrade: letter,
          numericGrade: numeric100,
          narrativeSummary: this.getNarrative(masteryLevel),
        };
      case 'NUMERIC_0_10':
        return {
          calculatedGrade: numeric10.toString(),
          letterGrade: letter,
          numericGrade: numeric10,
          narrativeSummary: this.getNarrative(masteryLevel),
        };
      case 'NUMERIC_0_100':
        return {
          calculatedGrade: numeric100.toString(),
          letterGrade: letter,
          numericGrade: numeric100,
          narrativeSummary: this.getNarrative(masteryLevel),
        };
      case 'NARRATIVE':
        return {
          calculatedGrade: this.getNarrative(masteryLevel),
          letterGrade: letter,
          numericGrade: numeric100,
          narrativeSummary: this.getNarrative(masteryLevel),
        };
      case 'MASTERY_QUALITATIVE':
      default:
        return {
          calculatedGrade: masteryLevel,
          letterGrade: letter,
          numericGrade: numeric100,
          narrativeSummary: this.getNarrative(masteryLevel),
        };
    }
  }

  static getNarrative(level: MasteryLevel): string {
    switch (level) {
      case 'MASTERED':
        return 'Demonstra domínio completo, consistência e capacidade de ensinar ou aplicar os conceitos em novos contextos.';
      case 'AUTONOMOUS':
        return 'Realiza as atividades de forma autônoma e segura, com excelente compreensão dos conteúdos.';
      case 'WITH_ASSISTANCE':
        return 'Compreende os fundamentos e realiza as atividades satisfatoriamente com orientação pontual.';
      case 'DEVELOPING':
        return 'Em processo de desenvolvimento das habilidades fundamentais com progresso contínuo.';
      case 'EXPOSURE':
        return 'Teve contato inicial com o tema e está construindo a base de familiaridade.';
      case 'NOT_STARTED':
      default:
        return 'Conteúdo programado ainda não iniciado.';
    }
  }
}
