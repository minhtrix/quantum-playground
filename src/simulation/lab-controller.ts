import { quantumAudio } from '../audio/quantum-audio.js';
import {
  ANALYZER_ANGLES,
  applyQuantumGate,
  buildLocalTutorResponse,
  CHSH_CANONICAL_PAIRS,
  chshKey,
  clearEntanglementStats,
  clearScreenAccumulation,
  computeBellCorrelation,
  computeTheoreticalVisibility,
  createInitialQuantumLabState,
  createSnapshot,
  defuseCrateChoice,
  fireBombInterferometerPhoton,
  getBombMissionAction,
  measureTetherPair,
  observeSchrodingerBox,
  quarantineCrateChoice,
  recordDoubleSlitBurst,
  recordEntangledBurst,
  resetSchrodingerBox,
  SCREEN_DISTANCE_OPTIONS,
  SLIT_SEPARATION_OPTIONS,
  startNextBombRound,
  WAVELENGTH_OPTIONS,
  type AnalyzerAngleDeg,
  type BombCrateId,
  type ExperimentMode,
  type QuantumGateType,
  type QuantumLabState,
  type SlitMode,
  type WavelengthNm,
} from './quantum-physics.js';

export type ByokProvider = 'openrouter' | 'anthropic';

export interface ByokState {
  provider: ByokProvider;
  apiKey: string;
}

export type TableLayoutProfile = 'compact' | 'standard' | 'wide';

export const EXPERIMENT_MODES: readonly ExperimentMode[] = [
  'bomb_puzzle',
  'tether',
  'schrodinger',
  'double_slit',
  'entanglement',
];

export const DEFAULT_BENCH_Y = 0.88;

export class QuantumLabController {
  public readonly state: QuantumLabState = createInitialQuantumLabState(Math.random, 'alpha');
  public stateRevision = 1;
  public visualDirty = true;
  public pulseBurstTimer = 0;
  public pairFlyPhase = 1;
  public bombPhotonFlyPhase = 1;
  public bombExplosionTimer = 0;
  public gateFlashTimer = 0;
  public lastAppliedGate: QuantumGateType | null = null;
  public throwPhotonSeq = 0;
  public tetherNudgeSeq = 0;
  public holdingKind: 'none' | 'crate' | 'gate' | 'probe' | 'bs2' = 'none';
  public tutorPulseTimer = 0;
  public eventSeq = 1;
  public eventTitle = 'QUANTUM BOMB TEST READY';
  public eventWhy = 'Follow the yellow arrow! Point Trigger or Grip at objects.';
  public eventAccent = '#38bdf8';
  public eventTimer = 5.0;
  public tutorBusy = false;
  public liveAiConfigured = false;
  public lastNotice = '';
  public probeAutoControlled = false;
  public detectedTableY: number | null = null;
  public detectedTableWidthM: number | null = null;
  public detectedTableDepthM: number | null = null;
  public tableLayoutProfile: TableLayoutProfile = 'standard';
  public layoutScaleX = 1.0;
  public tableHeightY = DEFAULT_BENCH_Y;
  public benchOffsetX = 0;
  public benchOffsetZ = 0;
  public userRepositionedBench = false;
  public byok: ByokState = { provider: 'openrouter', apiKey: '' };

  private listeners = new Set<() => void>();
  private streamAccumSec = 0;
  private chshStepCursor = 0;

  constructor(private readonly bombRng: () => number = Math.random) {
    this.state.bombPuzzle.training = true;
    this.state.bombPuzzle.caseKind = 'training';
    this.state.bombPuzzle.maxProbes = 0;
    this.state.bombPuzzle.emptyCalibrated = true;
    // Seed initial interference hits so Double-Slit phosphor display is informative immediately
    recordDoubleSlitBurst(this.state, 36);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setHoldingKind(kind: 'none' | 'crate' | 'gate' | 'probe' | 'bs2'): void {
    if (this.holdingKind === kind) return;
    this.holdingKind = kind;
    this.emit(false);
  }

  private updateQuestProgress(): void {
    const s = this.state;
    const prevStep = s.questStep;
    if (
      s.questStep === 1 &&
      (s.bombPuzzle.defusedCount >= 1 ||
        (s.experiment === 'double_slit' &&
          !s.whichPathDetector &&
          s.slitMode === 'both' &&
          s.totalHits >= 50))
    ) {
      s.questStep = 2;
      quantumAudio.playMilestoneUnlocked();
    } else if (
      s.questStep <= 2 &&
      (s.tether.collapses >= 1 ||
        (s.experiment === 'double_slit' && s.whichPathDetector))
    ) {
      s.questStep = 3;
      quantumAudio.playMilestoneUnlocked();
    } else if (
      s.questStep <= 3 &&
      ((s.chshWitnessS != null && s.chshWitnessS > 2.0) ||
        s.schrodinger.collapseCount >= 2)
    ) {
      s.questStep = 4;
      quantumAudio.playMilestoneUnlocked();
    }
    if (s.questStep !== prevStep) {
      this.tutorPulseTimer = 1.5;
    }
  }

  private pushEvent(title: string, why: string, accent = '#38bdf8', duration = 4.4): void {
    this.eventSeq += 1;
    this.eventTitle = title;
    this.eventWhy = why;
    this.eventAccent = accent;
    this.eventTimer = duration;
  }

  private emit(markVisual = true): void {
    this.updateQuestProgress();
    this.stateRevision += 1;
    if (markVisual) this.visualDirty = true;
    for (const listener of this.listeners) {
      listener();
    }
  }

  setBenchOffset(dx: number, tableY: number, dz: number, fromUserHandle = true): void {
    const cx = Math.max(-0.75, Math.min(0.75, dx));
    const cy = Math.max(0.55, Math.min(1.32, tableY));
    const cz = Math.max(-0.45, Math.min(0.35, dz));
    if (
      Math.abs(cx - this.benchOffsetX) < 0.002 &&
      Math.abs(cy - this.tableHeightY) < 0.002 &&
      Math.abs(cz - this.benchOffsetZ) < 0.002
    ) {
      return;
    }
    this.benchOffsetX = cx;
    this.tableHeightY = cy;
    this.benchOffsetZ = cz;
    if (fromUserHandle) this.userRepositionedBench = true;
    this.emit(false);
  }

  setTableLayoutProfile(profile: TableLayoutProfile): void {
    const scale = profile === 'compact' ? 0.76 : profile === 'wide' ? 1.24 : 1.0;
    if (this.tableLayoutProfile === profile && Math.abs(this.layoutScaleX - scale) < 0.005) return;
    this.tableLayoutProfile = profile;
    this.layoutScaleX = scale;
    this.emit(false);
  }

  applyDetectedTableDimensions(widthM: number, depthM: number, tableY?: number): void {
    const safeW = Number(Math.max(0.45, Math.min(2.4, widthM)).toFixed(2));
    const safeD = Number(Math.max(0.35, Math.min(1.6, depthM)).toFixed(2));
    const profile: TableLayoutProfile =
      safeW < 0.92 ? 'compact' : safeW > 1.32 ? 'wide' : 'standard';
    const nextScale = profile === 'compact' ? 0.76 : profile === 'wide' ? 1.24 : 1.0;
    const changed =
      this.detectedTableWidthM !== safeW ||
      this.detectedTableDepthM !== safeD ||
      this.tableLayoutProfile !== profile;
    this.detectedTableWidthM = safeW;
    this.detectedTableDepthM = safeD;
    this.tableLayoutProfile = profile;
    this.layoutScaleX = nextScale;
    if (tableY != null) {
      this.detectedTableY = tableY;
    }
    if (changed) {
      this.emit(false);
    }
  }

  cycleTableLayoutProfile(): void {
    const order: readonly TableLayoutProfile[] = ['compact', 'standard', 'wide'];
    const idx = order.indexOf(this.tableLayoutProfile);
    const next = order[(idx + 1) % order.length];
    this.setTableLayoutProfile(next);
  }

  snapToDetectedTable(): void {
    this.tableHeightY = this.detectedTableY ?? DEFAULT_BENCH_Y;
    this.state.tutorHeadline =
      this.detectedTableY != null
        ? `Anchored Bench to Table (${this.tableHeightY.toFixed(2)}m)`
        : `Aligned Bench to Standard Height (${DEFAULT_BENCH_Y.toFixed(2)}m)`;
    this.state.tutorBody =
      'Reach out with your hands or controller rays to grab crates, stretch entangled orbs, flip gates, and probe waves.';
    quantumAudio.playDialStep(22.5);
    this.emit(false);
  }

  setExperiment(mode: ExperimentMode): void {
    if (this.state.experiment === mode) {
      quantumAudio.playDialStep(30);
      this.pushEvent(
        `${mode === 'bomb_puzzle' ? 'BOMB TEST' : mode.toUpperCase()} ALREADY ACTIVE`,
        'Follow the yellow arrow & press Trigger on objects or Console!',
        '#38bdf8',
        3.6,
      );
      this.emit(false);
      return;
    }
    this.state.experiment = mode;

    if (mode === 'bomb_puzzle') {
      const local = buildLocalTutorResponse('explain quantum bomb puzzle', createSnapshot(this.state));
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
      this.pushEvent('QUANTUM BOMB LAB', 'Peek inside crates using light interference without setting fuses off!', '#38bdf8');
    } else if (mode === 'tether') {
      const local = buildLocalTutorResponse('explain quantum tether spooky distance', createSnapshot(this.state));
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
      this.pushEvent('QUANTUM TETHER', 'Pull glowing orbs apart & shake one: twin snaps instantly!', '#a78bfa');
    } else if (mode === 'schrodinger') {
      const local = buildLocalTutorResponse('explain schrodinger box gates', createSnapshot(this.state));
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
      this.pushEvent('SCHRODINGER CAT BOX', 'Steer quantum gates H/Z/X, then open the lid to collapse reality!', '#22d3ee');
    } else if (mode === 'double_slit') {
      const local = buildLocalTutorResponse('explain wave interference', createSnapshot(this.state));
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
      this.pushEvent('DOUBLE-SLIT WAVES', 'Watch waves interfere — then spy on Slit A to collapse stripes!', '#2ef299');
    } else {
      if (this.state.pairCount === 0) {
        recordEntangledBurst(this.state, 16);
      }
      const local = buildLocalTutorResponse('explain entanglement bell', createSnapshot(this.state));
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
      this.pushEvent('BELL ENTANGLEMENT', 'Turn Alice & Bob dials to prove spooky S > 2.0 correlations!', '#a78bfa');
    }
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.2;
    this.emit(true);
  }

  cycleExperiment(): void {
    const idx = EXPERIMENT_MODES.indexOf(this.state.experiment);
    const next = EXPERIMENT_MODES[(idx + 1) % EXPERIMENT_MODES.length];
    this.setExperiment(next);
  }

  toggleExperiment(): void {
    this.cycleExperiment();
  }

  // --- Mechanic 1: Quantum Bomb Puzzle ---

  get bombInFlight(): boolean {
    return this.bombPhotonFlyPhase < 1;
  }

  canLoadBombCrate(crateId: BombCrateId): boolean {
    if (this.state.experiment !== 'bomb_puzzle') return false;
    const bomb = this.state.bombPuzzle;
    const action = getBombMissionAction(bomb, this.bombInFlight);
    if (bomb.training) return action === 'load' && crateId === 'alpha';
    return (
      (action === 'load' || action === 'fire' || action === 'quarantine') &&
      bomb.slotCrate !== crateId
    );
  }

  /** Explains to the player why tapping a crate did not load it yet so interaction never feels silent. */
  notifyCrateBlocked(crateId: BombCrateId): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    const label = crateId === 'alpha' ? 'A' : 'B';
    let title = `CRATE ${label} WAITING`;
    let why = 'Follow the yellow arrow first before swapping crates.';
    if (!bomb.bs2Installed) {
      title = 'BS2 OPTICS MISSING!';
      why = 'Seat BS2 back into the cyan corner before loading a crate.';
    } else if (bomb.phasePiEnabled) {
      title = 'FIX PHASE ERROR FIRST!';
      why = 'Re-seat BS2 and fire empty beam to confirm green D1.';
    } else if (!bomb.emptyCalibrated) {
      title = 'CHECK EMPTY TRACK FIRST!';
      why = 'Press Trigger on the table rig or Console to verify green D1 first.';
    } else if (bomb.training && crateId === 'beta') {
      title = 'TRAINING USES CRATE A!';
      why = 'Point and press Trigger on glowing Crate A (left) for this step.';
    } else if (bomb.slotCrate !== null && bomb.slotCrate !== crateId) {
      title = 'SLOT ALREADY OCCUPIED!';
      why = 'Tap the crate inside SLOT first to remove it.';
    } else if (bomb.lastOutcome === 'defused' || bomb.lastOutcome === 'exploded' || bomb.lastOutcome === 'wrong_guess' || bomb.lastOutcome === 'quarantined') {
      title = 'CASE FINISHED!';
      why = 'Click the table rig or Next Case on the console to continue.';
    }
    this.pushEvent(title, why, '#fbbf24', 3.4);
    quantumAudio.playDialStep(16);
    this.emit(false);
  }

  unloadCrate(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    if (bomb.training || this.bombInFlight || bomb.slotCrate === null) return;
    const terminal =
      bomb.lastOutcome === 'defused' ||
      bomb.lastOutcome === 'exploded' ||
      bomb.lastOutcome === 'wrong_guess' ||
      bomb.lastOutcome === 'quarantined';
    if (terminal) return;

    const prev = bomb.slotCrate;
    bomb.slotCrate = null;
    bomb.lastOutcome = 'idle';
    quantumAudio.playDialStep(18);
    this.state.tutorHeadline = `Crate ${prev === 'alpha' ? 'A' : 'B'} returned`;
    this.state.tutorBody = !bomb.emptyCalibrated
      ? 'Track is empty. Check empty track for green D1 calibration now.'
      : 'Choose Crate A or B to place into the test slot.';
    this.pushEvent(
      `CRATE ${prev === 'alpha' ? 'A' : 'B'} REMOVED`,
      !bomb.emptyCalibrated ? 'Track is clear! Check empty beam to confirm green D1.' : 'Pick a crate to test.',
      '#fbbf24',
    );
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  placeCrateInSlot(crateId: BombCrateId): void {
    if (!this.canLoadBombCrate(crateId)) return;
    this.state.bombPuzzle.slotCrate = crateId;
    this.state.bombPuzzle.lastOutcome = 'idle';
    this.state.tutorHeadline = `Crate ${crateId === 'alpha' ? 'A' : 'B'} loaded`;
    this.state.tutorBody = 'Send a photon. D0 is the evidence needed to defuse the crate.';
    this.pushEvent(
      `CRATE ${crateId === 'alpha' ? 'A' : 'B'} IN SLOT!`,
      'Half the laser passes through crate. Pull Trigger to fire 1 photon!',
      '#38bdf8',
    );
    this.state.tutorSource = 'local-physics';
    quantumAudio.playDialStep(45);
    this.emit(true);
  }

  selectAlternateBombCrate(): void {
    this.placeCrateInSlot(this.state.bombPuzzle.slotCrate === 'beta' ? 'alpha' : 'beta');
  }

  performBombMissionAction(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    switch (getBombMissionAction(bomb, this.bombInFlight)) {
      case 'calibrate':
      case 'fire':
        this.fireBombPhoton();
        break;
      case 'unload':
        this.unloadCrate();
        break;
      case 'load':
        this.placeCrateInSlot('alpha');
        break;
      case 'defuse':
        this.defuseCrate();
        break;
      case 'quarantine':
        this.quarantineCrate();
        break;
      case 'next':
        this.nextBombRound();
        break;
      case 'restore':
        bomb.bs2Installed = true;
        bomb.phasePiEnabled = false;
        bomb.lastOutcome = 'idle';
        if (bomb.caseKind !== 'optics_drift') {
          bomb.emptyCalibrated = true;
        }
        this.pushEvent('BS2 OPTICS ALIGNED!', 'Beam splitter restored! Test the empty track for green D1.', '#22d3ee');
        quantumAudio.playDialStep(60);
        this.emit(true);
        break;
    }
  }

  setBs2Installed(installed: boolean): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    const action = getBombMissionAction(bomb, this.bombInFlight);
    if (bomb.training || action === 'wait' || action === 'next') return;
    if (bomb.bs2Installed === installed) return;
    bomb.bs2Installed = installed;
    bomb.lastOutcome = 'idle';
    if (!installed || bomb.caseKind === 'optics_drift') {
      bomb.emptyCalibrated = false;
    } else {
      bomb.emptyCalibrated = true;
    }
    quantumAudio.playDialStep(installed ? 60 : 12);
    this.state.tutorHeadline = installed ? 'BS2 seated in socket' : 'Beam splitter removed';
    this.state.tutorBody =
      bomb.caseKind === 'optics_drift' && installed
        ? 'BS2 is seated! Fire on the empty track now: only green D1 proves the rig is calibrated.'
        : 'The beam splitter recombines both paths for a valid D0 test.';
    this.pushEvent(
      installed ? 'BS2 OPTICS SEATED!' : 'BS2 OPTICS REMOVED!',
      installed ? 'Both laser paths reconnect! Test empty beam for green D1.' : 'Upper & lower waves no longer combine properly.',
      installed ? '#22d3ee' : '#fbbf24',
    );
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  toggleBs2(): void {
    const bomb = this.state.bombPuzzle;
    if (this.state.experiment === 'bomb_puzzle' && bomb.training) {
      this.pushEvent(
        'TRAINING: BS2 LOCKED!',
        'Optics are pre-aligned for training. Follow the yellow arrow!',
        '#38bdf8',
        3.2,
      );
      quantumAudio.playDialStep(20);
      this.emit(false);
      return;
    }
    this.setBs2Installed(!bomb.bs2Installed);
  }

  fireBombPhoton(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    const action = getBombMissionAction(bomb, this.bombInFlight);
    if (action !== 'fire' && action !== 'calibrate') return;
    if (action === 'calibrate' && bomb.slotCrate !== null) return;

    // The training shot demonstrates one possible D0 outcome. Live cases use the full distribution.
    const rng = bomb.training ? () => 0.625 : this.bombRng;
    fireBombInterferometerPhoton(this.state, rng);
    this.bombPhotonFlyPhase = 0;
    quantumAudio.playThrowPhoton();
    this.pushEvent(
      'PHOTON LAUNCHED!',
      'Wave splits 50/50 down top crate arm & bottom reference arm...',
      '#38bdf8',
      2.2,
    );
    this.emit(false);
  }

  private revealBombResult(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    if (bomb.lastOutcome === 'exploded') {
      this.bombExplosionTimer = 1.25;
      quantumAudio.playExplosion();
      this.state.tutorHeadline = 'Photon absorbed';
      this.state.tutorBody = 'The photon struck the bomb. Start another case.';
      this.pushEvent('BOOM! BOMB TRIGGERED!', '50% chance photon entered top arm and hit the bomb fuse!', '#fb7185');
    } else if (bomb.lastOutcome === 'dark_d0') {
      if (bomb.slotCrate === null && (!bomb.bs2Installed || bomb.phasePiEnabled)) {
        quantumAudio.playCollapse(true);
        this.state.tutorHeadline = 'False D0 on empty track!';
        this.state.tutorBody = !bomb.bs2Installed
          ? 'Optics drift detected: D0 lit up with NO crate! Grab and seat BS2, then retest empty track.'
          : 'Phase shift detected: D0 lit up on empty track! Reset phase optics, then retest empty.';
        this.pushEvent(
          'ALARM: FALSE D0 ON EMPTY!',
          'With nothing inside, D0 should NEVER flash! BS2 mirror is missing!',
          '#fbbf24',
        );
      } else {
        quantumAudio.playDarkPortPing();
        this.state.tutorHeadline = 'D0 is proof without detonation';
        this.state.tutorBody =
          'Blocking the upper arm spoils cancellation so 25% leak to D0 without touching the detonator.';
        this.pushEvent(
          'D0 FLASHED! BOMB PROVEN!',
          'Bomb blocked top arm, yet photon escaped out D0 without hitting fuse!',
          '#fbbf24',
        );
      }
    } else {
      quantumAudio.playPhotonClick(532, 0.25);
      if (bomb.slotCrate === null && bomb.caseKind === 'optics_drift') {
        this.state.tutorHeadline = 'Optics calibrated (D1)';
        this.state.tutorBody = 'Empty track returned 100% D1. Load Crate A or B now to hunt the bomb.';
        this.pushEvent('D1 GREEN: OPTICS TRUSTED!', 'Clean wave interference confirmed! Load a crate to hunt bombs.', '#34d399');
      } else {
        this.state.tutorHeadline = bomb.slotCrate ? 'D1 is inconclusive' : 'Reference confirmed';
        this.state.tutorBody = 'D1 can light up with an empty path or with a bomb in the rig.';
        this.pushEvent(
          bomb.slotCrate ? 'D1 GREEN: NOT SURE YET' : 'D1 GREEN: EMPTY PATH OK!',
          bomb.slotCrate ? 'D1 can happen with glass OR a bomb. Fire again or swap!' : 'Both clear paths met at D1! Now load Crate A.',
          bomb.slotCrate ? '#38bdf8' : '#34d399',
        );
      }
    }
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.1;
    this.emit(true);
  }

  quarantineCrate(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    if (bomb.training || this.bombInFlight) return;
    const terminal =
      bomb.lastOutcome === 'defused' ||
      bomb.lastOutcome === 'exploded' ||
      bomb.lastOutcome === 'wrong_guess' ||
      bomb.lastOutcome === 'quarantined';
    if (
      terminal ||
      bomb.slotCrate === null ||
      !bomb.bs2Installed ||
      bomb.phasePiEnabled ||
      !bomb.emptyCalibrated ||
      bomb.crateProbesFired < 1
    ) {
      return;
    }

    const hitBomb = quarantineCrateChoice(this.state);
    quantumAudio.playMilestoneUnlocked();
    this.state.tutorHeadline = hitBomb ? 'Bomb contained safely' : 'Quarantined under uncertainty';
    this.state.tutorBody = hitBomb
      ? 'With tight photons you isolated the live bomb in quarantine without risking detonation!'
      : 'Safe protocol: when evidence is inconclusive and photons are scarce, quarantining avoids detonation.';
    this.pushEvent(
      hitBomb ? 'BOMB QUARANTINED!' : 'SAFE QUARANTINE!',
      hitBomb ? 'Isolated the live bomb safely without exploding!' : 'Too few photons left — containing keeps the lab safe.',
      '#38bdf8',
    );
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.4;
    this.emit(true);
  }

  defuseCrate(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    if (getBombMissionAction(bomb, this.bombInFlight) !== 'defuse' || bomb.slotCrate === null) return;

    if (bomb.training) bomb.lastOutcome = 'defused';
    else defuseCrateChoice(this.state, bomb.slotCrate);
    quantumAudio.playDefuseWin();
    this.state.tutorHeadline = bomb.training ? 'Training complete' : 'Bomb defused';
    this.state.tutorBody = 'D0 proved the bomb blocked one arm without the photon touching the fuse.';
    this.pushEvent(
      bomb.training ? 'TRAINING COMPLETE!' : 'BOMB DEFUSED (+150)!',
      'D0 flashed -> upper beam was blocked -> crate defused safely!',
      '#34d399',
    );
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.6;
    this.emit(true);
  }

  nextBombRound(): void {
    if (this.state.experiment !== 'bomb_puzzle') return;
    const bomb = this.state.bombPuzzle;
    if (getBombMissionAction(bomb, this.bombInFlight) !== 'next') return;
    if (bomb.training) {
      bomb.training = false;
      bomb.round = 0;
    }
    startNextBombRound(this.state, this.bombRng);
    this.bombExplosionTimer = 0;
    quantumAudio.playCollapse(false);
    this.state.tutorHeadline =
      bomb.caseKind === 'optics_drift'
        ? `Case ${bomb.round} · Optics Drift`
        : `Case ${bomb.round} · ${bomb.maxProbes} Photons`;
    this.state.tutorBody =
      bomb.caseKind === 'optics_drift'
        ? 'BS2 splitter is out of its socket! Test empty or seat BS2 by hand to calibrate D1.'
        : 'Two crates, 3 photons max. Probe for D0, swap, or Quarantine when uncertain.';
    this.pushEvent(
      bomb.caseKind === 'optics_drift' ? `CASE ${bomb.round}: OPTICS BROKEN!` : `CASE ${bomb.round}: 3 PHOTONS LEFT!`,
      bomb.caseKind === 'optics_drift'
        ? 'BS2 splitter fell out! Test empty beam first, then seat BS2 cube.'
        : 'Only 3 photons! Find D0, swap crates, or lock Quarantine.',
      bomb.caseKind === 'optics_drift' ? '#fbbf24' : '#38bdf8',
    );
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  // --- Mechanic 2: Two-Hand Quantum Tether ---

  toggleTetherMode(): void {
    const t = this.state.tether;
    t.mode = t.mode === 'correlated' ? 'anticorrelated' : 'correlated';
    t.leftSpin = null;
    t.rightSpin = null;
    quantumAudio.playDialStep(t.mode === 'correlated' ? 35 : 70);
    this.state.tutorHeadline =
      t.mode === 'correlated' ? 'Tether State: |Phi+> Correlated' : 'Tether State: |Psi-> Anti-Correlated';
    this.state.tutorBody =
      t.mode === 'correlated'
        ? 'Both entangled orbs always snap to the SAME spin (+1/+1 or -1/-1) when measured.'
        : 'Spin singlet |Psi->: measuring one orb instantly locks the partner to the OPPOSITE spin!';
    this.pushEvent(
      t.mode === 'correlated' ? 'MODE: SAME SPIN |Phi+>' : 'MODE: OPPOSITE SPIN |Psi->',
      t.mode === 'correlated' ? 'Both orbs snap to matching color when measured!' : 'Both orbs snap to opposite colors instantly!',
      '#a78bfa',
    );
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  nudgeTetherDistance(deltaM = 0.35): void {
    this.tetherNudgeSeq += 1;
    const next = Math.min(2.2, this.state.tether.distanceM + deltaM);
    this.updateTetherDistance(next);
  }

  updateTetherDistance(distanceM: number): void {
    const t = this.state.tether;
    const rounded = Number(Math.max(0.05, distanceM).toFixed(2));
    if (Math.abs(rounded - t.distanceM) < 0.03) return;
    t.distanceM = rounded;
    if (rounded > t.maxDistanceM) t.maxDistanceM = rounded;
    this.emit(false);
  }

  triggerTetherCollapse(): void {
    const { leftSpin, rightSpin } = measureTetherPair(this.state);
    this.pairFlyPhase = 0;
    quantumAudio.playTetherSnap(leftSpin === rightSpin);
    this.state.tutorHeadline = `Tether Collapse at ${this.state.tether.distanceM.toFixed(2)}m!`;
    this.state.tutorBody =
      `Instant correlation across space: Left = ${leftSpin > 0 ? '+1' : '-1'}, Right = ${rightSpin > 0 ? '+1' : '-1'}! (+${this.state.tether.distanceM >= 1.0 ? 25 : 15} pts)`;
    this.pushEvent(
      `SPINS LOCKED: ${leftSpin > 0 ? '+1' : '-1'} & ${rightSpin > 0 ? '+1' : '-1'}!`,
      `Entanglement synced across ${this.state.tether.distanceM.toFixed(2)}m faster than any signal!`,
      '#22d3ee',
    );
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.2;
    this.emit(true);
  }

  // --- Mechanic 3: Schrodinger Box + H/X/Z Gates ---

  applyGate(gate: QuantumGateType): void {
    applyQuantumGate(this.state, gate);
    this.gateFlashTimer = 0.65;
    this.lastAppliedGate = gate;
    quantumAudio.playGateClick(gate);
    const local = buildLocalTutorResponse('explain schrodinger gate', createSnapshot(this.state));
    this.state.tutorHeadline = `Gate ${gate} Applied: ${local.headline}`;
    this.state.tutorBody = local.answer;
    const pAwake = Math.round(this.state.schrodinger.alpha * this.state.schrodinger.alpha * 100);
    this.pushEvent(
      `GATE ${gate} APPLIED!`,
      `Now ${pAwake}% Awake / ${100 - pAwake}% Asleep inside box. Open lid to collapse!`,
      '#38bdf8',
    );
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.0;
    this.emit(true);
  }

  toggleObserveBox(forceClosed?: boolean): void {
    const s = this.state.schrodinger;
    if (forceClosed === true || !s.boxClosed) {
      resetSchrodingerBox(this.state, true);
      quantumAudio.playCollapse(false);
      this.state.tutorHeadline = 'Lid Closed: Superposition Restored';
      this.state.tutorBody =
        'Qubit reset to equal superposition H|0>. Apply X or Z gates, or lift the lid again to collapse!';
      this.pushEvent('LID CLOSED: 50/50 GHOST!', 'Both Awake & Asleep waves coexist until you peek!', '#a78bfa');
    } else {
      const outcome = observeSchrodingerBox(this.state);
      quantumAudio.playCollapse(true);
      this.state.tutorHeadline =
        outcome === 'awake' ? 'Observed: AWAKE |0>!' : 'Observed: ASLEEP |1>!';
      this.state.tutorBody =
        `Born-rule collapse locked state |${outcome === 'awake' ? '0' : '1'}> after circuit [${s.appliedGates.join(' -> ') || 'None'}]. Tap Close & Reset or apply a new gate!`;
      this.pushEvent(
        outcome === 'awake' ? 'COLLAPSED: CAT AWAKE |0>!' : 'COLLAPSED: CAT ASLEEP |1>!',
        s.lastMissionWon ? 'Mission solved (+100)! Close lid for next puzzle!' : 'Opening forced fuzzy wave into 1 definite state!',
        s.lastMissionWon ? '#34d399' : '#fbbf24',
      );
    }
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.3;
    this.emit(true);
  }

  // --- Mechanic 4: Double-Slit Roomscale & Throw Photon ---

  toggleRoomscaleWave(): void {
    this.state.roomscaleWave = !this.state.roomscaleWave;
    quantumAudio.playDialStep(this.state.roomscaleWave ? 75 : 20);
    this.state.tutorHeadline = this.state.roomscaleWave
      ? 'Roomscale 3D Wave Field ON!'
      : 'Roomscale Wave Field OFF';
    this.state.tutorBody = this.state.roomscaleWave
      ? 'Walk around your living room inside the live two-slit wave ripples, occluded behind real furniture!'
      : 'Returned interference view to tabletop optical bench and phosphor histogram.';
    this.pushEvent(
      this.state.roomscaleWave ? '3D ROOM WAVES ACTIVATED!' : 'TABLETOP VIEW RESTORED',
      this.state.roomscaleWave ? 'Both slits emit ripples across your floor! Spy Slit A to stop interference.' : 'Back to bench oscilloscope view.',
      '#2ef299',
    );
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  triggerThrowPhoton(): void {
    this.throwPhotonSeq += 1;
    this.state.thrownPhotonsCount += 1;
    recordDoubleSlitBurst(this.state, 1);
    this.pulseBurstTimer = 0.55;
    quantumAudio.playThrowPhoton();
    this.pushEvent(
      'PHOTON WAVE THROWN!',
      'Travels as a wave through BOTH slits, hits screen as 1 particle dot!',
      '#38bdf8',
      3.0,
    );
    this.emit(true);
  }

  // --- Double-Slit & Bell Controls ---

  setWhichPathDetector(enabled: boolean, fromPhysicalProbe = false): void {
    if (this.state.whichPathDetector === enabled) return;
    this.state.whichPathDetector = enabled;
    this.probeAutoControlled = !fromPhysicalProbe;
    clearScreenAccumulation(this.state);
    recordDoubleSlitBurst(this.state, 28);
    quantumAudio.playCollapse(enabled);
    const local = buildLocalTutorResponse(
      enabled ? 'why did fringes vanish detector' : 'explain superposition',
      createSnapshot(this.state),
    );
    this.state.tutorHeadline = local.headline;
    this.state.tutorBody = local.answer;
    this.pushEvent(
      enabled ? 'SPYING ON SLIT A: WAVES GONE!' : 'PROBE REMOVED: INTERFERENCE BACK!',
      enabled ? 'Measuring which slit photon used destroys quantum stripes!' : 'No spying -> both paths interfere into wave stripes again!',
      enabled ? '#fbbf24' : '#34d399',
    );
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.2;
    this.emit(true);
  }

  toggleWhichPathDetector(): void {
    this.setWhichPathDetector(!this.state.whichPathDetector, false);
  }

  cycleWavelength(): void {
    const idx = WAVELENGTH_OPTIONS.indexOf(this.state.wavelengthNm);
    const next = WAVELENGTH_OPTIONS[(idx + 1) % WAVELENGTH_OPTIONS.length];
    this.setWavelength(next);
  }

  setWavelength(nm: WavelengthNm): void {
    if (this.state.wavelengthNm === nm) return;
    this.state.wavelengthNm = nm;
    clearScreenAccumulation(this.state);
    recordDoubleSlitBurst(this.state, 28);
    quantumAudio.playPhotonClick(nm, 0);
    const local = buildLocalTutorResponse('how does wavelength change fringe spacing', createSnapshot(this.state));
    this.state.tutorHeadline = local.headline;
    this.state.tutorBody = local.answer;
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.0;
    this.emit(true);
  }

  cycleScreenDistance(): void {
    const idx = SCREEN_DISTANCE_OPTIONS.indexOf(this.state.screenDistanceScale ?? 1.0);
    const next = SCREEN_DISTANCE_OPTIONS[(idx + 1) % SCREEN_DISTANCE_OPTIONS.length];
    this.state.screenDistanceScale = next;
    clearScreenAccumulation(this.state);
    recordDoubleSlitBurst(this.state, 32);
    quantumAudio.playDialStep(next * 30);
    this.state.tutorHeadline = `Screen Distance L = ${next.toFixed(2)}x`;
    this.state.tutorBody =
      next > 1.0
        ? 'Increasing screen distance L spreads interference fringes wider across the detector!'
        : next < 1.0
          ? 'Bringing the screen closer compresses fringe spacing delta_y = lambda * L / d.'
          : 'Restored baseline optical path distance L = 1.00x.';
    this.emit(true);
  }

  cycleSlitSeparation(): void {
    const idx = SLIT_SEPARATION_OPTIONS.indexOf(this.state.slitSeparationMm);
    const next = SLIT_SEPARATION_OPTIONS[(idx + 1) % SLIT_SEPARATION_OPTIONS.length];
    this.state.slitSeparationMm = next;
    clearScreenAccumulation(this.state);
    recordDoubleSlitBurst(this.state, 28);
    this.emit(true);
  }

  setSlitMode(mode: SlitMode): void {
    if (this.state.slitMode === mode) return;
    this.state.slitMode = mode;
    clearScreenAccumulation(this.state);
    recordDoubleSlitBurst(this.state, 24);
    quantumAudio.playCollapse(mode === 'single');
    const local = buildLocalTutorResponse('single vs both slits', createSnapshot(this.state));
    this.state.tutorHeadline = local.headline;
    this.state.tutorBody = local.answer;
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  toggleSlitMode(): void {
    this.setSlitMode(this.state.slitMode === 'both' ? 'single' : 'both');
  }

  cycleBobAngle(): void {
    const idx = ANALYZER_ANGLES.indexOf(this.state.bobAngleDeg);
    const next = ANALYZER_ANGLES[(idx + 1) % ANALYZER_ANGLES.length];
    this.setAnalyzerAngles(this.state.aliceAngleDeg, next);
  }

  cycleAliceAngle(): void {
    const idx = ANALYZER_ANGLES.indexOf(this.state.aliceAngleDeg);
    const next = ANALYZER_ANGLES[(idx + 1) % ANALYZER_ANGLES.length];
    this.setAnalyzerAngles(next, this.state.bobAngleDeg);
  }

  stepNextChshSetting(): void {
    if (this.state.experiment !== 'entanglement') {
      this.state.experiment = 'entanglement';
    }
    const nextUnmeasured = CHSH_CANONICAL_PAIRS.find(([a, b]) => {
      const cell = this.state.chshCells[chshKey(a, b)];
      return !cell || cell.pairCount < 4;
    });
    const [a, b] =
      nextUnmeasured ??
      CHSH_CANONICAL_PAIRS[this.chshStepCursor % CHSH_CANONICAL_PAIRS.length];
    this.chshStepCursor += 1;
    this.state.aliceAngleDeg = a;
    this.state.bobAngleDeg = b;
    clearEntanglementStats(this.state);
    this.state.theoreticalCorrelation = computeBellCorrelation(a, b);
    const { outcomeA, outcomeB } = recordEntangledBurst(this.state, 60);
    this.pairFlyPhase = 0;
    quantumAudio.playBellPair(outcomeA === outcomeB);
    this.state.tutorHeadline = `CHSH Sampled (${a} deg, ${b} deg)`;
    this.state.tutorBody =
      this.state.chshWitnessS != null
        ? `Live CHSH witness S = ${this.state.chshWitnessS.toFixed(2)} (classical bound <= 2.00, quantum max ~2.83)!`
        : `Collected 60 pairs at (${a}, ${b}). Press CHSH Test again to sweep remaining Bell angles (${Object.keys(this.state.chshCells).length}/4 done).`;
    this.pushEvent(
      this.state.chshWitnessS != null ? `QUANTUM WIN S = ${this.state.chshWitnessS.toFixed(2)}!` : `BELL TEST (${a}°, ${b}°)`,
      this.state.chshWitnessS != null ? 'Beat classical 2.00 limit — true entanglement!' : 'Measured 60 entangled photon pairs at this angle!',
      this.state.chshWitnessS != null ? '#34d399' : '#a78bfa',
    );
    this.state.tutorSource = 'local-physics';
    this.emit(true);
  }

  setAnalyzerAngles(alice: AnalyzerAngleDeg, bob: AnalyzerAngleDeg): void {
    if (this.state.aliceAngleDeg === alice && this.state.bobAngleDeg === bob && this.state.pairCount > 0) {
      return;
    }
    this.state.aliceAngleDeg = alice;
    this.state.bobAngleDeg = bob;
    clearEntanglementStats(this.state);
    this.state.theoreticalCorrelation = computeBellCorrelation(alice, bob);
    const { outcomeA, outcomeB } = recordEntangledBurst(this.state, 20);
    this.pairFlyPhase = 0;
    quantumAudio.playDialStep(Math.abs(alice - bob));
    quantumAudio.playBellPair(outcomeA === outcomeB);
    const local = buildLocalTutorResponse('explain bell entanglement correlation', createSnapshot(this.state));
    this.state.tutorHeadline = local.headline;
    this.state.tutorBody = local.answer;
    this.pushEvent(
      `DIALS SET: ${alice}° & ${bob}°`,
      `Predicted match E = ${this.state.theoreticalCorrelation.toFixed(2)} across entangled pairs!`,
      '#a78bfa',
    );
    this.state.tutorSource = 'local-physics';
    this.tutorPulseTimer = 1.0;
    this.emit(true);
  }

  fireBurst(): void {
    if (this.state.experiment === 'bomb_puzzle') {
      this.fireBombPhoton();
      return;
    }
    if (this.state.experiment === 'tether') {
      this.triggerTetherCollapse();
      return;
    }
    if (this.state.experiment === 'schrodinger') {
      this.toggleObserveBox();
      return;
    }
    if (this.state.experiment === 'double_slit') {
      recordDoubleSlitBurst(this.state, 45);
      this.pulseBurstTimer = 0.65;
      quantumAudio.playPhotonClick(this.state.wavelengthNm, 0);
    } else {
      const { outcomeA, outcomeB } = recordEntangledBurst(this.state, 25);
      this.pairFlyPhase = 0;
      quantumAudio.playBellPair(outcomeA === outcomeB);
    }
    this.emit(true);
  }

  toggleAutoStream(): void {
    this.state.autoStream = !this.state.autoStream;
    this.emit(false);
  }

  resetCurrentExperiment(): void {
    const exp = this.state.experiment;
    if (exp === 'bomb_puzzle') {
      this.nextBombRound();
      return;
    }
    if (exp === 'tether') {
      this.state.tether.leftSpin = null;
      this.state.tether.rightSpin = null;
      this.state.tutorHeadline = 'Tether Orbs Reset to Superposition';
      this.state.tutorBody = 'Drag the two orbs apart across your room, then shake or tap Collapse!';
    } else if (exp === 'schrodinger') {
      resetSchrodingerBox(this.state, true);
      this.state.tutorHeadline = 'Schrodinger Box Reset (H|0>)';
      this.state.tutorBody = 'Equal 50/50 ghost superposition armed inside! Try applying Z then H!';
    } else if (exp === 'double_slit') {
      this.state.whichPathDetector = false;
      this.state.slitMode = 'both';
      this.state.wavelengthNm = 532;
      this.state.slitSeparationMm = 0.48;
      this.state.screenDistanceScale = 1.0;
      this.probeAutoControlled = true;
      clearScreenAccumulation(this.state);
      recordDoubleSlitBurst(this.state, 36);
      this.state.tutorHeadline = 'Quantum Superposition Active';
      this.state.tutorBody =
        'Screen cleared. Photons pass through both slits as coherent waves with 94% fringe visibility.';
    } else {
      this.state.aliceAngleDeg = 0;
      this.state.bobAngleDeg = 22.5;
      this.state.chshCells = {};
      this.state.chshWitnessS = null;
      this.chshStepCursor = 0;
      clearEntanglementStats(this.state);
      recordEntangledBurst(this.state, 16);
      this.pairFlyPhase = 0;
      const local = buildLocalTutorResponse('explain entanglement bell', createSnapshot(this.state));
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
    }
    this.state.tutorSource = 'local-physics';
    this.state.theoreticalVisibility = computeTheoreticalVisibility(this.state);
    this.emit(true);
  }

  tickSimulation(deltaSec: number): void {
    if (this.pulseBurstTimer > 0) {
      this.pulseBurstTimer = Math.max(0, this.pulseBurstTimer - deltaSec);
    }
    if (this.tutorPulseTimer > 0) {
      this.tutorPulseTimer = Math.max(0, this.tutorPulseTimer - deltaSec);
    }
    if (this.eventTimer > 0) {
      this.eventTimer = Math.max(0, this.eventTimer - deltaSec);
    }
    if (this.bombExplosionTimer > 0) {
      this.bombExplosionTimer = Math.max(0, this.bombExplosionTimer - deltaSec);
    }
    if (this.gateFlashTimer > 0) {
      this.gateFlashTimer = Math.max(0, this.gateFlashTimer - deltaSec);
    }
    if (this.pairFlyPhase < 1) {
      this.pairFlyPhase = Math.min(1, this.pairFlyPhase + deltaSec * 2.4);
    }
    if (this.bombPhotonFlyPhase < 1) {
      this.bombPhotonFlyPhase = Math.min(1, this.bombPhotonFlyPhase + deltaSec * 1.5);
      if (!this.bombInFlight) this.revealBombResult();
    }
    if (!this.state.autoStream || this.state.experiment !== 'double_slit') {
      return;
    }
    this.streamAccumSec += deltaSec;
    if (this.streamAccumSec >= 0.22) {
      this.streamAccumSec = 0;
      if (this.state.totalHits < 1200) {
        recordDoubleSlitBurst(this.state, 2);
        this.emit(true);
      }
    }
  }

  async checkHealth(): Promise<void> {
    try {
      const resp = await fetch('/api/health');
      if (!resp.ok) return;
      const data = (await resp.json()) as { liveAiConfigured?: boolean };
      this.liveAiConfigured = Boolean(data.liveAiConfigured);
      this.emit(false);
    } catch {
      // Static build / offline mode uses local physics tutor seamlessly
    }
  }

  setByok(provider: ByokProvider, apiKey: string): void {
    this.byok = { provider, apiKey: apiKey.trim() };
    this.emit(false);
  }

  async askTutor(question: string): Promise<void> {
    const trimmed = question.trim() || 'What am I observing right now?';
    this.tutorBusy = true;
    this.lastNotice = '';
    this.emit(false);

    const snapshot = createSnapshot(this.state);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.byok.apiKey) {
        headers['x-byok-api-key'] = this.byok.apiKey;
        headers['x-byok-provider'] = this.byok.provider;
      }

      const resp = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: trimmed, snapshot }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as {
        source?: 'local-physics' | 'openrouter' | 'anthropic';
        headline?: string;
        answer?: string;
        notice?: string;
      };
      const local = buildLocalTutorResponse(trimmed, snapshot);
      this.state.tutorHeadline = data.headline?.trim() || local.headline;
      this.state.tutorBody = data.answer?.trim() || local.answer;
      this.state.tutorSource = data.source ?? 'local-physics';
      this.lastNotice = data.notice ?? '';
    } catch {
      const local = buildLocalTutorResponse(trimmed, snapshot);
      this.state.tutorHeadline = local.headline;
      this.state.tutorBody = local.answer;
      this.state.tutorSource = 'local-physics';
    } finally {
      this.tutorBusy = false;
      this.tutorPulseTimer = 1.6;
      this.emit(false);
    }
  }
}

export const labController = new QuantumLabController();
