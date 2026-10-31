/**
 * [VERIFIED ENGINE] Classroom Teacher Mastery & Misconception Radar Builder
 */
import type {
  CurriculumGraph,
  MisconceptionRecord,
  StudentParticipant,
  TeacherConceptSummary,
  TeacherRadarReport
} from '../domain/types.js';

function averageNumbers(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((acc, v) => acc + v, 0);
  return Number((total / values.length).toFixed(4));
}

function summarizeConcept(
  conceptId: string,
  conceptTitle: string,
  students: readonly StudentParticipant[]
): TeacherConceptSummary {
  const scores = students.map((s) => s.masteryByConcept[conceptId] ?? 0.3);
  return {
    conceptId,
    conceptTitle,
    averageMastery: averageNumbers(scores),
    verifiedCount: scores.filter((v) => v >= 0.8).length,
    strugglingCount: scores.filter((v) => v < 0.45).length
  };
}

function collectRecentMisconceptions(
  students: readonly StudentParticipant[]
): readonly MisconceptionRecord[] {
  const all = students.flatMap((s) => s.misconceptions);
  return [...all].reverse().slice(0, 6);
}

export function buildTeacherRadar(
  curriculum: CurriculumGraph,
  students: readonly StudentParticipant[]
): TeacherRadarReport {
  const currentAvg = averageNumbers(students.map((s) => s.currentMasteryAvg));
  const initialAvg = averageNumbers(students.map((s) => s.initialMasteryAvg));
  const conceptSummaries = curriculum.concepts.map((c) =>
    summarizeConcept(c.id, c.title, students)
  );
  return {
    classAverageMastery: currentAvg,
    classAverageGain: Number((currentAvg - initialAvg).toFixed(4)),
    activeSurvivors: students.filter((s) => !s.eliminated).length,
    totalStudents: students.length,
    rapidGuessAlerts: students.reduce((acc, s) => acc + s.rapidGuessCount, 0),
    conceptSummaries,
    topMisconceptions: collectRecentMisconceptions(students)
  };
}
