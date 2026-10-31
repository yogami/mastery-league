/**
 * [VERIFIED ENGINE] Bayesian Knowledge Tracing (Corbett & Anderson, 1995)
 * Pure deterministic posterior update with rapid-guessing sandbagging protection.
 */
import type { BktParameters, BktUpdateInput, BktUpdateResult } from './types.js';

const RAPID_WRONG_THRESHOLD_MS = 1200;
const RAPID_CORRECT_THRESHOLD_MS = 450;
const VERIFIED_MASTERY_THRESHOLD = 0.8;

function clampProbability(value: number): number {
  return Math.min(0.99, Math.max(0.02, Number(value.toFixed(4))));
}

function isRapidGuessAttempt(isCorrect: boolean, responseMs: number): boolean {
  const threshold = isCorrect ? RAPID_CORRECT_THRESHOLD_MS : RAPID_WRONG_THRESHOLD_MS;
  return responseMs < threshold;
}

function computeCorrectPosterior(prior: number, params: BktParameters): number {
  const trueHit = prior * (1 - params.slipRate);
  const falseHit = (1 - prior) * params.guessRate;
  return trueHit / (trueHit + falseHit);
}

function computeIncorrectPosterior(prior: number, params: BktParameters): number {
  const slipped = prior * params.slipRate;
  const trueMiss = (1 - prior) * (1 - params.guessRate);
  return slipped / (slipped + trueMiss);
}

function applyLearningTransition(evidencePosterior: number, learnRate: number): number {
  const transitioned = evidencePosterior + (1 - evidencePosterior) * learnRate;
  return clampProbability(transitioned);
}

export function updateBktMastery(input: BktUpdateInput): BktUpdateResult {
  const prior = clampProbability(input.priorMastery);
  if (isRapidGuessAttempt(input.isCorrect, input.responseMs)) {
    return {
      posteriorMastery: prior,
      delta: 0,
      rapidGuess: true,
      verifiedMastery: prior >= VERIFIED_MASTERY_THRESHOLD
    };
  }
  const evidence = input.isCorrect
    ? computeCorrectPosterior(prior, input.params)
    : computeIncorrectPosterior(prior, input.params);
  const posteriorMastery = applyLearningTransition(evidence, input.params.learnRate);
  return {
    posteriorMastery,
    delta: Number((posteriorMastery - prior).toFixed(4)),
    rapidGuess: false,
    verifiedMastery: posteriorMastery >= VERIFIED_MASTERY_THRESHOLD
  };
}
