export type ExperimentMode =
  | 'bomb_puzzle'
  | 'tether'
  | 'schrodinger'
  | 'double_slit'
  | 'entanglement';
export type SlitMode = 'both' | 'single';
export type WavelengthNm = 430 | 532 | 650;
export type AnalyzerAngleDeg = 0 | 22.5 | 45 | 67.5 | 90;

export type BombCrateId = 'alpha' | 'beta';
export type BombCaseKind = 'training' | 'budget' | 'optics_drift';
export type BombOutcome =
  | 'idle'
  | 'safe_d1'
  | 'dark_d0'
  | 'exploded'
  | 'defused'
  | 'wrong_guess'
  | 'quarantined';

export type TetherMode = 'correlated' | 'anticorrelated';
export type QuantumGateType = 'H' | 'X' | 'Z';
export type SchrodingerOutcome = 'awake' | 'asleep';

export const WAVELENGTH_OPTIONS: readonly WavelengthNm[] = [650, 532, 430];
export const SLIT_SEPARATION_OPTIONS: readonly number[] = [0.28, 0.48, 0.68];
export const SCREEN_DISTANCE_OPTIONS: readonly number[] = [0.75, 1.0, 1.3];
export const ANALYZER_ANGLES: readonly AnalyzerAngleDeg[] = [
  0,
  22.5,
  45,
  67.5,
  90,
];
export const CHSH_CANONICAL_PAIRS: ReadonlyArray<
  readonly [AnalyzerAngleDeg, AnalyzerAngleDeg]
> = [
  [0, 22.5],
  [0, 67.5],
  [45, 22.5],
  [45, 67.5],
];

export const SCREEN_HISTOGRAM_BINS = 72;
export const MAX_RENDERED_HITS = 260;

export interface ChshCell {
  pairCount: number;
  sameCount: number;
  oppositeCount: number;
  correlation: number;
}

export interface ScreenHit {
  xNorm: number; // [-1, 1]
  yNorm: number; // [-1, 1]
  wavelengthNm: WavelengthNm;
}

export interface DoubleSlitConfig {
  wavelengthNm: WavelengthNm;
  slitSeparationMm: number;
  screenDistanceScale?: number;
  slitMode: SlitMode;
  whichPathDetector: boolean;
}

export interface EntanglementConfig {
  aliceAngleDeg: AnalyzerAngleDeg;
  bobAngleDeg: AnalyzerAngleDeg;
}

export interface BombPuzzleState {
  training: boolean;
  caseKind: BombCaseKind;
  round: number;
  slotCrate: BombCrateId | null;
  bombCrate: BombCrateId;
  bs2Installed: boolean;
  phasePiEnabled: boolean;
  emptyCalibrated: boolean;
  maxProbes: number;
  probesFired: number;
  crateProbesFired: number;
  darkHits: number;
  safeHits: number;
  explosions: number;
  defusedCount: number;
  quarantinedCount: number;
  lastOutcome: BombOutcome;
  lastBeamSeq: number;
}

export interface TetherState {
  mode: TetherMode;
  leftSpin: 1 | -1 | null;
  rightSpin: 1 | -1 | null;
  distanceM: number;
  maxDistanceM: number;
  targetDistanceM: number;
  challengesCompleted: number;
  collapses: number;
  pulseSeq: number;
}

export interface SchrodingerState {
  boxClosed: boolean;
  alpha: number; // amplitude for Awake |0>
  beta: number; // amplitude for Asleep |1>
  appliedGates: QuantumGateType[];
  observedState: SchrodingerOutcome | null;
  collapseCount: number;
  missionIndex: number; // 0: 100% Asleep |1>, 1: 100% Awake |0>, 2: 50/50 Minus |->
  missionsSolved: number;
  lastMissionWon: boolean;
}

export interface QuantumLabState extends DoubleSlitConfig, EntanglementConfig {
  experiment: ExperimentMode;
  autoStream: boolean;
  score: number;
  streak: number;
  roomscaleWave: boolean;
  thrownPhotonsCount: number;
  bombPuzzle: BombPuzzleState;
  tether: TetherState;
  schrodinger: SchrodingerState;
  totalHits: number;
  histogram: number[];
  recentHits: ScreenHit[];
  theoreticalVisibility: number;
  measuredFringeContrast: number;
  pairCount: number;
  sameOutcomeCount: number;
  oppositeOutcomeCount: number;
  lastOutcomeA: 1 | -1 | null;
  lastOutcomeB: 1 | -1 | null;
  theoreticalCorrelation: number;
  measuredCorrelation: number;
  chshCells: Record<string, ChshCell>;
  chshWitnessS: number | null;
  questStep: 1 | 2 | 3 | 4; // 4 = All Quantum Milestones Unlocked
  tutorHeadline: string;
  tutorBody: string;
  tutorSource: 'local-physics' | 'openrouter' | 'anthropic';
}

export interface QuantumLabSnapshot {
  experiment: ExperimentMode;
  score: number;
  streak: number;
  roomscaleWave: boolean;
  bombRound: number;
  bombSlotCrate: BombCrateId | null;
  bombBs2Installed: boolean;
  bombPhasePiEnabled: boolean;
  bombProbesFired: number;
  bombDarkHits: number;
  bombSafeHits: number;
  bombDefusedCount: number;
  bombLastOutcome: BombOutcome;
  tetherMode: TetherMode;
  tetherDistanceM: number;
  tetherLeftSpin: 1 | -1 | null;
  tetherRightSpin: 1 | -1 | null;
  tetherCollapses: number;
  schrodingerClosed: boolean;
  schrodingerProbAwake: number;
  schrodingerProbAsleep: number;
  schrodingerPhaseSign: 1 | -1;
  schrodingerGates: string;
  schrodingerObserved: SchrodingerOutcome | null;
  wavelengthNm: WavelengthNm;
  slitSeparationMm: number;
  screenDistanceScale: number;
  slitMode: SlitMode;
  whichPathDetector: boolean;
  totalHits: number;
  theoreticalVisibility: number;
  measuredFringeContrast: number;
  aliceAngleDeg: AnalyzerAngleDeg;
  bobAngleDeg: AnalyzerAngleDeg;
  pairCount: number;
  sameOutcomeCount: number;
  oppositeOutcomeCount: number;
  theoreticalCorrelation: number;
  measuredCorrelation: number;
  chshWitnessS: number | null;
  questStep: number;
  lastOutcomeA: 1 | -1 | null;
  lastOutcomeB: 1 | -1 | null;
}

export type OnboardingTarget =
  | 'crates'
  | 'bomb_slot'
  | 'bomb_fire'
  | 'bomb_dark'
  | 'bomb_next'
  | 'bs2_out'
  | 'bs2_socket'
  | 'tether_orbs'
  | 'tether_shake'
  | 'gates'
  | 'gate_dock'
  | 'box_lid'
  | 'probe'
  | 'slit_a'
  | 'roomscale'
  | 'dials'
  | 'none';

export interface OnboardingHint {
  visible: boolean;
  target: OnboardingTarget;
  stepTag: string;
  ctaText: string;
  accentHex: string;
  controlHint?: string;
  whyText?: string;
}

export type BombMissionAction =
  | 'calibrate'
  | 'unload'
  | 'load'
  | 'fire'
  | 'defuse'
  | 'quarantine'
  | 'next'
  | 'restore'
  | 'wait';

export function getBombMissionAction(bomb: BombPuzzleState, inFlight = false): BombMissionAction {
  if (inFlight) return 'wait';
  if (
    bomb.lastOutcome === 'defused' ||
    bomb.lastOutcome === 'exploded' ||
    bomb.lastOutcome === 'wrong_guess' ||
    bomb.lastOutcome === 'quarantined'
  ) {
    return 'next';
  }

  // Case 3 (Optics Drift): allow shooting the empty track even while BS2/phase is drift-faulted so
  // the player sees the false D0 signal, diagnoses it, seats BS2 physically, and verifies D1 on empty.
  if (bomb.caseKind === 'optics_drift') {
    const opticsClean = bomb.bs2Installed && !bomb.phasePiEnabled;
    if (!opticsClean) {
      if (bomb.slotCrate === null && bomb.probesFired === 0 && bomb.lastOutcome === 'idle') {
        return 'calibrate';
      }
      return 'restore';
    }
    if (!bomb.emptyCalibrated) {
      return bomb.slotCrate !== null ? 'unload' : 'calibrate';
    }
  } else if (!bomb.bs2Installed || bomb.phasePiEnabled) {
    return 'restore';
  }

  if (bomb.slotCrate === null) {
    return bomb.training && bomb.probesFired === 0 ? 'calibrate' : 'load';
  }
  if (bomb.lastOutcome === 'dark_d0') {
    return 'defuse';
  }
  if (!bomb.training && bomb.maxProbes > 0 && bomb.crateProbesFired >= bomb.maxProbes) {
    return 'quarantine';
  }
  return 'fire';
}

export function getBombMissionControls(bomb: BombPuzzleState, inFlight: boolean) {
  const action = getBombMissionAction(bomb, inFlight);
  const primary = {
    calibrate: 'Check empty track',
    unload: bomb.slotCrate === 'alpha' ? 'Remove crate A' : 'Remove crate B',
    load: 'Load crate A',
    fire: bomb.lastOutcome === 'safe_d1' ? 'Fire again' : 'Fire photon',
    defuse: 'Defuse crate',
    quarantine: 'Quarantine crate',
    next: bomb.training ? 'Start live case' : 'Next case',
    restore: !bomb.bs2Installed ? 'Seat BS2 splitter' : 'Reset phase optics',
    wait: 'Photon in flight',
  }[action];

  let alternate = '';
  if (!bomb.training && (action === 'load' || action === 'fire')) {
    alternate =
      bomb.slotCrate === null
        ? 'Load crate B'
        : bomb.slotCrate === 'alpha'
          ? 'Swap to B'
          : 'Swap to A';
  }

  const canQuarantine =
    !bomb.training &&
    bomb.slotCrate !== null &&
    bomb.bs2Installed &&
    !bomb.phasePiEnabled &&
    bomb.emptyCalibrated &&
    bomb.crateProbesFired >= 1 &&
    action === 'fire';

  return { primary, alternate, canQuarantine, waiting: action === 'wait' };
}

export function isSchrodingerMissionReady(s: SchrodingerState): boolean {
  const p0 = s.alpha * s.alpha;
  const p1 = s.beta * s.beta;
  const m = ((s.missionIndex ?? 0) % 3 + 3) % 3;
  if (m === 0) return p1 >= 0.99; // 100% Asleep |1>
  if (m === 1) return p0 >= 0.99; // 100% Awake |0>
  return Math.abs(p0 - 0.5) < 0.05 && s.alpha * s.beta < -0.1; // Balanced 50/50 Minus |->
}

export function describeSchrodingerMission(missionIndex: number): string {
  const m = ((missionIndex ?? 0) % 3 + 3) % 3;
  if (m === 0) return 'Mission 1: Make 100% Asleep |1> (Z->H), open Lid';
  if (m === 1) return 'Mission 2: Make 100% Awake |0> (Gate H), open Lid';
  return 'Mission 3: Make Minus |-> (H then Z), open Lid';
}

/** The next actionable hint for the panel, desktop HUD, and scene cues. */
export function computeOnboardingHint(
  state: QuantumLabState,
  holdingKind: 'none' | 'crate' | 'gate' | 'probe' | 'bs2' = 'none',
  bombInFlight = false,
): OnboardingHint {
  const exp = state.experiment;

  if (exp === 'bomb_puzzle') {
    const bp = state.bombPuzzle;
    const action = getBombMissionAction(bp, bombInFlight);
    const probesLeft = bp.maxProbes > 0 ? Math.max(0, bp.maxProbes - bp.crateProbesFired) : 0;

    if (action === 'wait') {
      return {
        visible: false,
        target: 'none',
        stepTag: 'PHOTON FLYING',
        ctaText: 'Watch the photon wave split!',
        accentHex: '#38bdf8',
        controlHint: 'WATCH BEAM',
        whyText: 'Half goes top arm (crate), half bottom arm!',
      };
    }
    if (action === 'next') {
      if (bp.lastOutcome === 'quarantined') {
        const hitBomb = bp.slotCrate === bp.bombCrate;
        return {
          visible: true,
          target: 'bomb_next',
          stepTag: hitBomb ? 'BOMB CONTAINED' : 'SAFE QUARANTINE',
          ctaText: hitBomb
            ? 'Smart quarantine! Bomb isolated safely.'
            : 'Crate isolated under tight budget.',
          accentHex: '#38bdf8',
          controlHint: 'TRIGGER Rig / Next Case',
          whyText: 'No blind guess needed when photons ran low!',
        };
      }
      const saved = bp.lastOutcome === 'defused';
      return {
        visible: true,
        target: 'bomb_next',
        stepTag: saved ? (bp.training ? 'TRAINING COMPLETE' : 'CRATE DEFUSED') : 'CASE LOST',
        ctaText: saved
          ? 'D0 proved a bomb blocked 1 arm without touching the fuse!'
          : 'The photon hit the bomb fuse. Try a new case!',
        accentHex: saved ? '#34d399' : '#fb7185',
        controlHint: 'TRIGGER Rig / Next Case',
        whyText: saved ? 'Ready for next quantum mystery!' : 'Try swapping earlier or quarantine!',
      };
    }
    if (action === 'restore') {
      if (holdingKind === 'bs2') {
        return {
          visible: true,
          target: 'bs2_socket',
          stepTag: 'SEAT BS2',
          ctaText: 'Drop BS2 splitter onto the glowing corner ring!',
          accentHex: '#22d3ee',
          controlHint: 'RELEASE GRIP / PINCH HERE',
          whyText: 'Recombines upper & lower light waves!',
        };
      }
      if (!bp.bs2Installed) {
        return {
          visible: true,
          target: 'bs2_out',
          stepTag: 'OPTICS DRIFT',
          ctaText: 'False D0 on empty track! Grab BS2 cube & seat it.',
          accentHex: '#fbbf24',
          controlHint: 'GRIP/PINCH or TRIGGER BS2',
          whyText: 'Missing mirror breaks wave cancellation!',
        };
      }
      return {
        visible: true,
        target: 'bs2_socket',
        stepTag: 'OPTICS DRIFT',
        ctaText: 'Phase pi is shifted! Reset optics, then test empty.',
        accentHex: '#fbbf24',
        controlHint: 'TRIGGER Reset Optics',
        whyText: 'Inverted phase falsely flips D1 to D0!',
      };
    }
    if (action === 'quarantine') {
      return {
        visible: true,
        target: 'bomb_slot',
        stepTag: '0 PHOTONS LEFT',
        ctaText: 'Budget spent! Quarantine the uncertain crate now.',
        accentHex: '#f59e0b',
        controlHint: 'TRIGGER Quarantine',
        whyText: 'Isolating safely beats a 50/50 blind guess!',
      };
    }
    if (action === 'defuse') {
      return {
        visible: true,
        target: 'bomb_dark',
        stepTag: 'D0 / PROOF',
        ctaText: 'D0 lit up: 1 arm blocked without explosion. Defuse!',
        accentHex: '#fbbf24',
        controlHint: 'TRIGGER Rig / Defuse Btn',
        whyText: 'Only a bomb stops wave cancellation -> leaks D0!',
      };
    }
    if (action === 'unload') {
      return {
        visible: true,
        target: 'bomb_slot',
        stepTag: 'UNLOAD CRATE FIRST',
        ctaText: 'Remove the crate from SLOT before calibrating empty optics.',
        accentHex: '#fbbf24',
        controlHint: 'TRIGGER Remove / DRAG OFF',
        whyText: 'Empty track must show D1 to trust optics!',
      };
    }
    if (action === 'calibrate') {
      const tag = bp.caseKind === 'optics_drift' ? 'CHECK OPTICS' : '1 / 3 - REFERENCE';
      const copy =
        bp.caseKind === 'optics_drift'
          ? bp.bs2Installed
            ? 'BS2 seated! Fire on empty track: only green D1 confirms trust.'
            : 'Suspicious rig! Fire empty check first to inspect light signal.'
          : 'Find a hidden bomb. Test the empty rig first (expect D1).';
      return {
        visible: true,
        target: 'bomb_fire',
        stepTag: tag,
        ctaText: copy,
        accentHex: '#38bdf8',
        controlHint: 'TRIGGER Laser / Empty Check',
        whyText: 'Both waves cancel D0 when path is clear -> green D1!',
      };
    }
    if (holdingKind === 'crate' && (action === 'load' || !bp.training)) {
      return {
        visible: true,
        target: 'bomb_slot',
        stepTag: 'LOAD THE RIG',
        ctaText: 'Release the crate inside the glowing SLOT ring.',
        accentHex: '#fbbf24',
        controlHint: 'RELEASE GRIP / PINCH HERE',
        whyText: 'Places crate straight inside upper photon arm!',
      };
    }
    if (action === 'load') {
      return {
        visible: true,
        target: 'crates',
        stepTag: bp.training ? '2 / 3 - D1 REFERENCE' : `CHOOSE CRATE (${probesLeft}/${bp.maxProbes})`,
        ctaText: bp.training
          ? 'Empty D1 confirmed! Pinch crate A and drop it in SLOT.'
          : 'Pick crate A or B and drop it into the glowing SLOT ring.',
        accentHex: '#38bdf8',
        controlHint: 'TRIGGER Click or GRIP/PINCH',
        whyText: 'Empty glass gives D1; a real bomb can trigger D0!',
      };
    }
    const budgetTag = bp.maxProbes > 0 ? ` · ${probesLeft}/${bp.maxProbes} LEFT` : '';
    return {
      visible: true,
      target: 'bomb_fire',
      stepTag: bp.training
        ? '3 / 3 - GUIDED D0'
        : bp.lastOutcome === 'safe_d1'
          ? `D1 / UNCERTAIN${budgetTag}`
          : `CRATE LOADED${budgetTag}`,
      ctaText: bp.lastOutcome === 'safe_d1'
        ? 'D1 is inconclusive. Fire again, swap crate, or Quarantine.'
        : 'Send one photon. A D0 flash proves the bomb safely.',
      accentHex: '#38bdf8',
      controlHint: 'TRIGGER Rig / Fire Button',
      whyText: 'A photon avoids the fuse 25% of the time & flashes D0!',
    };
  }

  if (exp === 'tether') {
    const t = state.tether;
    const goal = t.targetDistanceM ?? 0.9;
    if (t.distanceM < goal) {
      return {
        visible: true,
        target: 'tether_orbs',
        stepTag: `TARGET ${goal.toFixed(2)}M`,
        ctaText: `Pull Orbs >= ${goal.toFixed(2)}m apart (${t.distanceM.toFixed(2)}m now)`,
        accentHex: '#a78bfa',
        controlHint: 'HOLD TRIGGER / GRIP Orb',
        whyText: 'Stretch spooky entanglement far across room!',
      };
    }
    if (t.collapses === 0 || t.challengesCompleted === 0) {
      return {
        visible: true,
        target: 'tether_shake',
        stepTag: 'DISTANCE HIT!',
        ctaText: 'Shake a held Orb (or tap Collapse) for +75 PTS!',
        accentHex: '#22d3ee',
        controlHint: 'TRIGGER Click / SHAKE Orb',
        whyText: 'Measuring one orb locks partner instantly!',
      };
    }
    return {
      visible: true,
      target: 'tether_orbs',
      stepTag: `WIN ${t.challengesCompleted}x`,
      ctaText: `Pull to ${goal.toFixed(2)}m or flip |Psi-> anti-mode!`,
      accentHex: '#34d399',
      controlHint: 'GRIP Orbs or Toggle |Psi->',
      whyText: '|Psi-> makes opposite spins across space!',
    };
  }

  if (exp === 'schrodinger') {
    const s = state.schrodinger;
    if (!s.boxClosed) {
      return {
        visible: true,
        target: 'box_lid',
        stepTag: s.lastMissionWon ? 'MISSION SOLVED +100' : 'OBSERVED',
        ctaText: `${s.observedState?.toUpperCase()}! Tap Lid for ${s.lastMissionWon ? 'Next Mission' : 'Retry'}`,
        accentHex: s.lastMissionWon ? '#34d399' : '#a78bfa',
        controlHint: 'TRIGGER Lid / Close Button',
        whyText: 'Closing lid restores 50/50 quantum superposition!',
      };
    }
    if (holdingKind === 'gate') {
      return {
        visible: true,
        target: 'gate_dock',
        stepTag: 'DROP ON DOCK',
        ctaText: 'Drop Cube onto the glowing Front Dock!',
        accentHex: '#38bdf8',
        controlHint: 'RELEASE TRIGGER / GRIP',
        whyText: 'Gate rotates the quantum cat inside before peeking!',
      };
    }
    const ready = isSchrodingerMissionReady(s);
    if (ready) {
      return {
        visible: true,
        target: 'box_lid',
        stepTag: 'STATE READY!',
        ctaText: 'Circuit matches! Lift or Tap Box Lid now (+100 PTS)!',
        accentHex: '#34d399',
        controlHint: 'TRIGGER / LIFT Box Lid',
        whyText: 'Wave probabilities now match your mission target!',
      };
    }
    if (s.appliedGates.length <= 1) {
      return {
        visible: true,
        target: 'gates',
        stepTag: `MISSION ${(s.missionIndex % 3) + 1}/3`,
        ctaText: describeSchrodingerMission(s.missionIndex),
        accentHex: '#38bdf8',
        controlHint: 'TRIGGER Cube or DRAG Dock',
        whyText: 'Gates shift Awake vs Asleep cat probabilities!',
      };
    }
    return {
      visible: true,
      target: 'box_lid',
      stepTag: `MISSION ${(s.missionIndex % 3) + 1}/3`,
      ctaText: describeSchrodingerMission(s.missionIndex),
      accentHex: '#fbbf24',
      controlHint: 'TRIGGER / LIFT Box Lid',
      whyText: 'Opening the box collapses the wave to 1 real state!',
    };
  }

  if (exp === 'double_slit') {
    if (holdingKind === 'probe') {
      return {
        visible: true,
        target: 'slit_a',
        stepTag: 'STEP 1/2',
        ctaText: 'Hold Probe near Slit A to watch fringes collapse!',
        accentHex: '#fbbf24',
        controlHint: 'RELEASE NEAR SLIT A',
        whyText: 'Spying which slit a photon uses kills waves!',
      };
    }
    if (!state.whichPathDetector && !state.roomscaleWave) {
      return {
        visible: true,
        target: 'probe',
        stepTag: 'STEP 1/2',
        ctaText: 'Drag Which-Path Probe to Slit A (or tap Probe)',
        accentHex: '#22d3ee',
        controlHint: 'TRIGGER Click or DRAG Probe',
        whyText: 'Try peeking at Slit A — interference vanishes!',
      };
    }
    if (!state.roomscaleWave) {
      return {
        visible: true,
        target: 'roomscale',
        stepTag: 'STEP 2/2',
        ctaText: 'Fringes Collapsed! Tap Roomscale ON & Throw Photon!',
        accentHex: '#34d399',
        controlHint: 'TRIGGER Room ON Button',
        whyText: 'Step inside living-room 3D light waves!',
      };
    }
    return {
      visible: true,
      target: 'probe',
      stepTag: 'LIVE WAVE FIELD',
      ctaText: 'Walk through the 3D wave or Throw Photons!',
      accentHex: '#34d399',
      controlHint: 'TRIGGER Probe / Throw',
      whyText: 'Dots act like particles, patterns follow waves!',
    };
  }

  // Entanglement
  if (state.chshWitnessS !== null) {
    return {
      visible: true,
      target: 'dials',
      stepTag: 'PROVEN',
      ctaText: `Quantum Win! CHSH S = ${state.chshWitnessS.toFixed(2)} > 2.00`,
      accentHex: '#34d399',
      controlHint: 'TRIGGER Dials / Reset',
      whyText: 'Score S > 2 proves real quantum non-locality!',
    };
  }
  const doneCount = Object.keys(state.chshCells).length;
  return {
    visible: true,
    target: 'dials',
    stepTag: `STEP ${Math.min(4, doneCount + 1)}/4`,
    ctaText: `Rotate Alice/Bob Dials or tap CHSH Test (${doneCount}/4)`,
    accentHex: '#a78bfa',
    controlHint: 'TRIGGER Click / TURN Dial',
    whyText: 'Compare angles to beat classical physics limit 2.0!',
  };
}

export function wavelengthColorHex(nm: WavelengthNm): string {
  switch (nm) {
    case 430:
      return '#4dc8ff';
    case 532:
      return '#2ef299';
    case 650:
      return '#ff4d6d';
  }
}

/**
 * Computes normalized relative detection probability P(x) in [0, 1] across screen coordinate xNorm in [-1, 1].
 * Combines single-slit diffraction envelope with either coherent two-path interference or incoherent sum.
 */
export function evaluateDoubleSlitProbability(
  xNorm: number,
  config: DoubleSlitConfig,
): number {
  const x = Math.max(-1, Math.min(1, xNorm));
  const distScale = config.screenDistanceScale ?? 1.0;
  const lambdaScale = (config.wavelengthNm / 532) * distScale;
  // Single-slit envelope width scales with wavelength
  const beta = (2.35 * x) / lambdaScale;
  const sinc = Math.abs(beta) < 1e-4 ? 1 : Math.sin(beta) / beta;
  const envelope = sinc * sinc;

  if (config.slitMode === 'single') {
    const offset = 0.08;
    const dx = x - offset;
    const singleBeta = (2.15 * dx) / lambdaScale;
    const singleSinc =
      Math.abs(singleBeta) < 1e-4 ? 1 : Math.sin(singleBeta) / singleBeta;
    return Math.max(0.005, singleSinc * singleSinc * Math.exp(-0.9 * dx * dx));
  }

  if (config.whichPathDetector) {
    // Which-path observation collapses phase coherence -> incoherent sum of two slightly offset Gaussians/sinc bands
    const sepShift = 0.075 + config.slitSeparationMm * 0.14;
    const left = Math.exp(-((x + sepShift) * (x + sepShift)) / (0.14 * lambdaScale));
    const right = Math.exp(-((x - sepShift) * (x - sepShift)) / (0.14 * lambdaScale));
    return Math.max(0.005, envelope * (0.48 * left + 0.48 * right + 0.18 * Math.exp(-x * x * 1.4)));
  }

  // Coherent superposition: I(x) = envelope * cos^2(pi * d * x / lambda_eff)
  const fringeCycles = (3.9 * config.slitSeparationMm) / lambdaScale;
  const phase = Math.PI * fringeCycles * x;
  const interference = Math.cos(phase) * Math.cos(phase);
  // Subtle baseline (0.03) models realistic imperfect detector resolution
  return Math.max(0.002, envelope * (0.03 + 0.97 * interference));
}

export function computeTheoreticalVisibility(config: DoubleSlitConfig): number {
  if (config.slitMode === 'single' || config.whichPathDetector) {
    return 0;
  }
  return 0.94;
}

export function estimateHistogramFringeContrast(histogram: readonly number[]): number {
  const total = histogram.reduce((acc, n) => acc + n, 0);
  if (total < 16) return 0;
  const mid = Math.floor(histogram.length / 2);
  const centralSlice = histogram.slice(Math.max(0, mid - 12), Math.min(histogram.length, mid + 13));
  const peak = Math.max(...centralSlice);
  const valley = Math.min(...centralSlice);
  if (peak + valley <= 0) return 0;
  return Number(((peak - valley) / (peak + valley)).toFixed(2));
}

/**
 * Samples one photon detection event on the phosphor screen using rejection sampling against P(x).
 */
export function sampleDoubleSlitHit(
  config: DoubleSlitConfig,
  rng: () => number = Math.random,
): ScreenHit {
  let xNorm = 0;
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const candidate = rng() * 2 - 1;
    const p = evaluateDoubleSlitProbability(candidate, config);
    if (rng() <= p) {
      xNorm = candidate;
      break;
    }
  }
  const u1 = Math.max(1e-5, rng());
  const u2 = rng();
  const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const yNorm = Math.max(-0.92, Math.min(0.92, gaussian * 0.28));

  return {
    xNorm,
    yNorm,
    wavelengthNm: config.wavelengthNm,
  };
}

/**
 * Bell state |Phi+> = (|00> + |11>) / sqrt(2):
 * Same-outcome probability P(A=B) = cos^2(theta_A - theta_B),
 * Correlation expectation E(theta_A, theta_B) = cos(2 * (theta_A - theta_B)).
 */
export function computeBellCorrelation(
  aliceAngleDeg: number,
  bobAngleDeg: number,
): number {
  const deltaRad = ((aliceAngleDeg - bobAngleDeg) * Math.PI) / 180;
  return Number(Math.cos(2 * deltaRad).toFixed(3));
}

export function sampleEntangledPair(
  aliceAngleDeg: number,
  bobAngleDeg: number,
  rng: () => number = Math.random,
): { outcomeA: 1 | -1; outcomeB: 1 | -1 } {
  const deltaRad = ((aliceAngleDeg - bobAngleDeg) * Math.PI) / 180;
  const probSame = Math.cos(deltaRad) * Math.cos(deltaRad);
  const outcomeA: 1 | -1 = rng() < 0.5 ? 1 : -1;
  const same = rng() < probSame;
  const outcomeB: 1 | -1 = same ? outcomeA : (outcomeA === 1 ? -1 : 1);
  return { outcomeA, outcomeB };
}

export function chshKey(aliceDeg: number, bobDeg: number): string {
  return `${aliceDeg}:${bobDeg}`;
}

export function computeChshWitness(
  chshCells: Record<string, ChshCell>,
): number | null {
  const c00 = chshCells[chshKey(0, 22.5)];
  const c01 = chshCells[chshKey(0, 67.5)];
  const c10 = chshCells[chshKey(45, 22.5)];
  const c11 = chshCells[chshKey(45, 67.5)];
  if (!c00 || !c01 || !c10 || !c11) return null;
  if (
    c00.pairCount < 4 ||
    c01.pairCount < 4 ||
    c10.pairCount < 4 ||
    c11.pairCount < 4
  ) {
    return null;
  }
  const sVal = Math.abs(
    c00.correlation - c01.correlation + c10.correlation + c11.correlation,
  );
  return Number(sVal.toFixed(2));
}

/**
 * Simulates one single photon fired into the Elitzur-Vaidman Mach-Zehnder bomb tester.
 * - With BS2 installed & zero extra phase:
 *   - Dummy/empty test arm => 100% Safe Port D1, 0% Dark Port D0.
 *   - Live photon bomb in test slot => 50% BOOM, 25% Safe Port D1, 25% Dark Port D0 (interaction-free detection!).
 * - With phasePiEnabled (when BS2 is installed & no bomb): swaps D1 <-> D0.
 * - With BS2 removed: no recombination interference (50% upper arm -> bomb or D0/D1, 50% lower arm -> D0/D1).
 */
export function fireBombInterferometerPhoton(
  state: QuantumLabState,
  rng: () => number = Math.random,
): BombOutcome {
  const puzzle = state.bombPuzzle;
  puzzle.probesFired += 1;
  if (puzzle.slotCrate !== null) {
    puzzle.crateProbesFired += 1;
  }
  puzzle.lastBeamSeq += 1;

  const hasBombInSlot =
    puzzle.slotCrate !== null && puzzle.slotCrate === puzzle.bombCrate;

  // Deterministic false-D0 diagnostic when shooting an empty track with miscalibrated optics in Case 3
  if (puzzle.slotCrate === null && (!puzzle.bs2Installed || puzzle.phasePiEnabled)) {
    puzzle.emptyCalibrated = false;
    puzzle.darkHits += 1;
    puzzle.lastOutcome = 'dark_d0';
    return 'dark_d0';
  }

  if (!puzzle.bs2Installed) {
    const tookUpperArm = rng() < 0.5;
    if (tookUpperArm) {
      if (hasBombInSlot) {
        puzzle.explosions += 1;
        puzzle.lastOutcome = 'exploded';
        state.streak = 0;
        return 'exploded';
      }
      puzzle.darkHits += 1;
      puzzle.lastOutcome = 'dark_d0';
      return 'dark_d0';
    }
    puzzle.safeHits += 1;
    puzzle.lastOutcome = 'safe_d1';
    return 'safe_d1';
  }

  if (hasBombInSlot) {
    const r = rng();
    if (r < 0.5) {
      puzzle.explosions += 1;
      puzzle.lastOutcome = 'exploded';
      state.streak = 0;
      return 'exploded';
    }
    if (r < 0.75) {
      puzzle.darkHits += 1;
      puzzle.lastOutcome = 'dark_d0';
      return 'dark_d0';
    }
    puzzle.safeHits += 1;
    puzzle.lastOutcome = 'safe_d1';
    return 'safe_d1';
  }

  if (puzzle.phasePiEnabled) {
    puzzle.darkHits += 1;
    puzzle.lastOutcome = 'dark_d0';
    return 'dark_d0';
  }

  if (puzzle.slotCrate === null) {
    puzzle.emptyCalibrated = true;
  }
  puzzle.safeHits += 1;
  puzzle.lastOutcome = 'safe_d1';
  return 'safe_d1';
}

export function defuseCrateChoice(
  state: QuantumLabState,
  guessCrate: BombCrateId,
): boolean {
  const puzzle = state.bombPuzzle;
  if (guessCrate === puzzle.bombCrate) {
    puzzle.defusedCount += 1;
    puzzle.lastOutcome = 'defused';
    state.streak += 1;
    state.score += 150 + (state.streak - 1) * 50;
    return true;
  }
  puzzle.explosions += 1;
  puzzle.lastOutcome = 'wrong_guess';
  state.streak = 0;
  state.score = Math.max(0, state.score - 50);
  return false;
}

export function quarantineCrateChoice(state: QuantumLabState): boolean {
  const puzzle = state.bombPuzzle;
  if (!puzzle.slotCrate) return false;
  puzzle.quarantinedCount += 1;
  puzzle.lastOutcome = 'quarantined';
  const hitBomb = puzzle.slotCrate === puzzle.bombCrate;
  if (hitBomb) {
    state.streak += 1;
    state.score += 90;
  } else {
    state.score += 45;
  }
  return hitBomb;
}

export function startNextBombRound(
  state: QuantumLabState,
  rng: () => number = Math.random,
  forcedBomb?: BombCrateId,
): void {
  const puzzle = state.bombPuzzle;
  puzzle.round += 1;
  puzzle.training = false;
  puzzle.caseKind = puzzle.round >= 2 && puzzle.round % 2 === 0 ? 'optics_drift' : 'budget';
  puzzle.bombCrate = forcedBomb ?? (rng() < 0.5 ? 'alpha' : 'beta');
  puzzle.slotCrate = null;
  puzzle.maxProbes = 3;
  if (puzzle.caseKind === 'optics_drift') {
    puzzle.bs2Installed = false;
    puzzle.phasePiEnabled = puzzle.round >= 4;
    puzzle.emptyCalibrated = false;
  } else {
    puzzle.bs2Installed = true;
    puzzle.phasePiEnabled = false;
    puzzle.emptyCalibrated = true;
  }
  puzzle.probesFired = 0;
  puzzle.crateProbesFired = 0;
  puzzle.darkHits = 0;
  puzzle.safeHits = 0;
  puzzle.lastOutcome = 'idle';
}

export function measureTetherPair(
  state: QuantumLabState,
  rng: () => number = Math.random,
): { leftSpin: 1 | -1; rightSpin: 1 | -1 } {
  const t = state.tether;
  const leftSpin: 1 | -1 = rng() < 0.5 ? 1 : -1;
  const rightSpin: 1 | -1 =
    t.mode === 'correlated' ? leftSpin : leftSpin === 1 ? -1 : 1;
  t.leftSpin = leftSpin;
  t.rightSpin = rightSpin;
  t.collapses += 1;
  t.pulseSeq += 1;
  const target = t.targetDistanceM ?? 0.9;
  if (t.distanceM >= target) {
    t.challengesCompleted = (t.challengesCompleted ?? 0) + 1;
    t.targetDistanceM = Math.min(2.0, Number((target + 0.45).toFixed(2)));
    state.score += 75;
  } else {
    state.score += 15;
  }
  return { leftSpin, rightSpin };
}

const INV_SQRT2 = Math.SQRT1_2;

export function applyQuantumGate(
  state: QuantumLabState,
  gate: QuantumGateType,
): void {
  const s = state.schrodinger;
  // Applying a new gate prepares a fresh closed state if box was previously observed
  if (!s.boxClosed) {
    s.boxClosed = true;
    s.observedState = null;
  }

  let nextAlpha = s.alpha;
  let nextBeta = s.beta;
  if (gate === 'H') {
    nextAlpha = (s.alpha + s.beta) * INV_SQRT2;
    nextBeta = (s.alpha - s.beta) * INV_SQRT2;
  } else if (gate === 'X') {
    nextAlpha = s.beta;
    nextBeta = s.alpha;
  } else {
    nextAlpha = s.alpha;
    nextBeta = -s.beta;
  }

  const norm = Math.hypot(nextAlpha, nextBeta) || 1;
  nextAlpha /= norm;
  nextBeta /= norm;
  s.alpha = Math.abs(nextAlpha) < 1e-9 ? 0 : nextAlpha;
  s.beta = Math.abs(nextBeta) < 1e-9 ? 0 : nextBeta;
  s.appliedGates.push(gate);
  if (s.appliedGates.length > 8) {
    s.appliedGates.shift();
  }
}

export function observeSchrodingerBox(
  state: QuantumLabState,
  rng: () => number = Math.random,
): SchrodingerOutcome {
  const s = state.schrodinger;
  const wonMission = isSchrodingerMissionReady(s);
  const probAwake = Math.max(0, Math.min(1, s.alpha * s.alpha));
  const outcome: SchrodingerOutcome = rng() < probAwake ? 'awake' : 'asleep';
  s.boxClosed = false;
  s.observedState = outcome;
  s.collapseCount += 1;
  s.lastMissionWon = wonMission;
  if (wonMission) {
    s.missionsSolved = (s.missionsSolved ?? 0) + 1;
    s.missionIndex = ((s.missionIndex ?? 0) + 1) % 3;
    state.score += 100;
  } else {
    state.score += s.appliedGates.length >= 2 ? 40 : 20;
  }
  return outcome;
}

export function resetSchrodingerBox(
  state: QuantumLabState,
  superposition = true,
): void {
  const s = state.schrodinger;
  s.boxClosed = true;
  s.observedState = null;
  s.lastMissionWon = false;
  if (superposition) {
    // Start Mission 1 (Asleep) or 3 (Minus) cleanly in |0> -> H superposition; Mission 2 (Awake) also starts in H!
    s.alpha = INV_SQRT2;
    s.beta = INV_SQRT2;
    s.appliedGates = ['H'];
  } else {
    s.alpha = 1;
    s.beta = 0;
    s.appliedGates = [];
  }
}

export function createInitialQuantumLabState(
  rng: () => number = Math.random,
  initialBombCrate?: BombCrateId,
): QuantumLabState {
  const state: QuantumLabState = {
    experiment: 'bomb_puzzle',
    autoStream: true,
    score: 0,
    streak: 0,
    roomscaleWave: false,
    thrownPhotonsCount: 0,
    bombPuzzle: {
      training: false,
      caseKind: 'budget',
      round: 1,
      slotCrate: null,
      bombCrate: initialBombCrate ?? (rng() < 0.5 ? 'alpha' : 'beta'),
      bs2Installed: true,
      phasePiEnabled: false,
      emptyCalibrated: true,
      maxProbes: 3,
      probesFired: 0,
      crateProbesFired: 0,
      darkHits: 0,
      safeHits: 0,
      explosions: 0,
      defusedCount: 0,
      quarantinedCount: 0,
      lastOutcome: 'idle',
      lastBeamSeq: 0,
    },
    tether: {
      mode: 'correlated',
      leftSpin: null,
      rightSpin: null,
      distanceM: 0.34,
      maxDistanceM: 0.34,
      targetDistanceM: 0.9,
      challengesCompleted: 0,
      collapses: 0,
      pulseSeq: 0,
    },
    schrodinger: {
      boxClosed: true,
      alpha: INV_SQRT2,
      beta: INV_SQRT2,
      appliedGates: ['H'],
      observedState: null,
      collapseCount: 0,
      missionIndex: 0,
      missionsSolved: 0,
      lastMissionWon: false,
    },
    wavelengthNm: 532,
    slitSeparationMm: 0.48,
    screenDistanceScale: 1.0,
    slitMode: 'both',
    whichPathDetector: false,
    totalHits: 0,
    histogram: new Array(SCREEN_HISTOGRAM_BINS).fill(0),
    recentHits: [],
    theoreticalVisibility: 0.94,
    measuredFringeContrast: 0,
    aliceAngleDeg: 0,
    bobAngleDeg: 22.5,
    pairCount: 0,
    sameOutcomeCount: 0,
    oppositeOutcomeCount: 0,
    lastOutcomeA: null,
    lastOutcomeB: null,
    theoreticalCorrelation: computeBellCorrelation(0, 22.5),
    measuredCorrelation: 0,
    chshCells: {},
    chshWitnessS: null,
    questStep: 1,
    tutorHeadline: 'Bomb Puzzle: Interaction-Free Quantum Proof',
    tutorBody:
      'Place Crate Alpha or Beta in the Test Slot, then fire single photons. A Dark Port D0 flash proves the bomb without hitting it!',
    tutorSource: 'local-physics',
  };
  return state;
}

export function recordDoubleSlitBurst(
  state: QuantumLabState,
  count: number,
  rng: () => number = Math.random,
): void {
  const safeCount = Math.max(1, Math.min(200, Math.round(count)));
  for (let i = 0; i < safeCount; i += 1) {
    const hit = sampleDoubleSlitHit(state, rng);
    state.totalHits += 1;
    const bin = Math.min(
      SCREEN_HISTOGRAM_BINS - 1,
      Math.max(0, Math.floor(((hit.xNorm + 1) * 0.5) * SCREEN_HISTOGRAM_BINS)),
    );
    state.histogram[bin] += 1;
    state.recentHits.push(hit);
    if (state.recentHits.length > MAX_RENDERED_HITS) {
      state.recentHits.shift();
    }
  }
  state.theoreticalVisibility = computeTheoreticalVisibility(state);
  state.measuredFringeContrast = estimateHistogramFringeContrast(state.histogram);
}

export function clearScreenAccumulation(state: QuantumLabState): void {
  state.totalHits = 0;
  state.histogram.fill(0);
  state.recentHits = [];
  state.measuredFringeContrast = 0;
  state.theoreticalVisibility = computeTheoreticalVisibility(state);
}

export function recordEntangledBurst(
  state: QuantumLabState,
  count: number,
  rng: () => number = Math.random,
): { outcomeA: 1 | -1; outcomeB: 1 | -1 } {
  const safeCount = Math.max(1, Math.min(200, Math.round(count)));
  let lastA: 1 | -1 = 1;
  let lastB: 1 | -1 = 1;
  for (let i = 0; i < safeCount; i += 1) {
    const { outcomeA, outcomeB } = sampleEntangledPair(
      state.aliceAngleDeg,
      state.bobAngleDeg,
      rng,
    );
    lastA = outcomeA;
    lastB = outcomeB;
    state.pairCount += 1;
    if (outcomeA === outcomeB) {
      state.sameOutcomeCount += 1;
    } else {
      state.oppositeOutcomeCount += 1;
    }
  }
  state.lastOutcomeA = lastA;
  state.lastOutcomeB = lastB;
  state.theoreticalCorrelation = computeBellCorrelation(
    state.aliceAngleDeg,
    state.bobAngleDeg,
  );
  state.measuredCorrelation =
    state.pairCount > 0
      ? Number(
          (
            (state.sameOutcomeCount - state.oppositeOutcomeCount) /
            state.pairCount
          ).toFixed(3),
        )
      : 0;

  const key = chshKey(state.aliceAngleDeg, state.bobAngleDeg);
  const isCanonical = CHSH_CANONICAL_PAIRS.some(
    ([a, b]) => a === state.aliceAngleDeg && b === state.bobAngleDeg,
  );
  if (isCanonical) {
    state.chshCells[key] = {
      pairCount: state.pairCount,
      sameCount: state.sameOutcomeCount,
      oppositeCount: state.oppositeOutcomeCount,
      correlation: state.measuredCorrelation,
    };
    state.chshWitnessS = computeChshWitness(state.chshCells);
  }
  return { outcomeA: lastA, outcomeB: lastB };
}

export function clearEntanglementStats(state: QuantumLabState): void {
  state.pairCount = 0;
  state.sameOutcomeCount = 0;
  state.oppositeOutcomeCount = 0;
  state.lastOutcomeA = null;
  state.lastOutcomeB = null;
  state.measuredCorrelation = 0;
  state.theoreticalCorrelation = computeBellCorrelation(
    state.aliceAngleDeg,
    state.bobAngleDeg,
  );
}

export function createSnapshot(state: QuantumLabState): QuantumLabSnapshot {
  const sch = state.schrodinger;
  const probAwake = Number((sch.alpha * sch.alpha).toFixed(3));
  const probAsleep = Number((sch.beta * sch.beta).toFixed(3));
  const phaseSign: 1 | -1 = sch.alpha * sch.beta < -1e-6 ? -1 : 1;
  return {
    experiment: state.experiment,
    score: state.score,
    streak: state.streak,
    roomscaleWave: state.roomscaleWave,
    bombRound: state.bombPuzzle.round,
    bombSlotCrate: state.bombPuzzle.slotCrate,
    bombBs2Installed: state.bombPuzzle.bs2Installed,
    bombPhasePiEnabled: state.bombPuzzle.phasePiEnabled,
    bombProbesFired: state.bombPuzzle.probesFired,
    bombDarkHits: state.bombPuzzle.darkHits,
    bombSafeHits: state.bombPuzzle.safeHits,
    bombDefusedCount: state.bombPuzzle.defusedCount,
    bombLastOutcome: state.bombPuzzle.lastOutcome,
    tetherMode: state.tether.mode,
    tetherDistanceM: Number(state.tether.distanceM.toFixed(2)),
    tetherLeftSpin: state.tether.leftSpin,
    tetherRightSpin: state.tether.rightSpin,
    tetherCollapses: state.tether.collapses,
    schrodingerClosed: sch.boxClosed,
    schrodingerProbAwake: probAwake,
    schrodingerProbAsleep: probAsleep,
    schrodingerPhaseSign: phaseSign,
    schrodingerGates: sch.appliedGates.join(' -> ') || 'None',
    schrodingerObserved: sch.observedState,
    wavelengthNm: state.wavelengthNm,
    slitSeparationMm: state.slitSeparationMm,
    screenDistanceScale: state.screenDistanceScale ?? 1.0,
    slitMode: state.slitMode,
    whichPathDetector: state.whichPathDetector,
    totalHits: state.totalHits,
    theoreticalVisibility: state.theoreticalVisibility,
    measuredFringeContrast: state.measuredFringeContrast,
    aliceAngleDeg: state.aliceAngleDeg,
    bobAngleDeg: state.bobAngleDeg,
    pairCount: state.pairCount,
    sameOutcomeCount: state.sameOutcomeCount,
    oppositeOutcomeCount: state.oppositeOutcomeCount,
    theoreticalCorrelation: state.theoreticalCorrelation,
    measuredCorrelation: state.measuredCorrelation,
    chshWitnessS: state.chshWitnessS,
    questStep: state.questStep,
    lastOutcomeA: state.lastOutcomeA,
    lastOutcomeB: state.lastOutcomeB,
  };
}

/**
 * Generates an accurate physics explanation grounded in the live optical bench parameters.
 */
export function buildLocalTutorResponse(
  question: string,
  snap: QuantumLabSnapshot,
): { headline: string; answer: string } {
  const q = question.toLowerCase();

  if (
    q.includes('vanish') ||
    q.includes('which-path') ||
    q.includes('detector') ||
    (snap.experiment === 'double_slit' && (q.includes('collapse') || snap.whichPathDetector))
  ) {
    if (snap.whichPathDetector) {
      return {
        headline: 'Which-Path Info Erased Interference',
        answer:
          'Because the Which-Path Probe reveals which slit each photon took, the two probability paths become distinguishable and no longer add coherently: ' +
          '|psi_1|^2 + |psi_2|^2 replaces |psi_1 + psi_2|^2, collapsing visibility to 0%. Pull the probe away to restore fringes!',
      };
    }
    return {
      headline: 'Complementarity: Path vs Interference',
      answer:
        'Right now the Which-Path Detector is OFF, so both paths stay indistinguishable and amplitudes interfere constructively and destructively. ' +
        'Move the glowing probe close to Slit A (or click Which-Path: ON) to collapse the interference pattern immediately.',
    };
  }

  if (
    snap.experiment === 'bomb_puzzle' ||
    q.includes('bomb') ||
    q.includes('crate') ||
    q.includes('dark port') ||
    q.includes('elitzur')
  ) {
    if (snap.bombLastOutcome === 'dark_d0') {
      return {
        headline: 'Dark Port D0 Proof: Bomb Located!',
        answer:
          `Because Dark Port D0 fired (${snap.bombDarkHits}x) with BS2 installed and pi-phase off, destructive interference was broken in the upper arm. ` +
          'The bomb blocked one path without absorbing the photon, so defusing the slotted crate is 100% safe!',
      };
    }
    if (snap.bombLastOutcome === 'exploded') {
      return {
        headline: 'Photon Absorbed: Bomb Detonated',
        answer:
          'A live bomb absorbs 50% of upper-arm probe photons on contact, triggering detonation. That means 25% land safely in D1 and 25% prove the bomb silently in Dark Port D0.',
      };
    }
    return {
      headline: `Elitzur-Vaidman Tester (Round ${snap.bombRound})`,
      answer:
        'An empty glass dummy lets both Mach-Zehnder paths interfere: 100% exit Safe Port D1 and 0% hit D0 (when BS2 is ON and pi-phase OFF). ' +
        'A real bomb blocks one arm, spoiling cancellation and leaking 25% of photons into Dark Port D0 without touching the detonator.',
    };
  }

  if (
    snap.experiment === 'tether' ||
    q.includes('tether') ||
    q.includes('spooky') ||
    q.includes('orb')
  ) {
    const label = snap.tetherMode === 'correlated' ? '|Phi+> same-spin' : '|Psi-> anti-correlated';
    return {
      headline: `Quantum Tether: ${label} (${snap.tetherDistanceM.toFixed(2)} m)`,
      answer:
        `Even stretched ${snap.tetherDistanceM.toFixed(2)} m across your room, measuring either orb yields a random +/-1 spin while locking its partner instantly. ` +
        'No classical signal could arrive faster, yet no controllable message can be encoded in random local outcomes.',
    };
  }

  if (
    snap.experiment === 'schrodinger' ||
    q.includes('schrodinger') ||
    q.includes('box') ||
    q.includes('gate') ||
    q.includes('hadamard')
  ) {
    const awakePct = Math.round(snap.schrodingerProbAwake * 100);
    const asleepPct = Math.round(snap.schrodingerProbAsleep * 100);
    const ketSign = snap.schrodingerPhaseSign < 0 ? '-' : '+';
    return {
      headline: snap.schrodingerClosed
        ? `Superposition: ${awakePct}% Awake | ${asleepPct}% Asleep`
        : `Box Opened: Collapsed to ${snap.schrodingerObserved === 'awake' ? 'Awake |0>' : 'Asleep |1>'}`,
      answer:
        `Gates applied (${snap.schrodingerGates}) steer amplitudes to alpha|0> ${ketSign} beta|1>. ` +
        'Notice that H -> Z -> H converts relative phase into a full bit flip (100% Asleep |1>) before you lift the lid!',
    };
  }

  if (
    snap.experiment === 'entanglement' ||
    q.includes('entangl') ||
    q.includes('bell') ||
    q.includes('alice') ||
    q.includes('bob')
  ) {
    const delta = Math.abs(snap.aliceAngleDeg - snap.bobAngleDeg);
    const eTheory = snap.theoreticalCorrelation.toFixed(2);
    const pctSame = Math.round(Math.cos((delta * Math.PI) / 180) ** 2 * 100);
    if (q.includes('next') || q.includes('challenge') || q.includes('suggest')) {
      return {
        headline: 'Experiment Challenge: Bell Test Angles',
        answer:
          `Set Alice to 0 deg and Bob to 22.5 deg, then 67.5 deg. At 22.5 deg offset, |Phi+> agrees ${pctSame}% of the time (` +
          `E = ${eTheory}), stronger than classical hidden-variable bounds predict in CHSH tests!`,
      };
    }
    return {
      headline: `Entangled State |Phi+> (Delta = ${delta.toFixed(1)} deg)`,
      answer:
        `Each individual qubit outcome is 50/50 random, yet Alice (${snap.aliceAngleDeg} deg) and Bob (${snap.bobAngleDeg} deg) agree ` +
        `${pctSame}% of the time: E = cos(2*Delta) = ${eTheory}. ` +
        (snap.pairCount > 0
          ? `Over ${snap.pairCount} measured pairs you observed E = ${snap.measuredCorrelation.toFixed(2)}.`
          : 'Fire a pair burst to watch correlations converge without faster-than-light signaling.'),
    };
  }

  if (q.includes('wavelength') || q.includes('color') || q.includes('spacing') || q.includes('fringe') || q.includes('nm')) {
    return {
      headline: `Fringe Spacing at ${snap.wavelengthNm} nm`,
      answer:
        `By delta_y = lambda * L / d, longer wavelengths (650 nm red) spread interference fringes wider across the screen, while shorter wavelengths (430 nm blue) pack fringes tighter. ` +
        `Current separation is d = ${snap.slitSeparationMm.toFixed(2)} mm (${snap.slitMode === 'both' ? 'dual-slit active' : 'single-slit diffraction only'}).`,
    };
  }

  if (q.includes('next') || q.includes('challenge') || q.includes('suggest')) {
    return {
      headline: 'Try This Quantum Lab Sequence',
      answer:
        '1) Solve the Bomb Puzzle via Dark Port D0. 2) Pull the Quantum Tether apart & shake to collapse. 3) Run H -> Z -> H on Schrodinger Box, then turn Roomscale ON in Double-Slit!',
    };
  }

  return {
    headline:
      snap.slitMode === 'single'
        ? 'Single-Slit Wave Diffraction'
        : `Wave-Particle Duality (${snap.wavelengthNm} nm)`,
    answer:
      snap.slitMode === 'single'
        ? 'With only one slit open, light forms a single broad diffraction mound with no interference fringes. Open Both Slits to create path superposition.'
        : `Every dot hits the phosphor screen as a localized particle (${snap.totalHits} recorded), yet their distribution follows wave interference |psi_1 + psi_2|^2 with ${(snap.theoreticalVisibility * 100).toFixed(0)}% coherence visibility.`,
  };
}
