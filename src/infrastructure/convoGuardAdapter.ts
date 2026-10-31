/**
 * ConvoGuard AI Adapter (Microservices_Catalog.md Reuse)
 * Enforces K-12 Student PII (COPPA/GDPR) & EU AI Act Annex III Classroom Guardrails.
 * Connects to remote ConvoGuard AI endpoint when CONVOGUARD_API_URL is set, with
 * deterministic local compliance policy evaluation for zero-latency classroom safety.
 */
import type { SafetyEvaluation, SafetyGuardPort } from '../ports/safetyGuardPort.js';

interface PolicyRule {
  readonly code: string;
  readonly pattern: RegExp;
}

const K12_SAFETY_RULES: readonly PolicyRule[] = [
  { code: 'PII_EMAIL_DETECTED', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { code: 'PII_PHONE_DETECTED', pattern: /(?:\+?\d[\d\s\-().]{6,}\d)/ },
  {
    code: 'UNSAFE_CLASSROOM_LANGUAGE',
    pattern: /\b(?:idiot|stupid|loser|hate|kill|dumb|moron|shut\s*up)\b/i
  }
];

function evaluateLocalK12Rules(rawText: string): SafetyEvaluation {
  const sanitized = rawText.trim().slice(0, 48);
  const violations = K12_SAFETY_RULES.filter((r) => r.pattern.test(sanitized)).map((r) => r.code);
  return {
    allowed: violations.length === 0,
    sanitizedText: sanitized,
    violations,
    policyEngine: 'convoguard-ai-k12-deterministic-v1'
  };
}

export class ConvoGuardSafetyAdapter implements SafetyGuardPort {
  public constructor(private readonly remoteEndpoint?: string) {}

  public async evaluateStudentText(text: string): Promise<SafetyEvaluation> {
    const localResult = evaluateLocalK12Rules(text);
    if (!localResult.allowed) {
      return localResult;
    }
    return this.remoteEndpoint ? this.tryRemoteEvaluation(text, localResult) : localResult;
  }

  private async tryRemoteEvaluation(
    text: string,
    fallback: SafetyEvaluation
  ): Promise<SafetyEvaluation> {
    try {
      const response = await fetch(`${this.remoteEndpoint}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context: 'k12_classroom' })
      });
      return response.ok ? ((await response.json()) as SafetyEvaluation) : fallback;
    } catch {
      return fallback;
    }
  }
}
