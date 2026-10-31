/**
 * [VERIFIED ENGINE] Classroom Multiplayer Rules
 * Speed Sprint, Last-Student-Standing shield survival, and distractor misconception diagnosis.
 */
import type {
  GameMode,
  MisconceptionRecord,
  QuestionItem,
  RoundPhase
} from './types.js';

export interface PointsCalculationInput {
  readonly isCorrect: boolean;
  readonly rapidGuess: boolean;
  readonly difficulty: number;
  readonly responseMs: number;
  readonly roundDurationMs: number;
  readonly masteryDelta: number;
  readonly phase: RoundPhase;
}

export interface ShieldSurvivalResult {
  readonly shieldsRemaining: number;
  readonly eliminatedNow: boolean;
}

export function determinePhaseForRound(mode: GameMode, roundNumber: number): RoundPhase {
  if (mode !== 'hybrid_arena') {
    return mode;
  }
  return roundNumber <= 2 ? 'speed_sprint' : 'last_student_standing';
}

function clampUnit(val: number): number {
  return Math.min(1, Math.max(0, val));
}

function computeVerifiedGainPoints(input: PointsCalculationInput): number {
  const timeRatio = clampUnit(1 - input.responseMs / Math.max(1000, input.roundDurationMs));
  const difficultyBase = 100 * (0.55 + 0.65 * input.difficulty);
  const speedMultiplier = 0.65 + 0.35 * timeRatio;
  const masteryBonus = 180 * Math.max(0, input.masteryDelta);
  const clutchBonus = input.phase === 'last_student_standing' ? 25 : 0;
  return Math.round(difficultyBase * speedMultiplier + masteryBonus + clutchBonus);
}

export function calculateRoundPoints(input: PointsCalculationInput): number {
  if (!input.isCorrect) {
    return 0;
  }
  if (input.rapidGuess) {
    return 0;
  }
  return computeVerifiedGainPoints(input);
}

function computeEliminationStep(currentShields: number, isCorrect: boolean): ShieldSurvivalResult {
  const nextShields = isCorrect ? currentShields : Math.max(0, currentShields - 1);
  return {
    shieldsRemaining: nextShields,
    eliminatedNow: nextShields === 0
  };
}

export function evaluateShieldSurvival(
  currentShields: number,
  alreadyEliminated: boolean,
  phase: RoundPhase,
  isCorrect: boolean
): ShieldSurvivalResult {
  if (alreadyEliminated) {
    return { shieldsRemaining: 0, eliminatedNow: false };
  }
  if (phase !== 'last_student_standing') {
    return { shieldsRemaining: currentShields, eliminatedNow: false };
  }
  return computeEliminationStep(currentShields, isCorrect);
}

export function classifyDistractorMisconception(
  question: QuestionItem,
  conceptTitle: string,
  selectedIndex: number,
  roundNumber: number
): MisconceptionRecord | undefined {
  if (selectedIndex === question.correctIndex) {
    return undefined;
  }
  const found = question.misconceptions.find((m) => m.optionIndex === selectedIndex);
  const fallback = question.misconceptions[0];
  const chosen = found === undefined ? fallback : found;
  return buildMisconceptionRecord(question, conceptTitle, roundNumber, chosen);
}

function buildMisconceptionRecord(
  question: QuestionItem,
  conceptTitle: string,
  roundNumber: number,
  chosen: QuestionItem['misconceptions'][number] | undefined
): MisconceptionRecord | undefined {
  if (!chosen) {
    return undefined;
  }
  return {
    conceptId: question.conceptId,
    conceptTitle,
    questionId: question.id,
    tag: chosen.tag,
    diagnosis: chosen.diagnosis,
    remediation: chosen.remediation,
    roundNumber
  };
}
