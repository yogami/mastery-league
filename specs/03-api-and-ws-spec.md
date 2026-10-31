# Specification 03: Agent-Ready HTTP REST & WebSocket Contract

## 1. Required Agent-Ready Endpoints (`RULES.md` Section 1 & 4)
- `GET /api/health` -> `{ status: "ok", service: "mastery-league", engine: "VERIFIED_BKT_ONTOLOGY_V1", timestamp }`
- `GET /api/openapi.json` -> OpenAPI 3.1.0 JSON specification covering all classroom, gameplay, mastery, and safety endpoints.
- `GET /api/docs` -> Interactive Swagger UI rendering `/api/openapi.json`.

## 2. Core Classroom & Gameplay Endpoints
- `GET /api/curricula` -> Lists available K-12 curriculum ontology graphs (`middle-school-math`, `middle-school-science`) with concept nodes and prerequisite edges.
- `POST /api/safety/check` -> Validates student handles or custom classroom prompts through `ConvoGuardSafetyAdapter` (`allowed`, `violations`, `sanitizedText`).
- `POST /api/sessions` -> Creates a new live classroom session with a 4-digit `pin`, selected `curriculumId`, `mode` (`hybrid_arena` | `speed_sprint` | `last_student_standing`), and optional `withDemoClassmates: boolean` (seeds 5 realistic multi-ability classmates for instant 1-click evaluation).
- `POST /api/sessions/:pin/join` -> Joins a student (`handle`, optional `initialSkillPreset`: `struggling` | `developing` | `advanced`) after passing `ConvoGuard AI` check.
- `GET /api/sessions/:pin` -> Returns live classroom lobby/round snapshot, student standings, shield counts, and Teacher Mastery & Misconception Radar.
- `POST /api/sessions/:pin/rounds/next` -> Advances the classroom to the next round and deals each student their personalized ZPD-calibrated question item.
- `POST /api/sessions/:pin/answers` -> Submits `{ studentId, questionId, selectedIndex, responseMs }`, updates BKT mastery posterior, classifies any distractor misconception, resolves AI classmate turns if `withDemoClassmates` is active, updates shields/scores, and broadcasts state over WebSockets.

## 3. WebSocket Real-Time Channel (`/ws`)
- Client sends `{ "type": "subscribe", "pin": "4821" }`.
- Server pushes `{ "type": "session_updated", "pin": "4821", "session": { ... } }` whenever a student joins, a round starts, or answers resolve.
