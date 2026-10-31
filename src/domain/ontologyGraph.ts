/**
 * [VERIFIED ENGINE] Prerequisite Ontology DAG & ZPD Handicap Item Selector
 * Deterministically routes each student in a live classroom round to their personal mastery edge.
 */
import type { ConceptNode, CurriculumGraph, QuestionItem } from './types.js';

const PREREQ_UNLOCK_THRESHOLD = 0.65;
const MASTERED_FRONTIER_CAP = 0.85;

function readMastery(masteryByConcept: Readonly<Record<string, number>>, node: ConceptNode): number {
  const stored = masteryByConcept[node.id];
  return stored === undefined ? node.bkt.priorMastery : stored;
}

function arePrerequisitesMet(
  node: ConceptNode,
  curriculum: CurriculumGraph,
  masteryByConcept: Readonly<Record<string, number>>
): boolean {
  return node.prerequisites.every((prereqId) => {
    const parent = curriculum.concepts.find((c) => c.id === prereqId);
    return parent ? readMastery(masteryByConcept, parent) >= PREREQ_UNLOCK_THRESHOLD : true;
  });
}

export function getUnlockedFrontierConcepts(
  curriculum: CurriculumGraph,
  masteryByConcept: Readonly<Record<string, number>>
): readonly ConceptNode[] {
  const unlocked = curriculum.concepts.filter((node) =>
    arePrerequisitesMet(node, curriculum, masteryByConcept)
  );
  return unlocked.length > 0 ? unlocked : [curriculum.concepts[0]];
}

function pickTargetConcept(
  unlocked: readonly ConceptNode[],
  masteryByConcept: Readonly<Record<string, number>>
): ConceptNode {
  const unmastered = unlocked.filter((c) => readMastery(masteryByConcept, c) < MASTERED_FRONTIER_CAP);
  const pool = unmastered.length > 0 ? unmastered : unlocked;
  return pool[pool.length - 1];
}

function filterCandidateQuestions(
  allForConcept: readonly QuestionItem[],
  seenQuestionIds: readonly string[]
): readonly QuestionItem[] {
  const unseen = allForConcept.filter((q) => !seenQuestionIds.includes(q.id));
  return unseen.length > 0 ? unseen : allForConcept;
}

function pickClosestToTargetDifficulty(
  candidates: readonly QuestionItem[],
  targetDifficulty: number
): QuestionItem {
  return [...candidates].sort(
    (a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
  )[0];
}

export function selectZpdQuestionForStudent(
  curriculum: CurriculumGraph,
  masteryByConcept: Readonly<Record<string, number>>,
  seenQuestionIds: readonly string[]
): QuestionItem {
  const unlocked = getUnlockedFrontierConcepts(curriculum, masteryByConcept);
  const targetConcept = pickTargetConcept(unlocked, masteryByConcept);
  const currentMastery = readMastery(masteryByConcept, targetConcept);
  const targetDifficulty = Math.min(0.95, Math.max(0.2, currentMastery + 0.08));
  const conceptItems = curriculum.questions.filter((q) => q.conceptId === targetConcept.id);
  const candidates = filterCandidateQuestions(conceptItems, seenQuestionIds);
  return pickClosestToTargetDifficulty(candidates, targetDifficulty);
}
