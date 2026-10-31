const state = {
  pin: null,
  myStudentId: null,
  session: null,
  ws: null,
  questionStartedAt: 0,
  timerHandle: null
};

const el = (id) => document.getElementById(id);

function installDialogLightDismissFallback(dialog) {
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      dialog.close();
    });
  }
}

async function apiJson(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function connectWebSocket(pin) {
  if (state.ws) {
    state.ws.close();
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
  state.ws = ws;

  ws.addEventListener('open', () => {
    el('wsStatusLabel').textContent = 'Live WebSocket Sync Active';
    ws.send(JSON.stringify({ type: 'subscribe', pin }));
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'session_updated' && msg.pin === state.pin) {
      state.session = msg.session;
      renderArena();
    }
  });

  ws.addEventListener('close', () => {
    el('wsStatusLabel').textContent = 'REST Sync Mode';
  });
}

function startCountdownBar(durationMs) {
  clearInterval(state.timerHandle);
  state.questionStartedAt = performance.now();
  const fill = el('timerFill');
  fill.style.transform = 'scaleX(1)';

  state.timerHandle = setInterval(() => {
    const elapsed = performance.now() - state.questionStartedAt;
    const remaining = Math.max(0, 1 - elapsed / durationMs);
    fill.style.transform = `scaleX(${remaining.toFixed(3)})`;
    if (remaining <= 0) {
      clearInterval(state.timerHandle);
    }
  }, 120);
}

function formatPct(val) {
  return `${Math.round((val || 0) * 100)}%`;
}

function formatShields(student) {
  if (student.eliminated) return 'Out (Practice)';
  return `${student.shields} / ${student.maxShields}`;
}

function phaseLabel(phase, round, total) {
  const name = phase === 'last_student_standing' ? 'Last-Student-Standing' : 'Speed Sprint';
  return round === 0 ? `Lobby • ${name}` : `Round ${round} of ${total} • ${name}`;
}

function renderStandingsTable(session) {
  const tbody = el('standingsBody');
  tbody.innerHTML = '';

  session.students.forEach((stu) => {
    const tr = document.createElement('tr');
    if (stu.id === state.myStudentId) tr.classList.add('is-me');
    if (stu.eliminated) tr.classList.add('is-eliminated');

    const tierText = stu.activeQuestion
      ? stu.activeQuestion.tierLabel
      : stu.lastRoundOutcome?.tierLabel || presetTierLabel(stu.skillPreset);

    const delta = stu.currentMasteryAvg - stu.initialMasteryAvg;
    const sign = delta >= 0 ? '+' : '';

    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = stu.id === state.myStudentId ? `${stu.handle} ★` : stu.handle;

    const tdTier = document.createElement('td');
    tdTier.textContent = tierText;

    const tdMastery = document.createElement('td');
    tdMastery.textContent = `${formatPct(stu.currentMasteryAvg)} (${sign}${Math.round(delta * 100)}%)`;

    const tdShields = document.createElement('td');
    tdShields.textContent = formatShields(stu);

    const tdScore = document.createElement('td');
    tdScore.textContent = `${stu.score} pts`;

    tr.append(th, tdTier, tdMastery, tdShields, tdScore);
    tbody.appendChild(tr);
  });
}

function presetTierLabel(preset) {
  if (preset === 'struggling') return 'Tier 1 Foundation';
  if (preset === 'advanced') return 'Tier 3-4 Stretch';
  return 'Tier 2 Core';
}

function renderTeacherRadar(radar) {
  const gainSign = radar.classAverageGain >= 0 ? '+' : '';
  el('radarClassAvg').textContent =
    `Class Mastery: ${formatPct(radar.classAverageMastery)} (${gainSign}${Math.round(radar.classAverageGain * 100)}%)`;
  el('radarSurvivors').textContent =
    `Survivors: ${radar.activeSurvivors} / ${radar.totalStudents}`;

  const bars = el('conceptBars');
  bars.innerHTML = '';
  radar.conceptSummaries.forEach((c) => {
    const row = document.createElement('div');
    row.className = 'concept-row';
    row.innerHTML = `
      <div class="concept-row-top">
        <strong>${escapeHtml(c.conceptTitle)}</strong>
        <span>${formatPct(c.averageMastery)} avg • ${c.verifiedCount} verified • ${c.strugglingCount} need support</span>
      </div>
      <div class="bar-bg"><div class="bar-fg" style="inline-size: ${Math.round(c.averageMastery * 100)}%"></div></div>
    `;
    bars.appendChild(row);
  });

  const feed = el('misconceptionFeed');
  if (!radar.topMisconceptions || radar.topMisconceptions.length === 0) {
    feed.innerHTML = '<p class="muted">No misconceptions triggered yet. Distractor diagnoses appear live here.</p>';
    return;
  }
  feed.innerHTML = '';
  radar.topMisconceptions.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'misc-item';
    div.innerHTML = `
      <strong>R${m.roundNumber} • ${escapeHtml(m.conceptTitle)} (${escapeHtml(m.tag)})</strong>
      <div>${escapeHtml(m.diagnosis)}</div>
      <div class="muted">Fix: ${escapeHtml(m.remediation)}</div>
    `;
    feed.appendChild(div);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function renderStudentStage(session, me) {
  el('lobbyWaitingBox').hidden = true;
  el('questionBox').hidden = true;
  el('outcomeBox').hidden = true;
  el('completedBox').hidden = true;

  if (session.status === 'lobby') {
    el('lobbyWaitingBox').hidden = false;
    return;
  }

  if (me && me.activeQuestion) {
    renderActiveQuestion(session, me);
    return;
  }

  if (me && me.lastRoundOutcome && session.status !== 'completed') {
    renderRoundOutcome(session, me.lastRoundOutcome);
    return;
  }

  renderCompletedSummary(session, me);
}

function renderActiveQuestion(session, me) {
  const q = me.activeQuestion;
  el('questionBox').hidden = false;
  el('qTierChip').textContent = q.tierLabel;
  el('qConceptChip').textContent = q.conceptTitle;
  el('qHandicapNote').textContent =
    `Prior Mastery ${formatPct(q.targetMasteryPrior)} -> Calibrated Item Difficulty ${formatPct(q.difficulty)}`;
  el('qPromptText').textContent = q.prompt;

  const grid = el('optionsGrid');
  grid.innerHTML = '';
  const keys = ['A', 'B', 'C', 'D'];
  q.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-key">${keys[idx] || idx + 1}</span><span>${escapeHtml(optText)}</span>`;
    btn.addEventListener('click', () => void submitMyAnswer(q.questionId, idx));
    grid.appendChild(btn);
  });

  startCountdownBar(session.roundDurationMs);
}

function renderRoundOutcome(session, out) {
  clearInterval(state.timerHandle);
  el('outcomeBox').hidden = false;

  if (out.rapidGuess) {
    el('outcomeHeadline').textContent = 'Rapid-Guess Guard Triggered (< 1.2s)';
  } else {
    el('outcomeHeadline').textContent = out.isCorrect
      ? 'Verified Concept Hit!'
      : 'Misconception Detected';
  }

  el('outcomePoints').textContent = `+${out.pointsAwarded} pts`;
  el('outcomeMasteryLine').textContent =
    `${out.conceptTitle} Mastery: ${formatPct(out.masteryBefore)} -> ${formatPct(out.masteryAfter)}`;
  el('outcomeExplanation').textContent = out.explanation;

  const miscBox = el('outcomeMisconceptionBox');
  if (out.misconception) {
    miscBox.hidden = false;
    miscBox.innerHTML = `
      <strong>Diagnosed Trap: ${escapeHtml(out.misconception.tag)}</strong><br/>
      ${escapeHtml(out.misconception.diagnosis)}<br/>
      <em>Micro-Remediation: ${escapeHtml(out.misconception.remediation)}</em>
    `;
  } else {
    miscBox.hidden = true;
  }

  const isLast = session.currentRound >= session.totalRounds;
  el('nextRoundBtn').textContent = isLast
    ? 'View Final Classroom Mastery Report'
    : `Start Round ${session.currentRound + 1} of ${session.totalRounds}`;
}

function renderCompletedSummary(session, me) {
  clearInterval(state.timerHandle);
  el('completedBox').hidden = false;
  const rank = session.students.findIndex((s) => s.id === me?.id) + 1;
  const delta = me ? Math.round((me.currentMasteryAvg - me.initialMasteryAvg) * 100) : 0;
  const sign = delta >= 0 ? '+' : '';
  el('finalHeadline').textContent = me
    ? `You finished #${rank} of ${session.students.length} with ${formatPct(me.currentMasteryAvg)} Verified Mastery!`
    : 'Classroom Match Finished!';
  el('finalSummaryText').textContent =
    `Personal mastery change: ${sign}${delta}%. Notice in the standings how Beginner, On-Track, and Advanced classmates stayed competitive together while the Teacher Radar captured every exact concept misconception.`;
}

function renderArena() {
  const session = state.session;
  if (!session) return;

  el('setupScreen').hidden = true;
  el('arenaScreen').hidden = false;
  el('pinBadge').textContent = `PIN ${session.pin}`;
  el('sessionTitleLabel').textContent = session.curriculumTitle;
  el('phaseBadge').textContent = phaseLabel(
    session.currentPhase,
    session.currentRound,
    session.totalRounds
  );

  const me = session.students.find((s) => s.id === state.myStudentId) || session.students[0];
  if (me) {
    el('hudHandle').textContent = me.handle;
    el('hudMastery').textContent = formatPct(me.currentMasteryAvg);
    el('hudShields').textContent = formatShields(me);
    el('hudScore').textContent = `${me.score} pts`;
  }

  renderStudentStage(session, me);
  renderStandingsTable(session);
  renderTeacherRadar(session.teacherRadar);
}

async function startClassroomFlow(withDemoClassmates) {
  const errBox = el('launchError');
  errBox.hidden = true;
  try {
    const handle = el('studentHandle').value.trim();
    const skillPreset = el('skillPreset').value;
    const curriculumId = el('curriculumSelect').value;
    const mode = el('gameModeSelect').value;

    const created = await apiJson('/api/sessions', 'POST', {
      title: 'Live Classroom Mastery Match',
      curriculumId,
      mode,
      totalRounds: 4,
      withDemoClassmates
    });

    const joined = await apiJson(`/api/sessions/${created.pin}/join`, 'POST', {
      handle,
      skillPreset
    });

    state.pin = created.pin;
    state.myStudentId = joined.student.id;
    state.session = joined.session;
    connectWebSocket(created.pin);

    if (withDemoClassmates) {
      state.session = await apiJson(`/api/sessions/${created.pin}/rounds/next`, 'POST', {});
    }
    renderArena();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.hidden = false;
  }
}

async function submitMyAnswer(questionId, selectedIndex) {
  const elapsed = Math.max(500, Math.round(performance.now() - state.questionStartedAt));
  state.session = await apiJson(`/api/sessions/${state.pin}/answers`, 'POST', {
    studentId: state.myStudentId,
    questionId,
    selectedIndex,
    responseMs: elapsed
  });
  renderArena();
}

async function advanceRoundOrFinish() {
  if (!state.session) return;
  if (state.session.currentRound >= state.session.totalRounds) {
    state.session = { ...state.session, status: 'completed' };
    renderArena();
    return;
  }
  state.session = await apiJson(`/api/sessions/${state.pin}/rounds/next`, 'POST', {});
  renderArena();
}

function wireEvents() {
  const howDialog = el('howItWorksDialog');
  const joinDialog = el('joinPinDialog');
  installDialogLightDismissFallback(howDialog);
  installDialogLightDismissFallback(joinDialog);

  el('openHowBtn').addEventListener('click', () => howDialog.showModal());
  el('openJoinPinBtn').addEventListener('click', () => joinDialog.showModal());
  el('cancelJoinPinBtn').addEventListener('click', () => joinDialog.close());

  el('launchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    void startClassroomFlow(true);
  });

  el('hostMultiplayerBtn').addEventListener('click', () => {
    void startClassroomFlow(false);
  });

  el('startFirstRoundBtn').addEventListener('click', () => void advanceRoundOrFinish());
  el('nextRoundBtn').addEventListener('click', () => void advanceRoundOrFinish());

  const resetToSetup = () => {
    clearInterval(state.timerHandle);
    if (state.ws) state.ws.close();
    state.session = null;
    el('arenaScreen').hidden = true;
    el('setupScreen').hidden = false;
  };

  el('resetDemoBtn').addEventListener('click', resetToSetup);
  el('playAgainBtn').addEventListener('click', resetToSetup);

  el('confirmJoinPinBtn').addEventListener('click', async () => {
    const errBox = el('joinPinError');
    errBox.hidden = true;
    try {
      const pin = el('joinPinInput').value.trim();
      const handle = el('joinHandleInput').value.trim();
      const skillPreset = el('joinPresetInput').value;
      const joined = await apiJson(`/api/sessions/${pin}/join`, 'POST', { handle, skillPreset });
      state.pin = pin;
      state.myStudentId = joined.student.id;
      state.session = joined.session;
      connectWebSocket(pin);
      joinDialog.close();
      renderArena();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.hidden = false;
    }
  });
}

wireEvents();
