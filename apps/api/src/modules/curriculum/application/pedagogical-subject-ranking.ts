import type { TemplateSubjectDefinition } from '@aletheia/contracts';

// Pedagogical-profile-weighted subject ranking (issue #95, human-approved
// integration of PedagogicalProfile into applyTemplate's content
// resolution). Pure and framework-agnostic on purpose: it takes whatever
// subject set applyTemplate already resolved for the *applied* template
// (dto.template) and re-orders it using the family's weighted
// primary/secondary models as a soft signal -- it never adds or removes a
// subject, only changes the order the same set is returned in.
//
// The affinity signal reuses the one identity a subject already has in
// this codebase: its `name` (see CurriculumRepository.applyPublishedTemplate,
// which dedupes/looks up subjects by `(familyId, name)`). A subject scores
// higher the more of the family's weighted models also list a
// same-named subject in their own template -- e.g. the CROSS_CUTTING_SUBJECTS
// shared verbatim across every framework in curriculum-template.engine.ts
// naturally score higher for any profile, and a framework-specific subject
// (e.g. "Latim & Línguas Clássicas") only scores if the family's weighted
// models happen to share that exact subject name.
//
// No profile => no weighted models => this is a documented no-op: the
// input array is returned by reference, unchanged, in its original order.

export interface WeightedModel {
  code: string;
  weight: number;
}

export interface SubjectRelevance {
  name: string;
  relevanceScore: number;
}

export interface RankedSubjects {
  subjects: TemplateSubjectDefinition[];
  relevance: SubjectRelevance[];
}

function roundScore(score: number): number {
  // Avoid float noise like 0.7 + 0.30000000000000004 in the response.
  return Math.round(score * 10000) / 10000;
}

export function rankSubjectsByRelevance(
  subjects: TemplateSubjectDefinition[],
  weightedModels: WeightedModel[],
  subjectNamesByModelCode: Map<string, Set<string>>,
): RankedSubjects {
  if (weightedModels.length === 0) {
    // No profile / nothing to weight by -- identity, by reference.
    return { subjects, relevance: [] };
  }

  const scored = subjects.map((subject, index) => {
    let score = 0;
    for (const model of weightedModels) {
      if (subjectNamesByModelCode.get(model.code)?.has(subject.name)) {
        score += model.weight;
      }
    }
    return { subject, index, score };
  });

  // Stable by construction: ties keep original relative order via the
  // index tiebreaker, so this never reshuffles subjects the profile has
  // no opinion about.
  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  return {
    subjects: scored.map((entry) => entry.subject),
    relevance: scored.map((entry) => ({ name: entry.subject.name, relevanceScore: roundScore(entry.score) })),
  };
}
