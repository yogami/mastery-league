/**
 * Application Layer: Classroom Orchestration Service
 * Coordinates curriculum ontology, BKT mastery updates, ConvoGuard AI child safety, and live broadcasts.
 */
import { updateBktMastery } from '../domain/bktEngine.js';
import { getCurriculumById } from '../domain/curriculumCatalog.js';
import {
  calculateRoundPoints,
  classifyDistractorMisconception,
  determinePhaseForRound,
  evaluateShieldSurvival
} from '../domain/gameRules.js';
import { selectZpdQuestionForStudent } from '../domain/ontologyGraph.js';
import type {
  AssignedQuestionView,
  ClassroomSession,
  CurriculumGraph,
  GameMode,
  QuestionItem,
  RoundPhase,
  SkillPreset,
  StudentParticipant
} from '../domain/types.js';
import type { ClassroomBroadcasterPort } from '../ports/broadcasterPort.js';
import type { SafetyGuardPort } from '../ports/safetyGuardPort.js';
import type { SessionRepositoryPort } from '../ports/sessionRepositoryPort.js';
import {
  computeMasteryAverage,
  createDemoClassmates,
  createInitialMasteryMap,
  simulateBotResponse
} from './demoSimulator.js';
import { buildTeacherRadar } from './teacherAnalytics.js';

export interface CreateSessionInput {
  readonly title?: string;
  readonly curriculumId?: string;
  readonly mode?: GameMode;
  readonly totalRounds?: number;
  readonly roundDurationMs?: number;
  readonly withDemoClassmates?: boolean;
}

export interface JoinSessionInput {
  readonly pin: string;
  readonly handle: string;
  readonly skillPreset?: SkillPreset;
}

export interface SubmitAnswerInput {
  readonly pin: string;
  readonly studentId: string;
  readonly questionId: string;
  readonly selectedIndex: number;
  readonly responseMs: number;
}

export class ClassroomValidationError extends Error {
  public readonly statusCode: number;

  public constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ClassroomService {
  private pinSequence = 4810;
  private studentSequence = 100;

  public constructor(
    private readonly repo: SessionRepositoryPort,
    private readonly safetyGuard: SafetyGuardPort,
    private readonly broadcaster: ClassroomBroadcasterPort
  ) {}

  private allocatePin(): string {
    this.pinSequence += 1;
    return String(this.pinSequence).slice(-4).padStart(4, '0');
  }

  private resolveCurriculum(curriculumId?: string): CurriculumGraph {
    const id = curriculumId === undefined ? 'middle-school-math' : curriculumId;
    const found = getCurriculumById(id);
    if (!found) {
      throw new ClassroomValidationError(`Unknown curriculumId: ${id}`, 400);
    }
    return found;
  }

  private requireSession(pin: string): ClassroomSession {
    const found = this.repo.findByPin(pin);
    if (!found) {
      throw new ClassroomValidationError(`Classroom PIN ${pin} not found`, 404);
    }
    return found;
  }

  private persistAndBroadcast(session: ClassroomSession): ClassroomSession {
    this.repo.save(session);
    this.broadcaster.broadcastSessionUpdate(session);
    return session;
  }

  public async createSession(input: CreateSessionInput): Promise<ClassroomSession> {
    const titleText = input.title === undefined ? 'Grade 7 Live Mastery Arena' : input.title;
    await this.assertSafeText(titleText);
    const curriculum = this.resolveCurriculum(input.curriculumId);
    const withBots = input.withDemoClassmates !== false;
    const students = withBots ? createDemoClassmates(curriculum) : [];
    const session = this.composeNewSession(input, titleText, curriculum, withBots, students);
    return this.persistAndBroadcast(session);
  }

  private normalizeMode(mode?: GameMode): GameMode {
    return mode === undefined ? 'hybrid_arena' : mode;
  }

  private normalizeRounds(totalRounds?: number): number {
    const raw = totalRounds === undefined ? 4 : totalRounds;
    return Math.min(8, Math.max(2, raw));
  }

  private composeNewSession(
    input: CreateSessionInput,
    title: string,
    curriculum: CurriculumGraph,
    withDemoClassmates: boolean,
    students: readonly StudentParticipant[]
  ): ClassroomSession {
    const mode = this.normalizeMode(input.mode);
    const roundDurationMs = input.roundDurationMs === undefined ? 15000 : input.roundDurationMs;
    return {
      pin: this.allocatePin(),
      title,
      curriculumId: curriculum.id,
      curriculumTitle: curriculum.title,
      mode,
      status: 'lobby',
      currentRound: 0,
      totalRounds: this.normalizeRounds(input.totalRounds),
      currentPhase: determinePhaseForRound(mode, 1),
      roundDurationMs,
      withDemoClassmates,
      createdAt: new Date().toISOString(),
      students,
      teacherRadar: buildTeacherRadar(curriculum, students)
    };
  }

  private async assertSafeText(rawText: string): Promise<string> {
    const trimmed = rawText.trim();
    if (trimmed.length < 2) {
      throw new ClassroomValidationError('Text must be at least 2 characters.', 400);
    }
    const safety = await this.safetyGuard.evaluateStudentText(trimmed);
    if (!safety.allowed) {
      throw new ClassroomValidationError(
        `Blocked by ConvoGuard AI child-safety policy: ${safety.violations.join(', ')}`,
        400
      );
    }
    return safety.sanitizedText;
  }

  public async joinSession(
    input: JoinSessionInput
  ): Promise<{ readonly session: ClassroomSession; readonly student: StudentParticipant }> {
    const session = this.requireSession(input.pin);
    const cleanHandle = await this.assertSafeText(input.handle);
    const curriculum = this.resolveCurriculum(session.curriculumId);
    const preset: SkillPreset = input.skillPreset === undefined ? 'developing' : input.skillPreset;
    const student = this.buildHumanParticipant(cleanHandle, curriculum, preset);
    const students = [student, ...session.students];
    const updated: ClassroomSession = {
      ...session,
      students,
      teacherRadar: buildTeacherRadar(curriculum, students)
    };
    return { session: this.persistAndBroadcast(updated), student };
  }

  private buildHumanParticipant(
    handle: string,
    curriculum: CurriculumGraph,
    preset: SkillPreset
  ): StudentParticipant {
    this.studentSequence += 1;
    const masteryByConcept = createInitialMasteryMap(curriculum, preset);
    const avg = computeMasteryAverage(masteryByConcept);
    return {
      id: `stu-${this.studentSequence}`,
      handle,
      isBot: false,
      skillPreset: preset,
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
  }

  public getSession(pin: string): ClassroomSession {
    return this.requireSession(pin);
  }

  public startNextRound(pin: string): ClassroomSession {
    const session = this.requireSession(pin);
    if (session.currentRound >= session.totalRounds) {
      return this.persistAndBroadcast({ ...session, status: 'completed' });
    }
    const curriculum = this.resolveCurriculum(session.curriculumId);
    const nextRound = session.currentRound + 1;
    const nextPhase = determinePhaseForRound(session.mode, nextRound);
    const students = session.students.map((s) => this.assignQuestionToStudent(s, curriculum));
    return this.persistAndBroadcast({
      ...session,
      status: 'active_round',
      currentRound: nextRound,
      currentPhase: nextPhase,
      students,
      teacherRadar: buildTeacherRadar(curriculum, students)
    });
  }

  private assignQuestionToStudent(
    student: StudentParticipant,
    curriculum: CurriculumGraph
  ): StudentParticipant {
    const item = selectZpdQuestionForStudent(
      curriculum,
      student.masteryByConcept,
      student.seenQuestionIds
    );
    const concept = curriculum.concepts.find((c) => c.id === item.conceptId) ?? curriculum.concepts[0];
    const activeQuestion: AssignedQuestionView = {
      questionId: item.id,
      conceptId: item.conceptId,
      conceptTitle: concept.title,
      difficulty: item.difficulty,
      tierLabel: item.tierLabel,
      targetMasteryPrior: student.masteryByConcept[item.conceptId] ?? concept.bkt.priorMastery,
      prompt: item.prompt,
      options: item.options
    };
    return { ...student, activeQuestion };
  }

  public submitAnswer(input: SubmitAnswerInput): ClassroomSession {
    const session = this.requireSession(input.pin);
    const curriculum = this.resolveCurriculum(session.curriculumId);
    const students = session.students.map((s) =>
      this.resolveParticipantTurn(s, input, session, curriculum)
    );
    const sorted = [...students].sort((a, b) => b.score - a.score);
    const nextStatus = this.computePostAnswerStatus(session, sorted);
    return this.persistAndBroadcast({
      ...session,
      status: nextStatus,
      students: sorted,
      teacherRadar: buildTeacherRadar(curriculum, sorted)
    });
  }

  private computePostAnswerStatus(
    session: ClassroomSession,
    students: readonly StudentParticipant[]
  ): ClassroomSession['status'] {
    const allAnswered = students.every((s) => s.activeQuestion === undefined);
    if (!allAnswered) {
      return session.status;
    }
    return session.currentRound >= session.totalRounds ? 'completed' : 'active_round';
  }

  private shouldSimulateBot(student: StudentParticipant): boolean {
    if (!student.isBot) {
      return false;
    }
    return student.activeQuestion !== undefined;
  }

  private resolveParticipantTurn(
    student: StudentParticipant,
    input: SubmitAnswerInput,
    session: ClassroomSession,
    curriculum: CurriculumGraph
  ): StudentParticipant {
    if (student.id === input.studentId) {
      return this.applyStudentAnswer(
        student,
        input.questionId,
        input.selectedIndex,
        input.responseMs,
        session,
        curriculum
      );
    }
    return this.shouldSimulateBot(student)
      ? this.applyBotTurn(student, session, curriculum)
      : student;
  }

  private applyBotTurn(
    bot: StudentParticipant,
    session: ClassroomSession,
    curriculum: CurriculumGraph
  ): StudentParticipant {
    const qId = bot.activeQuestion!.questionId;
    const item = this.findQuestion(curriculum, qId);
    const sim = simulateBotResponse(bot, item, session.currentRound);
    return this.applyStudentAnswer(
      bot,
      qId,
      sim.selectedIndex,
      sim.responseMs,
      session,
      curriculum
    );
  }

  private findQuestion(curriculum: CurriculumGraph, questionId: string): QuestionItem {
    const found = curriculum.questions.find((q) => q.id === questionId);
    if (!found) {
      throw new ClassroomValidationError(`Unknown questionId: ${questionId}`, 400);
    }
    return found;
  }

  private applyStudentAnswer(
    student: StudentParticipant,
    questionId: string,
    selectedIndex: number,
    responseMs: number,
    session: ClassroomSession,
    curriculum: CurriculumGraph
  ): StudentParticipant {
    const question = this.findQuestion(curriculum, questionId);
    const concept = curriculum.concepts.find((c) => c.id === question.conceptId) ?? curriculum.concepts[0];
    const prior = student.masteryByConcept[concept.id] ?? concept.bkt.priorMastery;
    const isCorrect = selectedIndex === question.correctIndex;
    const bkt = updateBktMastery({ priorMastery: prior, isCorrect, responseMs, params: concept.bkt });
    return this.buildUpdatedStudent(
      student,
      question,
      concept.title,
      selectedIndex,
      responseMs,
      prior,
      bkt,
      session.currentRound,
      session.currentPhase,
      session.roundDurationMs
    );
  }

  private appendOptionalRecord<T>(list: readonly T[], item: T | undefined): readonly T[] {
    return item ? [...list, item] : list;
  }

  private mergeStudentCounters(
    student: StudentParticipant,
    isCorrect: boolean,
    rapidGuess: boolean,
    eliminatedNow: boolean
  ): Pick<StudentParticipant, 'eliminated' | 'streak' | 'rapidGuessCount'> {
    return {
      eliminated: student.eliminated ? true : eliminatedNow,
      streak: isCorrect ? student.streak + 1 : 0,
      rapidGuessCount: student.rapidGuessCount + Number(rapidGuess)
    };
  }

  private buildUpdatedStudent(
    student: StudentParticipant,
    question: QuestionItem,
    conceptTitle: string,
    selectedIndex: number,
    responseMs: number,
    prior: number,
    bkt: ReturnType<typeof updateBktMastery>,
    roundNumber: number,
    phase: RoundPhase,
    roundDurationMs: number
  ): StudentParticipant {
    const isCorrect = selectedIndex === question.correctIndex;
    const points = calculateRoundPoints({
      isCorrect,
      rapidGuess: bkt.rapidGuess,
      difficulty: question.difficulty,
      responseMs,
      roundDurationMs,
      masteryDelta: bkt.delta,
      phase
    });
    const shieldRes = evaluateShieldSurvival(student.shields, student.eliminated, phase, isCorrect);
    const misconception = classifyDistractorMisconception(question, conceptTitle, selectedIndex, roundNumber);
    const masteryByConcept = { ...student.masteryByConcept, [question.conceptId]: bkt.posteriorMastery };
    const counters = this.mergeStudentCounters(student, isCorrect, bkt.rapidGuess, shieldRes.eliminatedNow);
    return {
      ...student,
      ...counters,
      masteryByConcept,
      currentMasteryAvg: computeMasteryAverage(masteryByConcept),
      score: student.score + points,
      shields: shieldRes.shieldsRemaining,
      seenQuestionIds: [...student.seenQuestionIds, question.id],
      misconceptions: this.appendOptionalRecord(student.misconceptions, misconception),
      activeQuestion: undefined,
      lastRoundOutcome: {
        roundNumber,
        phase,
        questionId: question.id,
        conceptId: question.conceptId,
        conceptTitle,
        tierLabel: question.tierLabel,
        isCorrect,
        rapidGuess: bkt.rapidGuess,
        pointsAwarded: points,
        masteryBefore: prior,
        masteryAfter: bkt.posteriorMastery,
        shieldsRemaining: shieldRes.shieldsRemaining,
        eliminatedNow: shieldRes.eliminatedNow,
        explanation: question.explanation,
        misconception
      }
    };
  }
}
