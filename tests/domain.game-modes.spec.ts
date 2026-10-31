import { describe, expect, it } from 'vitest';
import {
  calculateRoundPoints,
  determinePhaseForRound,
  evaluateShieldSurvival,
  classifyDistractorMisconception
} from '../src/domain/gameRules.js';
import { getCurriculumById } from '../src/domain/curriculumCatalog.js';

describe('Classroom Game Modes: Speed Sprint & Last-Student-Standing', () => {
  it('transitions hybrid_arena from speed_sprint in early rounds to last_student_standing in elimination rounds', () => {
    expect(determinePhaseForRound('hybrid_arena', 1)).toBe('speed_sprint');
    expect(determinePhaseForRound('hybrid_arena', 2)).toBe('speed_sprint');
    expect(determinePhaseForRound('hybrid_arena', 3)).toBe('last_student_standing');
    expect(determinePhaseForRound('speed_sprint', 4)).toBe('speed_sprint');
    expect(determinePhaseForRound('last_student_standing', 1)).toBe('last_student_standing');
  });

  it('awards zero points for incorrect answers or rapid button-mashing guesses', () => {
    expect(
      calculateRoundPoints({
        isCorrect: false,
        rapidGuess: false,
        difficulty: 0.6,
        responseMs: 3000,
        roundDurationMs: 15000,
        masteryDelta: -0.1,
        phase: 'speed_sprint'
      })
    ).toBe(0);

    expect(
      calculateRoundPoints({
        isCorrect: true,
        rapidGuess: true,
        difficulty: 0.6,
        responseMs: 250,
        roundDurationMs: 15000,
        masteryDelta: 0,
        phase: 'speed_sprint'
      })
    ).toBe(0);
  });

  it('rewards mastery growth so a struggling student clearing a misconception competes fairly with an advanced peer', () => {
    const strugglingGainPoints = calculateRoundPoints({
      isCorrect: true,
      rapidGuess: false,
      difficulty: 0.38,
      responseMs: 4500,
      roundDurationMs: 15000,
      masteryDelta: 0.28,
      phase: 'last_student_standing'
    });

    const advancedPoints = calculateRoundPoints({
      isCorrect: true,
      rapidGuess: false,
      difficulty: 0.85,
      responseMs: 5500,
      roundDurationMs: 15000,
      masteryDelta: 0.04,
      phase: 'last_student_standing'
    });

    expect(strugglingGainPoints).toBeGreaterThan(120);
    expect(advancedPoints).toBeGreaterThan(120);
  });

  it('manages shields in Last-Student-Standing and eliminates only when shields drop to zero', () => {
    const kept = evaluateShieldSurvival(2, false, 'speed_sprint', false);
    expect(kept.shieldsRemaining).toBe(2);
    expect(kept.eliminatedNow).toBe(false);

    const firstHit = evaluateShieldSurvival(2, false, 'last_student_standing', false);
    expect(firstHit.shieldsRemaining).toBe(1);
    expect(firstHit.eliminatedNow).toBe(false);

    const knockedOut = evaluateShieldSurvival(1, false, 'last_student_standing', false);
    expect(knockedOut.shieldsRemaining).toBe(0);
    expect(knockedOut.eliminatedNow).toBe(true);
  });

  it('maps wrong distractor selections to exact pedagogical misconceptions and remediations', () => {
    const math = getCurriculumById('middle-school-math')!;
    const question = math.questions[0];
    const wrongIdx = question.options.findIndex((_, idx) => idx !== question.correctIndex);

    const record = classifyDistractorMisconception(question, 'Equivalent Fractions', wrongIdx, 2);
    expect(record).toBeDefined();
    expect(record?.tag.length).toBeGreaterThan(3);
    expect(record?.remediation.length).toBeGreaterThan(10);
  });
});
