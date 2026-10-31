# Specification 01: Mastery League Product & Classroom UX Contract

## 1. Product Vision
**Mastery League** is an AI-adaptive social learning and classroom competition platform for school students and teachers. It resolves the classroom split between non-adaptive social quiz games (*Kahoot!*, *Blooket*) and isolated solo adaptive drills (*Khan Academy*, *IXL*).

## 2. Target Users
1. **School Students (Grades 5 to 10 Beachhead)**: Compete together in live 60-second classroom sprints and elimination matches without getting crushed by static difficulty mismatches.
2. **Classroom Teachers**: Launch a zero-prep live classroom match via a 4-digit Class PIN and receive a real-time **Measurable Mastery & Misconception Map** showing verified concept retention and specific distractor misconceptions per student.
3. **First-Time Reviewer (a16z Speedrun Partner Flow)**: Must experience the full adaptive multiplayer loop in under 60 seconds with **zero login barriers** via a 1-click interactive classroom arena populated with multi-level classmates (plus optional live multi-tab WebSocket PIN play).

## 3. Core Functional Pillars
1. **Adaptive Learning Engine (`[VERIFIED ENGINE]`)**:
   - Tracks per-student mastery probability across a prerequisite Concept Ontology DAG using Bayesian Knowledge Tracing (BKT).
   - Dynamically selects each student's next prompt at their individual Zone of Proximal Development (ZPD) frontier.
2. **Social Classroom Multiplayer**:
   - Shared 4-digit Class PIN rooms synchronized via WebSockets (`/ws`) and REST fallback.
   - Live classmate activity feed showing how peers at Beginner, Developing, and Advanced mastery tiers compete side by side in the same match.
3. **Competitive Game Modes**:
   - **Speed Sprint**: Timed conceptual rounds where points scale by difficulty-calibrated mastery gain rather than raw button-mashing speed. Rapid random guesses (`< 1200ms` wrong answers) are flagged and awarded zero points.
   - **Last-Student-Standing**: Shield-based survival mode (each student starts with 2 Mastery Shields). Because prompts are calibrated to each student's personal mastery frontier, a struggling student who conquers a foundational misconception survives alongside an advanced student tackling a stretch problem.
4. **Measurable Mastery & Teacher Radar**:
   - Distinguishes lucky speed scores from verified concept mastery ($P(L_n) \ge 0.80$).
   - Maps wrong distractor choices directly to named pedagogical misconceptions and generates targeted 1-step micro-remediations.
5. **K-12 Safety & Compliance (`ConvoGuard AI` Integration)**:
   - Blocks student PII (emails, phone numbers) and unsafe handles before any student joins a live classroom lobby.
