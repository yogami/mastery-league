export interface SafetyEvaluation {
  readonly allowed: boolean;
  readonly sanitizedText: string;
  readonly violations: readonly string[];
  readonly policyEngine: string;
}

export interface SafetyGuardPort {
  evaluateStudentText(text: string): Promise<SafetyEvaluation>;
}
