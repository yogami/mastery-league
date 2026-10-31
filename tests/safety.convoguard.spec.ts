import { describe, expect, it } from 'vitest';
import { ConvoGuardSafetyAdapter } from '../src/infrastructure/convoGuardAdapter.js';

describe('ConvoGuard AI K-12 Child-Safety & PII Compliance Adapter', () => {
  const guard = new ConvoGuardSafetyAdapter();

  it('allows clean student classroom nicknames', async () => {
    const result = await guard.evaluateStudentText('Maya_7B');
    expect(result.allowed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.sanitizedText).toBe('Maya_7B');
  });

  it('blocks student email PII from entering a classroom lobby', async () => {
    const result = await guard.evaluateStudentText('leo.student@school.edu');
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain('PII_EMAIL_DETECTED');
  });

  it('blocks student phone number PII from entering a classroom lobby', async () => {
    const result = await guard.evaluateStudentText('Call me +49 170 5551234');
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain('PII_PHONE_DETECTED');
  });

  it('blocks unsafe or abusive handles under K-12 classroom safety policy', async () => {
    const result = await guard.evaluateStudentText('stupid idiot');
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain('UNSAFE_CLASSROOM_LANGUAGE');
  });
});
