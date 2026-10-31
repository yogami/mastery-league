import { createServer, type Server as HttpServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type Response } from 'express';
import {
  ClassroomService,
  ClassroomValidationError
} from '../application/classroomService.js';
import { listCurricula } from '../domain/curriculumCatalog.js';
import { ConvoGuardSafetyAdapter } from './convoGuardAdapter.js';
import { InMemorySessionRepository } from './inMemorySessionRepo.js';
import { buildOpenApiSpec, renderSwaggerHtml } from './openapi.js';
import { WsClassroomBroadcaster } from './wsBroadcaster.js';

export interface ServerStack {
  readonly app: Express;
  readonly httpServer: HttpServer;
  readonly classroomService: ClassroomService;
}

function resolvePublicDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(currentDir, 'public');
}

function sendErrorResponse(res: Response, err: unknown): void {
  if (err instanceof ClassroomValidationError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ error: message });
}

function registerMetaRoutes(app: Express, safety: ConvoGuardSafetyAdapter): void {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'mastery-league',
      engine: 'VERIFIED_BKT_ONTOLOGY_V1',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/openapi.json', (_req, res) => {
    res.json(buildOpenApiSpec());
  });

  app.get('/api/docs', (_req, res) => {
    res.type('html').send(renderSwaggerHtml());
  });

  app.get('/api/curricula', (_req, res) => {
    res.json({ curricula: listCurricula() });
  });

  app.post('/api/safety/check', async (req, res) => {
    const raw = typeof req.body?.text === 'string' ? req.body.text : '';
    const verdict = await safety.evaluateStudentText(raw);
    res.json(verdict);
  });
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function parseJoinBody(pin: string, body: Record<string, unknown>) {
  return {
    pin,
    handle: asString(body.handle),
    skillPreset: body.skillPreset as 'struggling' | 'developing' | 'advanced' | undefined
  };
}

function parseAnswerBody(pin: string, body: Record<string, unknown>) {
  return {
    pin,
    studentId: asString(body.studentId),
    questionId: asString(body.questionId),
    selectedIndex: asNumber(body.selectedIndex, -1),
    responseMs: asNumber(body.responseMs, 3000)
  };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body === 'object' && body !== null) {
    return body as Record<string, unknown>;
  }
  return {};
}

function registerSessionRoutes(app: Express, service: ClassroomService): void {
  app.post('/api/sessions', async (req: Request, res: Response) => {
    try {
      const created = await service.createSession(asRecord(req.body));
      res.status(201).json(created);
    } catch (err) {
      sendErrorResponse(res, err);
    }
  });

  app.get('/api/sessions/:pin', (req: Request, res: Response) => {
    try {
      res.json(service.getSession(String(req.params.pin)));
    } catch (err) {
      sendErrorResponse(res, err);
    }
  });

  app.post('/api/sessions/:pin/join', async (req: Request, res: Response) => {
    try {
      const joined = await service.joinSession(
        parseJoinBody(String(req.params.pin), asRecord(req.body))
      );
      res.json(joined);
    } catch (err) {
      sendErrorResponse(res, err);
    }
  });

  app.post('/api/sessions/:pin/rounds/next', (req: Request, res: Response) => {
    try {
      res.json(service.startNextRound(String(req.params.pin)));
    } catch (err) {
      sendErrorResponse(res, err);
    }
  });

  app.post('/api/sessions/:pin/answers', (req: Request, res: Response) => {
    try {
      res.json(
        service.submitAnswer(parseAnswerBody(String(req.params.pin), asRecord(req.body)))
      );
    } catch (err) {
      sendErrorResponse(res, err);
    }
  });
}

export function createServerStack(): ServerStack {
  const app = express();
  app.use(express.json());

  const repo = new InMemorySessionRepository();
  const safety = new ConvoGuardSafetyAdapter(process.env.CONVOGUARD_API_URL);
  const broadcaster = new WsClassroomBroadcaster();
  const classroomService = new ClassroomService(repo, safety, broadcaster);

  registerMetaRoutes(app, safety);
  registerSessionRoutes(app, classroomService);

  const publicDir = resolvePublicDir();
  app.use(express.static(publicDir));
  app.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  const httpServer = createServer(app);
  broadcaster.attach(httpServer);

  return { app, httpServer, classroomService };
}
