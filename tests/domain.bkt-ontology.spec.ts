import { describe, expect, it } from 'vitest';
import { updateBktMastery } from '../src/domain/bktEngine.js';
import {
  getUnlockedFrontierConcepts,
  selectZpdQuestionForStudent
} from '../src/domain/ontologyGraph.js';
import { getCurriculumById, listCurricula } from '../src/domain/curriculumCatalog.js';

describe('BKT & Prerequisite Ontology Engine [VERIFIED ENGINE]', () => {
  const defaultParams = {
    priorMastery: 0.4,
    learnRate: 0.18,
    slipRate: 0.1,
    guessRate: 0.25
  };

  it('increases posterior mastery deterministically on a thoughtful correct response', () => {
    const res = updateBktMastery({
      priorMastery: 0.4,
      isCorrect: true,
      responseMs: 4200,
      params: defaultParams
    });

    expect(res.rapidGuess).toBe(false);
    expect(res.posteriorMastery).toBeGreaterThan(0.65);
    expect(res.delta).toBeGreaterThan(0.25);
  });

  it('decreases posterior mastery on a thoughtful wrong response without hitting zero', () => {
    const res = updateBktMastery({
      priorMastery: 0.6,
      isCorrect: false,
      responseMs: 5100,
      params: defaultParams
    });

    expect(res.rapidGuess).toBe(false);
    expect(res.posteriorMastery).toBeLessThan(0.6);
    expect(res.posteriorMastery).toBeGreaterThanOrEqual(0.02);
  });

  it('flags sub-1200ms wrong answers as rapid guesses and prevents downward handicap sandbagging', () => {
    const res = updateBktMastery({
      priorMastery: 0.72,
      isCorrect: false,
      responseMs: 450,
      params: defaultParams
    });

    expect(res.rapidGuess).toBe(true);
    expect(res.posteriorMastery).toBe(0.72);
    expect(res.delta).toBe(0);
  });

  it('marks verifiedMastery true once posterior reaches 0.80 threshold', () => {
    const res = updateBktMastery({
      priorMastery: 0.76,
      isCorrect: true,
      responseMs: 3500,
      params: defaultParams
    });

    expect(res.posteriorMastery).toBeGreaterThanOrEqual(0.8);
    expect(res.verifiedMastery).toBe(true);
  });

  it('gates advanced ontology concepts behind prerequisite mastery >= 0.65', () => {
    const math = getCurriculumById('middle-school-math');
    expect(math).toBeDefined();

    const beginnerMastery: Record<string, number> = {
      'math.frac.equiv': 0.35,
      'math.frac.ops': 0.25,
      'math.alg.linear': 0.2,
      'math.alg.ineq': 0.15
    };

    const unlockedBeginner = getUnlockedFrontierConcepts(math!, beginnerMastery);
    expect(unlockedBeginner.map((c) => c.id)).toEqual(['math.frac.equiv']);

    const progressingMastery: Record<string, number> = {
      'math.frac.equiv': 0.78,
      'math.frac.ops': 0.71,
      'math.alg.linear': 0.44,
      'math.alg.ineq': 0.2
    };

    const unlockedProgressing = getUnlockedFrontierConcepts(math!, progressingMastery);
    expect(unlockedProgressing.some((c) => c.id === 'math.alg.linear')).toBe(true);
    expect(unlockedProgressing.some((c) => c.id === 'math.alg.ineq')).toBe(false);
  });

  it('calibrates ZPD handicap questions so struggling and advanced classmates get level-appropriate items in the same round', () => {
    const curricula = listCurricula();
    expect(curricula.length).toBeGreaterThanOrEqual(2);

    const math = getCurriculumById('middle-school-math')!;
    const strugglingMastery = {
      'math.frac.equiv': 0.28,
      'math.frac.ops': 0.2,
      'math.alg.linear': 0.15,
      'math.alg.ineq': 0.1
    };
    const advancedMastery = {
      'math.frac.equiv': 0.92,
      'math.frac.ops': 0.89,
      'math.alg.linear': 0.86,
      'math.alg.ineq': 0.78
    };

    const strugglingItem = selectZpdQuestionForStudent(math, strugglingMastery, []);
    const advancedItem = selectZpdQuestionForStudent(math, advancedMastery, []);

    expect(strugglingItem.conceptId).toBe('math.frac.equiv');
    expect(strugglingItem.difficulty).toBeLessThan(advancedItem.difficulty);
    expect(advancedItem.conceptId).toBe('math.alg.ineq');
  });
});
