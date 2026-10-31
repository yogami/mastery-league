import type { ClassroomSession } from '../domain/types.js';
import type { SessionRepositoryPort } from '../ports/sessionRepositoryPort.js';

export class InMemorySessionRepository implements SessionRepositoryPort {
  private readonly store = new Map<string, ClassroomSession>();

  public save(session: ClassroomSession): void {
    this.store.set(session.pin, session);
  }

  public findByPin(pin: string): ClassroomSession | undefined {
    return this.store.get(pin);
  }

  public listActive(): readonly ClassroomSession[] {
    return [...this.store.values()];
  }
}
