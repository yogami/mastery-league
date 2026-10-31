/**
 * [HEURISTIC PROTOTYPE] Deterministic Classroom Bot Simulator
 * Populates 1-click demo classrooms with 5 multi-ability classmates so solo reviewers
 * immediately experience mixed-skill handicap competition without an empty lobby.
 */
import type {
  CurriculumGraph,
  QuestionItem,
  SkillPreset,
  StudentParticipant
} from '../domain/types.js';

interface BotArchetype {
  readonly id: string;
  readonly handle: string;
  readonly skillPreset: SkillPreset;
  readonly baseAccuracy: number;
  readonly baseLatencyMs: number;
}

const DEMO_CLASSMATES: readonly BotArchetype[] = [
  { id: 'bot-leo', handle: 'Leo (Needs Support)', skillPreset: 'struggling', baseAccuracy: 0.68, baseLatencyMs: 6200 },
  { id: 'bot-sara', handle: 'Sara (Building)', skillPreset: 'struggling', baseAccuracy: 0.74, baseLatencyMs: 5400 },
  { id: 'bot-noah', handle: 'Noah (On Track)', skillPreset: 'developing', baseAccuracy: 0.72, baseLatencyMs: 4300 },
  { id: 'bot-mila', handle: 'Mila (Steady)', skillPreset: 'developing', baseAccuracy: 0.66, baseLatencyMs: 4900 },
  { id: 'bot-maya', handle: 'Maya (Advanced)', skillPreset: 'advanced', baseAccuracy: 0.76, baseLatencyMs: 3800 }
];

const PRESET_SCALES: Readonly<Record<SkillPreset, readonly number[]>> = {
  struggling: [0.3, 0.22, 0.16, 0.12],
  developing: [0.72, 0.48, 0.3, 0.2],
  advanced: [0.9, 0.86, 0.78, 0.62]
};

export function createInitialMasteryMap(
  curriculum: CurriculumGraph,
  preset: SkillPreset
): Record<string, number> {
  const scales = PRESET_SCALES[preset];
  const entries = curriculum.concepts.map((concept, idx) => {
    const fallback = concept.bkt.priorMastery;
    const val = scales[idx] === undefined ? fallback : scales[idx];
    return [concept.id, val] as const;
  });
  return Object.fromEntries(entries);
}

export function computeMasteryAverage(masteryMap: Readonly<Record<string, number>>): number {
  const vals = Object.values(masteryMap);
  if (vals.length === 0) {
    return 0;
  }
  const sum = vals.reduce((acc, v) => acc + v, 0);
  return Number((sum / vals.length).toFixed(4));
}

export function createDemoClassmates(curriculum: CurriculumGraph): readonly StudentParticipant[] {
  return DEMO_CLASSMATES.map((bot) => {
    const masteryByConcept = createInitialMasteryMap(curriculum, bot.skillPreset);
    const avg = computeMasteryAverage(masteryByConcept);
    return {
      id: bot.id,
      handle: bot.handle,
      isBot: true,
      skillPreset: bot.skillPreset,
      masteryByConcept,
      initialMasteryAvg: avg,
      currentMasteryAvg: avg,
      score: 0,
      shields: 2,
      maxShields: 2,
      eliminated: false,
      streak: 0,
      rapidGuessCount: 0,
      seenQuestionIds: [],
      misconceptions: []
    };
  });
}

function deterministicHash(seedText: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function pickWrongOptionIndex(question: QuestionItem, roll: number): number {
  const wrongIndices = question.options
    .map((_, idx) => idx)
    .filter((idx) => idx !== question.correctIndex);
  const pos = Math.floor(roll * wrongIndices.length) % Math.max(1, wrongIndices.length);
  return wrongIndices[pos] ?? 0;
}

export function simulateBotResponse(
  bot: StudentParticipant,
  question: QuestionItem,
  roundNumber: number
): { readonly selectedIndex: number; readonly responseMs: number } {
  const archetype = DEMO_CLASSMATES.find((b) => b.id === bot.id) ?? DEMO_CLASSMATES[2];
  const roll = deterministicHash(`${bot.id}:${question.id}:${roundNumber}`);
  const isCorrect = roll <= archetype.baseAccuracy;
  const jitter = Math.round((roll - 0.5) * 1600);
  return {
    selectedIndex: isCorrect ? question.correctIndex : pickWrongOptionIndex(question, roll),
    responseMs: Math.max(1800, archetype.baseLatencyMs + jitter)
  };
}
