import type { ClassroomSession } from '../domain/types.js';

export interface SessionRepositoryPort {
  save(session: ClassroomSession): void;
  findByPin(pin: string): ClassroomSession | undefined;
  listActive(): readonly ClassroomSession[];
}
