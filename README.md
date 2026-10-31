# Mastery League

Social classroom gaming and measurable mastery for school students and teachers.

## What Mastery League Solves

Live classroom quiz games generate excitement in a room, yet serve the exact same static question to every student on the same timer. The top two or three students win every match while struggling classmates get eliminated early and tap answers at random. Solo adaptive platforms adjust difficulty per child, yet isolate students on silent individual screens.

Mastery League lets a full school classroom compete together in real time across **Speed Sprints** and **Last-Student-Standing** survival rounds while a deterministic **Bayesian Knowledge Tracing (BKT) and Prerequisite Ontology Engine** calibrates each student's prompt to their individual Zone of Proximal Development (ZPD).

* A struggling student clearing a foundational fraction misconception survives a Last-Student-Standing round right alongside an advanced peer solving multi-step algebraic inequalities.
* Rapid sub-1.2s wrong clicks trigger an anti-guessing guard that awards zero points and prevents downward handicap sandbagging.
* Teachers receive a live **Concept Mastery & Misconception Radar** mapping wrong distractor choices directly to pedagogical misconceptions and micro-remediations.
* Student handles and classroom lobbies pass through **ConvoGuard AI** child-safety and PII filters (`PII_EMAIL_DETECTED`, `PII_PHONE_DETECTED`, `UNSAFE_CLASSROOM_LANGUAGE`).

## Hexagonal Architecture & Scientific Labels

Built under the Berlin AI Automation Studio governance protocol ([RULES.md](../Studio_Second_Brain/03_Resources/RULES.md) and [Microservices_Catalog.md](../Studio_Second_Brain/03_Resources/Microservices_Catalog.md)):

* `specs/`: Product, mathematical, and REST/WebSocket specifications authored prior to implementation.
* `tests/`: ATDD acceptance and TDD unit specs (`>= 80%` enforced coverage across statements, branches, functions, and lines).
* `src/domain/` (`[VERIFIED ENGINE]`): Pure TypeScript Bayesian Knowledge Tracing posterior updater, prerequisite DAG frontier resolver, ZPD handicap item selector, survival shield rules, and middle-school Math & Science ontology catalogs. Zero stochastic multipliers.
* `src/ports/`: Hexagonal interfaces for session storage, real-time WebSocket broadcasting, and `ConvoGuard AI` child-safety evaluation.
* `src/application/`: Classroom session orchestration, Teacher Mastery Radar aggregation (`[VERIFIED ENGINE]`), and deterministic-seed demo classmate simulation (`[HEURISTIC PROTOTYPE]` in `src/application/demoSimulator.ts` for 1-click solo evaluation).
* `src/infrastructure/`: Express 5 + WebSocket (`/ws`) server, `ConvoGuardSafetyAdapter`, OpenAPI 3.1 manifest (`/api/openapi.json`), Swagger UI (`/api/docs`), and modern responsive web client.

## Quickstart

```bash
npm install
npm run test:coverage
npm run lint
npm run build
npm start
```

Open `http://localhost:3000` for the 1-click Classroom Arena, `http://localhost:3000/api/docs` for Swagger UI, and `http://localhost:3000/api/openapi.json` for the Agent-Ready OpenAPI 3.1 manifest.

## Founders

* **Yami Gopal**: Backend & Production Agent Systems Engineer, Berlin AI Labs (`berlinailabs.de`) | `gopal.yami@gmail.com` | [LinkedIn](https://www.linkedin.com/in/yami-g-b170294/)
* **Piyush Rungta**: Enterprise Systems & Knowledge Graph Architect | `ricky.rungta@gmail.com` | [LinkedIn](https://www.linkedin.com/in/piyush-rungta/)
