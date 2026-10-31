import type { ClassroomSession } from '../domain/types.js';

export interface ClassroomBroadcasterPort {
  broadcastSessionUpdate(session: ClassroomSession): void;
}
