export type SkillPreset = 'struggling' | 'developing' | 'advanced';

export type GameMode = 'hybrid_arena' | 'speed_sprint' | 'last_student_standing';

export type RoundPhase = 'speed_sprint' | 'last_student_standing';

export interface BktParameters {
  readonly priorMastery: number;
  readonly learnRate: number;
  readonly slipRate: number;
  readonly guessRate: number;
}

export interface ConceptNode {
  readonly id: string;
  readonly title: string;
  readonly gradeBand: string;
  readonly prerequisites: readonly string[];
  readonly bkt: BktParameters;
}

export interface DistractorMisconception {
  readonly optionIndex: number;
  readonly tag: string;
  readonly diagnosis: string;
  readonly remediation: string;
}

export interface QuestionItem {
  readonly id: string;
  readonly conceptId: string;
  readonly difficulty: number;
  readonly tierLabel: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly misconceptions: readonly DistractorMisconception[];
}

export interface CurriculumGraph {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly gradeBand: string;
  readonly description: string;
  readonly concepts: readonly ConceptNode[];
  readonly questions: readonly QuestionItem[];
}

export interface BktUpdateInput {
  readonly priorMastery: number;
  readonly isCorrect: boolean;
  readonly responseMs: number;
  readonly params: BktParameters;
}

export interface BktUpdateResult {
  readonly posteriorMastery: number;
  readonly delta: number;
  readonly rapidGuess: boolean;
  readonly verifiedMastery: boolean;
}

export interface MisconceptionRecord {
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly questionId: string;
  readonly tag: string;
  readonly diagnosis: string;
  readonly remediation: string;
  readonly roundNumber: number;
}

export interface StudentParticipant {
  readonly id: string;
  readonly handle: string;
  readonly isBot: boolean;
  readonly skillPreset: SkillPreset;
  readonly masteryByConcept: Readonly<Record<string, number>>;
  readonly initialMasteryAvg: number;
  readonly currentMasteryAvg: number;
  readonly score: number;
  readonly shields: number;
  readonly maxShields: number;
  readonly eliminated: boolean;
  readonly streak: number;
  readonly rapidGuessCount: number;
  readonly seenQuestionIds: readonly string[];
  readonly misconceptions: readonly MisconceptionRecord[];
  readonly activeQuestion?: AssignedQuestionView;
  readonly lastRoundOutcome?: RoundAnswerOutcome;
}

export interface AssignedQuestionView {
  readonly questionId: string;
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly difficulty: number;
  readonly tierLabel: string;
  readonly targetMasteryPrior: number;
  readonly prompt: string;
  readonly options: readonly string[];
}

export interface RoundAnswerOutcome {
  readonly roundNumber: number;
  readonly phase: RoundPhase;
  readonly questionId: string;
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly tierLabel: string;
  readonly isCorrect: boolean;
  readonly rapidGuess: boolean;
  readonly pointsAwarded: number;
  readonly masteryBefore: number;
  readonly masteryAfter: number;
  readonly shieldsRemaining: number;
  readonly eliminatedNow: boolean;
  readonly explanation: string;
  readonly misconception?: MisconceptionRecord;
}

export interface TeacherConceptSummary {
  readonly conceptId: string;
  readonly conceptTitle: string;
  readonly averageMastery: number;
  readonly verifiedCount: number;
  readonly strugglingCount: number;
}

export interface TeacherRadarReport {
  readonly classAverageMastery: number;
  readonly classAverageGain: number;
  readonly activeSurvivors: number;
  readonly totalStudents: number;
  readonly rapidGuessAlerts: number;
  readonly conceptSummaries: readonly TeacherConceptSummary[];
  readonly topMisconceptions: readonly MisconceptionRecord[];
}

export interface ClassroomSession {
  readonly pin: string;
  readonly title: string;
  readonly curriculumId: string;
  readonly curriculumTitle: string;
  readonly mode: GameMode;
  readonly status: 'lobby' | 'active_round' | 'completed';
  readonly currentRound: number;
  readonly totalRounds: number;
  readonly currentPhase: RoundPhase;
  readonly roundDurationMs: number;
  readonly withDemoClassmates: boolean;
  readonly createdAt: string;
  readonly students: readonly StudentParticipant[];
  readonly teacherRadar: TeacherRadarReport;
}
