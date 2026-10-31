# Specification 02: Deterministic Domain Mathematics (`[VERIFIED ENGINE]`)

## 1. Curriculum Prerequisite Ontology DAG
A subject track is modeled as a Directed Acyclic Graph $G = (V, E)$:
- Each node $v \in V$ is a `ConceptNode` with:
  - `id`: unique identifier (e.g., `math.frac.equiv`, `math.frac.add_unlike`, `math.alg.one_step`, `math.alg.two_step`, `math.alg.inequalities`)
  - `title`: human-readable concept label
  - `gradeBand`: e.g., `Grades 6-8`
  - `prerequisites`: list of parent `ConceptNode` IDs that must reach unlock threshold $\tau_{\text{unlock}} = 0.65$ before $v$ enters the student's active frontier
  - Standard BKT parameters $(p_{L0}, p_T, p_S, p_G)$ constrained to $(0.01, 0.99)$ with $1 - p_S > p_G$ (identifiability invariant).

## 2. Bayesian Knowledge Tracing (BKT) Update Equations
Given prior mastery $L_{t-1} \in (0, 1)$ on concept $v$, slip probability $p_S$, guess probability $p_G$, learning transition $p_T$, observation $c \in \{0, 1\}$, and response time $\Delta t$ (ms):

1. **Rapid-Guess Guard**:
   If $c = 0$ and $\Delta t < 1200\text{ ms}$, the response is flagged as `rapidGuess = true`. To prevent downward gaming of adaptive handicap tiers (sandbagging), rapid-guess misses do **not** lower the student's handicap difficulty floor, while still costing a shield in Last-Student-Standing and flagging the teacher radar.

2. **Evidence Posterior**:
   - For $c = 1$ (and $\Delta t \ge 600\text{ ms}$):
     $$P(L_{t-1} \mid c=1) = \frac{L_{t-1}(1 - p_S)}{L_{t-1}(1 - p_S) + (1 - L_{t-1})p_G}$$
   - For $c = 0$:
     $$P(L_{t-1} \mid c=0) = \frac{L_{t-1}p_S}{L_{t-1}p_S + (1 - L_{t-1})(1 - p_G)}$$

3. **Learning Transition Update**:
   $$L_t = P(L_{t-1} \mid c) + \bigl(1 - P(L_{t-1} \mid c)\bigr) p_T$$
   Bounded cleanly within $[0.02, 0.99]$.

## 3. Zone of Proximal Development (ZPD) Handicap Item Selection
To keep mixed-ability students equally challenged inside the same live round:
1. Identify **Unlocked Frontier Concepts**: all concepts whose prerequisites satisfy $L \ge 0.65$, prioritizing unmastered concepts ($L < 0.85$). If all concepts are mastered ($L \ge 0.85$), select the highest-tier concept for stretch retention.
2. Target difficulty $d^* = \text{clamp}(L_v + 0.08, 0.20, 0.95)$ so the student operates slightly above current comfort.
3. From unseen `QuestionItem`s on the target concept (falling back to least-recently-seen if exhausted), deterministically choose the item minimizing $|d_i - d^*|$.

## 4. Game Mode Rules
- **Speed Sprint Points**:
  - Incorrect or rapid-guess: `0` points.
  - Correct: $\text{points} = \text{round}\bigl(100 \times (0.5 + d_i) \times (0.6 + 0.4 \cdot \text{timeRatio}) + 150 \cdot \max(0, L_t - L_{t-1})\bigr)$ where $\text{timeRatio} = \text{clamp}\bigl(1 - \frac{\Delta t}{T_{\text{round}}}, 0, 1\bigr)$. Notice mastery growth ($\Delta L$) and calibrated item difficulty reward genuine learning at one's frontier!
- **Last-Student-Standing Survival**:
  - Every student begins with `shields = 2` (and `eliminated = false`).
  - Correct answer at one's ZPD frontier preserves shields and awards clutch survival points.
  - Incorrect answer deducts `1` shield; when `shields === 0` and another miss occurs (or shields drop from 1 to 0 on sudden-death round), `eliminated = true` (while still letting eliminated students answer in "Ghost / Redemption Practice" so no child sits idle in class!).
