import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { WebSocket } from 'ws';
import { createServerStack } from '../src/infrastructure/app.js';

describe('ATDD Acceptance: Mastery League Agent-Ready API, Gameplay & WebSocket Live Rooms', () => {
  it('exposes /api/health, /api/openapi.json, and /api/docs per Berlin AI Studio Agent-Ready standard', async () => {
    const { app } = createServerStack();

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.service).toBe('mastery-league');

    const openapi = await request(app).get('/api/openapi.json');
    expect(openapi.status).toBe(200);
    expect(openapi.body.openapi).toBe('3.1.0');
    expect(openapi.body.paths['/api/sessions']).toBeDefined();

    const docs = await request(app).get('/api/docs');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('swagger-ui');

    const curricula = await request(app).get('/api/curricula');
    expect(curricula.status).toBe(200);
    expect(curricula.body.curricula.length).toBe(2);

    const safetyCheck = await request(app)
      .post('/api/safety/check')
      .send({ text: 'test@school.edu' });
    expect(safetyCheck.status).toBe(200);
    expect(safetyCheck.body.allowed).toBe(false);

    const missingSession = await request(app).get('/api/sessions/9999');
    expect(missingSession.status).toBe(404);
  });

  it('serves the zero-auth interactive classroom arena web UI at /', async () => {
    const { app } = createServerStack();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Mastery League');
    expect(res.text).toContain('closedby="any"');
  });

  it('runs a full 4-round classroom session with adaptive ZPD questions, AI classmates, and Teacher Mastery Radar', async () => {
    const { app } = createServerStack();

    const created = await request(app).post('/api/sessions').send({
      title: 'Grade 7 Math Period 2',
      curriculumId: 'middle-school-math',
      mode: 'hybrid_arena',
      totalRounds: 4,
      withDemoClassmates: true
    });
    expect(created.status).toBe(201);
    const pin: string = created.body.pin;
    expect(pin).toMatch(/^\d{4}$/);
    expect(created.body.students.length).toBe(5);

    const blockedJoin = await request(app)
      .post(`/api/sessions/${pin}/join`)
      .send({ handle: 'kid@school.org', skillPreset: 'developing' });
    expect(blockedJoin.status).toBe(400);

    const joined = await request(app)
      .post(`/api/sessions/${pin}/join`)
      .send({ handle: 'Alex', skillPreset: 'developing' });
    expect(joined.status).toBe(200);
    const alex = joined.body.student;
    expect(alex.handle).toBe('Alex');

    for (let round = 1; round <= 4; round += 1) {
      const started = await request(app).post(`/api/sessions/${pin}/rounds/next`).send({});
      expect(started.status).toBe(200);
      expect(started.body.currentRound).toBe(round);

      const me = started.body.students.find((s: { id: string }) => s.id === alex.id);
      expect(me.activeQuestion).toBeDefined();

      const answered = await request(app).post(`/api/sessions/${pin}/answers`).send({
        studentId: alex.id,
        questionId: me.activeQuestion.questionId,
        selectedIndex: 0,
        responseMs: 3200
      });
      expect(answered.status).toBe(200);
      const updatedMe = answered.body.students.find((s: { id: string }) => s.id === alex.id);
      expect(updatedMe.lastRoundOutcome).toBeDefined();
    }

    const finalState = await request(app).get(`/api/sessions/${pin}`);
    expect(finalState.status).toBe(200);
    expect(finalState.body.status).toBe('completed');
    expect(finalState.body.teacherRadar.conceptSummaries.length).toBeGreaterThan(0);
  });

  it('broadcasts live classroom updates over WebSocket /ws when students join and start rounds', async () => {
    const { httpServer } = createServerStack();
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', () => resolve()));
    const address = httpServer.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const createdRes = await fetch(`http://127.0.0.1:${port}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Live WS Science Lab',
          curriculumId: 'middle-school-science',
          mode: 'last_student_standing',
          totalRounds: 3,
          withDemoClassmates: false
        })
      });
      const created = (await createdRes.json()) as { pin: string };

      const wsMessagePromise = new Promise<{ type: string; pin: string }>((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        const timer = setTimeout(() => {
          ws.close();
          reject(new Error('Timed out waiting for WS session_updated event'));
        }, 4000);

        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'subscribe', pin: created.pin }));
          void fetch(`http://127.0.0.1:${port}/api/sessions/${created.pin}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle: 'Nora', skillPreset: 'advanced' })
          });
        });

        ws.on('message', (raw) => {
          const parsed = JSON.parse(raw.toString()) as { type: string; pin: string };
          if (parsed.type === 'session_updated') {
            clearTimeout(timer);
            ws.close();
            resolve(parsed);
          }
        });
      });

      const event = await wsMessagePromise;
      expect(event.type).toBe('session_updated');
      expect(event.pin).toBe(created.pin);
    } finally {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });
});
