import assert from 'node:assert/strict';
import test from 'node:test';
import { QuantumLabController } from '../src/simulation/lab-controller.js';

function finishTraining(lab: QuantumLabController): void {
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  lab.defuseCrate();
  lab.nextBombRound();
}

test('the opening teaches an empty D1 reference, crate placement, and a scripted D0', () => {
  const lab = new QuantumLabController(() => 0.1);
  const bomb = lab.state.bombPuzzle;

  lab.placeCrateInSlot('alpha');
  lab.defuseCrate();
  assert.equal(bomb.slotCrate, null);
  assert.equal(bomb.defusedCount, 0);

  lab.fireBombPhoton();
  lab.fireBombPhoton();
  lab.nextBombRound();
  assert.equal(lab.bombPhotonFlyPhase, 0);
  lab.tickSimulation(1);
  assert.equal(bomb.probesFired, 1);
  assert.equal(bomb.lastOutcome, 'safe_d1');

  lab.placeCrateInSlot('beta');
  assert.equal(bomb.slotCrate, null);
  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton();
  lab.defuseCrate();
  assert.equal(bomb.defusedCount, 0);
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'dark_d0');
  lab.defuseCrate();
  assert.equal(bomb.lastOutcome, 'defused');
  assert.equal(lab.state.score, 0);

  lab.nextBombRound();
  assert.equal(bomb.training, false);
  assert.equal(bomb.round, 1);
  assert.equal(bomb.slotCrate, null);
  assert.equal(bomb.probesFired, 0);
});

test('live cases require calibrated evidence and score a proven crate once', () => {
  const rolls = [0.1, 0.6, 0.6];
  const lab = new QuantumLabController(() => rolls.shift() ?? 0);
  finishTraining(lab);
  const bomb = lab.state.bombPuzzle;
  lab.fireBombPhoton();
  assert.equal(bomb.probesFired, 0);

  lab.placeCrateInSlot('alpha');
  lab.defuseCrate();
  assert.equal(bomb.lastOutcome, 'idle');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'dark_d0');
  lab.placeCrateInSlot('beta');
  assert.equal(bomb.slotCrate, 'alpha');

  lab.toggleBs2();
  lab.defuseCrate();
  lab.fireBombPhoton();
  assert.equal(bomb.probesFired, 1);
  assert.equal(bomb.defusedCount, 0);

  lab.toggleBs2();
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  lab.defuseCrate();
  const score = lab.state.score;
  lab.defuseCrate();
  lab.fireBombPhoton();
  lab.placeCrateInSlot('beta');
  assert.equal(bomb.defusedCount, 1);
  assert.equal(bomb.slotCrate, 'alpha');
  assert.equal(bomb.probesFired, 2);
  assert.equal(lab.state.score, score);
});

test('an inconclusive live shot allows a swap and a detonation closes the case', () => {
  const lab = new QuantumLabController(() => 0.1);
  finishTraining(lab);
  const bomb = lab.state.bombPuzzle;
  lab.placeCrateInSlot('beta');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'safe_d1');
  lab.defuseCrate();
  assert.equal(bomb.defusedCount, 0);

  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'exploded');
  lab.fireBombPhoton();
  lab.placeCrateInSlot('beta');
  assert.equal(bomb.lastOutcome, 'exploded');
  assert.equal(bomb.probesFired, 2);
  lab.nextBombRound();
  assert.equal(bomb.round, 2);
  assert.equal(bomb.lastOutcome, 'idle');
});

test('case 2 enforces 3-photon budget and lets player safely quarantine uncertain crates', () => {
  // Choose RNG 0.8 -> bombCrate = 'beta' (>= 0.5), probe hits always safe_d1 on alpha or >= 0.75 on beta
  const rolls = [0.8, 0.85, 0.85, 0.85];
  const lab = new QuantumLabController(() => rolls.shift() ?? 0.85);
  finishTraining(lab);
  const bomb = lab.state.bombPuzzle;
  assert.equal(bomb.caseKind, 'budget');
  assert.equal(bomb.maxProbes, 3);

  // Use all 3 photons on safe/inconclusive shots
  lab.placeCrateInSlot('alpha');
  for (let i = 0; i < 3; i += 1) {
    lab.fireBombPhoton();
    lab.tickSimulation(1);
    assert.equal(bomb.lastOutcome, 'safe_d1');
  }
  assert.equal(bomb.probesFired, 3);

  // Additional photon shot is blocked once budget hits 0; primary decision becomes quarantine
  lab.fireBombPhoton();
  assert.equal(bomb.probesFired, 3);
  lab.quarantineCrate();
  assert.equal(bomb.lastOutcome, 'quarantined');
  assert.equal(bomb.quarantinedCount, 1);
  assert.ok(lab.state.score >= 45);
});

test('case 3 optics drift requires diagnosing false D0, seating BS2, verifying empty D1, then solving', () => {
  const rolls = [0.2, 0.2, 0.6];
  const lab = new QuantumLabController(() => rolls.shift() ?? 0.6);
  finishTraining(lab);
  // Advance past live case 1 cleanly into case 2 (round === 2, optics_drift)
  lab.placeCrateInSlot('beta');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  lab.quarantineCrate();
  lab.nextBombRound();

  const bomb = lab.state.bombPuzzle;
  assert.equal(bomb.round, 2);
  assert.equal(bomb.caseKind, 'optics_drift');
  assert.equal(bomb.bs2Installed, false);
  assert.equal(bomb.emptyCalibrated, false);

  // Empty check with missing BS2 flashes a diagnostic false D0 warning
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'dark_d0');
  assert.equal(bomb.emptyCalibrated, false);

  // Seat BS2 physically -> still must confirm empty track D1 before trusting crate runs
  lab.setBs2Installed(true);
  assert.equal(bomb.bs2Installed, true);
  assert.equal(bomb.emptyCalibrated, false);
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'safe_d1');
  assert.equal(bomb.emptyCalibrated, true);

  // Now calibrated: load crate and solve cleanly via D0
  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.lastOutcome, 'dark_d0');
  lab.defuseCrate();
  assert.equal(bomb.lastOutcome, 'defused');
});

test('adaptive tabletop dimensions adjust narrow vs wide bench layout cleanly', () => {
  const lab = new QuantumLabController(() => 0.1);
  lab.applyDetectedTableDimensions(0.75, 0.5, 0.84);
  assert.equal(lab.tableLayoutProfile, 'compact');
  assert.ok(lab.layoutScaleX < 0.85);
  assert.equal(lab.detectedTableWidthM, 0.75);

  lab.applyDetectedTableDimensions(1.55, 0.8, 0.76);
  assert.equal(lab.tableLayoutProfile, 'wide');
  assert.ok(lab.layoutScaleX > 1.15);
});

test('quarantine requires a loaded crate and recalibrating optics enforces unload without resetting photon limit', () => {
  // Choose RNG 0.8 -> bombCrate = 'beta'
  const lab = new QuantumLabController(() => 0.8);
  finishTraining(lab);
  // Advance past round 1 (quarantine with crate A loaded after 1 shot) -> round 2 (optics_drift)
  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  lab.quarantineCrate();
  lab.nextBombRound();

  const bomb = lab.state.bombPuzzle;
  assert.equal(bomb.round, 2);
  assert.equal(bomb.caseKind, 'optics_drift');
  const startScore = lab.state.score;

  // Finding 1 regression guard: Quarantine MUST NOT work on an empty slot (even after repairing optics / empty shots)
  lab.fireBombPhoton(); // diagnostic empty false D0
  lab.tickSimulation(1);
  lab.quarantineCrate();
  assert.equal(bomb.lastOutcome, 'dark_d0');
  assert.equal(lab.state.score, startScore);

  lab.setBs2Installed(true);
  lab.fireBombPhoton(); // confirm empty D1
  lab.tickSimulation(1);
  assert.equal(bomb.emptyCalibrated, true);
  assert.equal(bomb.slotCrate, null);
  lab.quarantineCrate();
  assert.equal(bomb.lastOutcome, 'safe_d1');
  assert.equal(lab.state.score, startScore);

  // Spend 2 of 3 crate photons on dummy crate A
  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  lab.fireBombPhoton();
  lab.tickSimulation(1);
  assert.equal(bomb.crateProbesFired, 2);

  // Finding 2 regression guard: unseating & re-seating BS2 with crate still in SLOT requires UNLOAD first,
  // refuses calibrate while crate loaded, and keeps crateProbesFired = 2 (max 1 crate shot left -> total 3)
  lab.setBs2Installed(false);
  lab.setBs2Installed(true);
  assert.equal(bomb.emptyCalibrated, false);
  assert.equal(bomb.slotCrate, 'alpha');

  // Direct fire attempt while crate loaded & emptyCalibrated === false must be blocked!
  lab.fireBombPhoton();
  assert.equal(bomb.crateProbesFired, 2);

  // Unload crate via action -> now empty calibrate works cleanly -> load crate -> only 1 shot left!
  lab.performBombMissionAction(); // unload
  assert.equal(bomb.slotCrate, null);
  lab.fireBombPhoton(); // calibrate empty D1
  lab.tickSimulation(1);
  assert.equal(bomb.emptyCalibrated, true);
  assert.equal(bomb.crateProbesFired, 2);

  lab.placeCrateInSlot('alpha');
  lab.fireBombPhoton(); // 3rd and final crate shot!
  lab.tickSimulation(1);
  assert.equal(bomb.crateProbesFired, 3);

  // 4th crate shot strictly blocked -> primary action becomes quarantine
  lab.fireBombPhoton();
  assert.equal(bomb.crateProbesFired, 3);
  lab.performBombMissionAction(); // quarantine
  assert.equal(bomb.lastOutcome, 'quarantined');
});

