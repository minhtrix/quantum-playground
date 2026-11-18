import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuantumGate,
  buildLocalTutorResponse,
  CHSH_CANONICAL_PAIRS,
  clearEntanglementStats,
  computeBellCorrelation,
  computeOnboardingHint,
  computeTheoreticalVisibility,
  createInitialQuantumLabState,
  createSnapshot,
  defuseCrateChoice,
  evaluateDoubleSlitProbability,
  fireBombInterferometerPhoton,
  isSchrodingerMissionReady,
  measureTetherPair,
  observeSchrodingerBox,
  recordDoubleSlitBurst,
  recordEntangledBurst,
  resetSchrodingerBox,
  startNextBombRound,
} from '../src/simulation/quantum-physics.js';
import {
  processTutorRequest,
  SlidingWindowRateLimiter,
} from '../server/tutor-engine.js';

function makeDeterministicRng(seed = 1337): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('coherent double-slit shows deep interference minima whereas which-path detector collapses fringes', () => {
  const coherent = {
    wavelengthNm: 532 as const,
    slitSeparationMm: 0.48,
    slitMode: 'both' as const,
    whichPathDetector: false,
  };
  // At x=0 constructive peak; first destructive minimum occurs near phase = pi/2 -> x = 0.5 / (3.9 * 0.48) ~= 0.267
  const peak = evaluateDoubleSlitProbability(0, coherent);
  const firstMinX = 0.5 / (3.9 * coherent.slitSeparationMm);
  const trough = evaluateDoubleSlitProbability(firstMinX, coherent);
  assert.ok(peak > 0.9);
  assert.ok(trough < 0.08, `expected deep destructive trough, got ${trough}`);
  assert.equal(computeTheoreticalVisibility(coherent), 0.94);

  const observed = { ...coherent, whichPathDetector: true };
  const troughObserved = evaluateDoubleSlitProbability(firstMinX, observed);
  assert.ok(
    troughObserved > 0.35,
    `expected filled-in distribution when detector ON, got ${troughObserved}`,
  );
  assert.equal(computeTheoreticalVisibility(observed), 0);
});

test('longer wavelength creates wider fringe spacing in double-slit pattern', () => {
  const base = {
    slitSeparationMm: 0.48,
    slitMode: 'both' as const,
    whichPathDetector: false,
  };
  // Find first non-central constructive peak roughly around x in [0.2, 0.8]
  const findFirstPeak = (nm: 430 | 650) => {
    let bestX = 0.2;
    let bestP = -1;
    for (let x = 0.28; x <= 0.85; x += 0.01) {
      const p = evaluateDoubleSlitProbability(x, { ...base, wavelengthNm: nm });
      if (p > bestP) {
        bestP = p;
        bestX = x;
      }
    }
    return bestX;
  };
  const bluePeak = findFirstPeak(430);
  const redPeak = findFirstPeak(650);
  assert.ok(
    redPeak > bluePeak,
    `expected red (${redPeak}) fringe peak farther from center than blue (${bluePeak})`,
  );
});

test('bell entangled pairs obey E = cos(2*(theta_A - theta_B)) across angles', () => {
  assert.equal(computeBellCorrelation(0, 0), 1);
  assert.equal(computeBellCorrelation(0, 45), 0);
  assert.equal(computeBellCorrelation(0, 90), -1);

  const state = createInitialQuantumLabState();
  state.experiment = 'entanglement';
  state.aliceAngleDeg = 0;
  state.bobAngleDeg = 22.5;
  const rng = makeDeterministicRng(42);
  for (let i = 0; i < 10; i += 1) {
    recordEntangledBurst(state, 100, rng);
  }
  assert.equal(state.pairCount, 1000);
  // cos(45 deg) ~= 0.707
  assert.ok(
    Math.abs(state.measuredCorrelation - 0.707) < 0.08,
    `expected measured correlation near 0.707, got ${state.measuredCorrelation}`,
  );
});

test('burst accumulation fills histogram bins and updates measured contrast', () => {
  const state = createInitialQuantumLabState();
  const rng = makeDeterministicRng(99);
  recordDoubleSlitBurst(state, 150, rng);
  assert.equal(state.totalHits, 150);
  assert.ok(state.measuredFringeContrast > 0.5);
});

test('local tutor response adapts to which-path detector state and server handles fallback cleanly', async () => {
  const state = createInitialQuantumLabState();
  state.whichPathDetector = true;
  const local = buildLocalTutorResponse('Why did the fringes vanish?', createSnapshot(state));
  assert.ok(local.headline.includes('Which-Path'));

  const res = await processTutorRequest(
    { question: 'Why did the fringes vanish?', snapshot: createSnapshot(state) },
    '127.0.0.1',
    {},
    {},
    new SlidingWindowRateLimiter(5, 60_000),
  );
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.source, 'local-physics');
  assert.ok(res.body.answer.length > 20);

  const badRes = await processTutorRequest(
    null,
    '127.0.0.1',
    {},
    {},
    new SlidingWindowRateLimiter(5, 60_000),
  );
  assert.equal(badRes.status, 400);
  assert.equal(badRes.body.ok, false);
});

test('screenDistanceScale stretches fringe spacing and CHSH canonical sweep violates classical limit S > 2.0', () => {
  const base = {
    wavelengthNm: 532 as const,
    slitSeparationMm: 0.48,
    slitMode: 'both' as const,
    whichPathDetector: false,
  };
  const nearZero = evaluateDoubleSlitProbability(0.28, { ...base, screenDistanceScale: 0.75 });
  const farShift = evaluateDoubleSlitProbability(0.35, { ...base, screenDistanceScale: 1.3 });
  assert.ok(farShift !== nearZero);

  const state = createInitialQuantumLabState();
  state.experiment = 'entanglement';
  const rng = makeDeterministicRng(2026);
  for (const [a, b] of CHSH_CANONICAL_PAIRS) {
    state.aliceAngleDeg = a;
    state.bobAngleDeg = b;
    clearEntanglementStats(state);
    for (let i = 0; i < 4; i += 1) {
      recordEntangledBurst(state, 100, rng);
    }
  }
  assert.ok(state.chshWitnessS !== null, 'CHSH S should compute after 4 canonical angle cells');
  assert.ok(
    state.chshWitnessS > 2.4,
    `expected Bell inequality violation S > 2.4 (theoretical ~2.83), got ${state.chshWitnessS}`,
  );
});

test('Elitzur-Vaidman bomb puzzle gives 100% D1 on dummy glass and 50/25/25 on live bomb', () => {
  const rng = makeDeterministicRng(777);
  const state = createInitialQuantumLabState(rng, 'beta');
  assert.equal(state.experiment, 'bomb_puzzle');
  assert.equal(state.bombPuzzle.bombCrate, 'beta');

  // Dummy crate ('alpha') always hits Safe Port D1 when BS2 is ON and pi-phase OFF
  state.bombPuzzle.slotCrate = 'alpha';
  for (let i = 0; i < 60; i += 1) {
    const out = fireBombInterferometerPhoton(state, rng);
    assert.equal(out, 'safe_d1');
  }
  assert.equal(state.bombPuzzle.darkHits, 0);
  assert.equal(state.bombPuzzle.explosions, 0);

  // Live bomb crate ('beta') produces ~50% explode, ~25% D0 dark port, ~25% D1 safe port
  state.bombPuzzle.slotCrate = 'beta';
  state.bombPuzzle.safeHits = 0;
  state.bombPuzzle.darkHits = 0;
  state.bombPuzzle.explosions = 0;
  for (let i = 0; i < 1000; i += 1) {
    fireBombInterferometerPhoton(state, rng);
  }
  const explodeFrac = state.bombPuzzle.explosions / 1000;
  const darkFrac = state.bombPuzzle.darkHits / 1000;
  const safeFrac = state.bombPuzzle.safeHits / 1000;
  assert.ok(Math.abs(explodeFrac - 0.5) < 0.06, `expected ~0.5 explosions, got ${explodeFrac}`);
  assert.ok(Math.abs(darkFrac - 0.25) < 0.05, `expected ~0.25 dark hits, got ${darkFrac}`);
  assert.ok(Math.abs(safeFrac - 0.25) < 0.05, `expected ~0.25 safe hits, got ${safeFrac}`);

  const defused = defuseCrateChoice(state, 'beta');
  assert.equal(defused, true);
  assert.equal(state.bombPuzzle.defusedCount, 1);
  assert.ok(state.score >= 150);

  startNextBombRound(state, rng, 'alpha');
  assert.equal(state.bombPuzzle.round, 2);
  assert.equal(state.bombPuzzle.slotCrate, null);
});

test('Quantum Tether enforces correlated |Phi+> and anti-correlated |Psi-> spin collapses', () => {
  const rng = makeDeterministicRng(901);
  const state = createInitialQuantumLabState(rng);
  state.tether.mode = 'correlated';
  for (let i = 0; i < 40; i += 1) {
    const { leftSpin, rightSpin } = measureTetherPair(state, rng);
    assert.equal(leftSpin, rightSpin);
  }

  state.tether.mode = 'anticorrelated';
  for (let i = 0; i < 40; i += 1) {
    const { leftSpin, rightSpin } = measureTetherPair(state, rng);
    assert.equal(leftSpin, -rightSpin);
  }
});

test('Schrodinger gate circuit H -> Z -> H acts as quantum X flip and collapses cleanly', () => {
  const rng = makeDeterministicRng(5150);
  const state = createInitialQuantumLabState(rng);
  resetSchrodingerBox(state, false); // Start pure |0> Awake
  assert.equal(state.schrodinger.alpha, 1);
  assert.equal(state.schrodinger.beta, 0);

  applyQuantumGate(state, 'H');
  assert.ok(Math.abs(state.schrodinger.alpha * state.schrodinger.alpha - 0.5) < 1e-6);

  applyQuantumGate(state, 'Z');
  applyQuantumGate(state, 'H');
  assert.ok(state.schrodinger.beta * state.schrodinger.beta > 0.999);
  assert.equal(state.schrodinger.alpha, 0);

  const outcome = observeSchrodingerBox(state, rng);
  assert.equal(outcome, 'asleep');
  assert.equal(state.schrodinger.boxClosed, false);
});

test('computeOnboardingHint tracks active target, arrow state, and CTAs cleanly across modes', () => {
  const rng = makeDeterministicRng(2027);
  const state = createInitialQuantumLabState(rng, 'beta');

  // Bomb Step 1: initial -> targets crates; while holding crate -> targets bomb_slot
  const s1 = computeOnboardingHint(state, 'none');
  assert.equal(s1.target, 'crates');
  const sHold = computeOnboardingHint(state, 'crate');
  assert.equal(sHold.target, 'bomb_slot');

  // Bomb Step 2: crate slotted -> targets bomb_fire
  state.bombPuzzle.slotCrate = 'beta';
  const s2 = computeOnboardingHint(state, 'none');
  assert.equal(s2.target, 'bomb_fire');

  // Bomb Step 3: Dark D0 flashed -> targets bomb_dark for defusal
  state.bombPuzzle.lastOutcome = 'dark_d0';
  const s3 = computeOnboardingHint(state, 'none');
  assert.equal(s3.target, 'bomb_dark');

  // Schrodinger: holding gate targets gate_dock; 2+ gates applied targets box_lid
  state.experiment = 'schrodinger';
  assert.equal(computeOnboardingHint(state, 'gate').target, 'gate_dock');
  applyQuantumGate(state, 'Z');
  assert.equal(computeOnboardingHint(state, 'none').target, 'box_lid');
});

test('Schrodinger missions and Tether distance challenges advance cleanly with bonuses', () => {
  const rng = makeDeterministicRng(9999);
  const state = createInitialQuantumLabState(rng);

  // Mission 0: Prepare 100% Asleep |1> (starts at H|0>, so Z -> H gives |1>)
  state.experiment = 'schrodinger';
  assert.equal(isSchrodingerMissionReady(state.schrodinger), false);
  applyQuantumGate(state, 'Z');
  applyQuantumGate(state, 'H');
  assert.equal(isSchrodingerMissionReady(state.schrodinger), true);
  const res = observeSchrodingerBox(state, rng);
  assert.equal(res, 'asleep');
  assert.equal(state.schrodinger.lastMissionWon, true);
  assert.equal(state.schrodinger.missionsSolved, 1);
  assert.equal(state.schrodinger.missionIndex, 1);
  assert.ok(state.score >= 100);

  // Tether challenge: collapse below target vs past targetDistanceM
  state.experiment = 'tether';
  state.tether.distanceM = 0.5;
  measureTetherPair(state, rng);
  assert.equal(state.tether.challengesCompleted, 0);

  state.tether.distanceM = 1.05;
  measureTetherPair(state, rng);
  assert.equal(state.tether.challengesCompleted, 1);
  assert.ok(state.tether.targetDistanceM > 1.0);
});



