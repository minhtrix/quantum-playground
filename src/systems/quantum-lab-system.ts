import {
  Box3,
  BufferAttribute,
  CanvasTexture,
  Color,
  createSystem,
  Entity,
  Euler,
  Grabbed,
  Hovered,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  PlaneGeometry,
  Pressed,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  VisibilityState,
  XRPlane,
} from '@iwsdk/core';
import {
  AnalyzerDialMarker,
  BenchAnchorMarker,
  BombBs2Marker,
  BombCrateMarker,
  BombRigMarker,
  BoxLidMarker,
  DetectorProbeMarker,
  DoubleSlitRigMarker,
  EntanglementRigMarker,
  FilterCrystalMarker,
  GateCubeMarker,
  GuideArrowMarker,
  QuantumBenchMarker,
  RoomWaveFieldMarker,
  SchrodingerRigMarker,
  SlitShutterMarker,
  TetherOrbMarker,
  TetherRigMarker,
} from '../components.js';
import { DEFAULT_BENCH_Y, labController } from '../simulation/lab-controller.js';
import {
  ANALYZER_ANGLES,
  chshKey,
  computeOnboardingHint,
  evaluateDoubleSlitProbability,
  SCREEN_HISTOGRAM_BINS,
  wavelengthColorHex,
  type AnalyzerAngleDeg,
  type BombCrateId,
  type QuantumGateType,
  type WavelengthNm,
} from '../simulation/quantum-physics.js';

const STANDBY_PROBE_POS = new Vector3(-0.14, 0.888, -0.4);
const ACTIVE_PROBE_POS = new Vector3(-0.08, 0.905, -0.505);
const SLIT_A_SENSOR_POS = new Vector3(-0.08, 0.99, -0.54);
const LASER_APERTURE_POS = new Vector3(-0.28, 0.992, -0.56);

const BOMB_SLOT_POS = new Vector3(0.01, 0.88, -0.65);
const CRATE_ALPHA_HOME = new Vector3(-0.24, 0.88, -0.36);
const CRATE_BETA_HOME = new Vector3(0.24, 0.88, -0.36);
const BS2_IN_POS = new Vector3(0.21, 0.88, -0.65);
const BS2_OUT_POS = new Vector3(0.37, 0.88, -0.46);

const SCHRODINGER_DOCK_POS = new Vector3(0, 0.88, -0.395);
const GATE_H_HOME = new Vector3(-0.22, 0.88, -0.4);
const GATE_X_HOME = new Vector3(0.22, 0.88, -0.4);
const GATE_Z_HOME = new Vector3(0.32, 0.88, -0.4);

const UP_AXIS = new Vector3(0, 1, 0);

function snapAngleDeg(rawRad: number): AnalyzerAngleDeg {
  let deg = Math.abs((rawRad * 180) / Math.PI) % 180;
  if (deg > 90) deg = 180 - deg;
  let best = ANALYZER_ANGLES[0];
  let bestDiff = Infinity;
  for (const cand of ANALYZER_ANGLES) {
    const diff = Math.abs(cand - deg);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cand;
    }
  }
  return best;
}

export class QuantumLabSystem extends createSystem({
  hovered: { required: [Hovered] },
  bench: { required: [QuantumBenchMarker] },
  benchAnchor: { required: [BenchAnchorMarker] },
  benchAnchorHeld: { required: [BenchAnchorMarker, Grabbed] },
  doubleSlitRig: { required: [DoubleSlitRigMarker] },
  entanglementRig: { required: [EntanglementRigMarker] },
  bombRig: { required: [BombRigMarker] },
  bombRigPressed: { required: [BombRigMarker, Pressed] },
  crates: { required: [BombCrateMarker] },
  cratesHeld: { required: [BombCrateMarker, Grabbed] },
  cratesPressed: { required: [BombCrateMarker, Pressed] },
  bs2: { required: [BombBs2Marker] },
  bs2Held: { required: [BombBs2Marker, Grabbed] },
  bs2Pressed: { required: [BombBs2Marker, Pressed] },
  tetherRig: { required: [TetherRigMarker] },
  tetherOrbs: { required: [TetherOrbMarker] },
  tetherOrbsHeld: { required: [TetherOrbMarker, Grabbed] },
  tetherOrbsPressed: { required: [TetherOrbMarker, Pressed] },
  schrodingerRig: { required: [SchrodingerRigMarker] },
  boxLid: { required: [BoxLidMarker] },
  boxLidHeld: { required: [BoxLidMarker, Grabbed] },
  boxLidPressed: { required: [BoxLidMarker, Pressed] },
  gates: { required: [GateCubeMarker] },
  gatesHeld: { required: [GateCubeMarker, Grabbed] },
  gatesPressed: { required: [GateCubeMarker, Pressed] },
  roomWave: { required: [RoomWaveFieldMarker] },
  probe: { required: [DetectorProbeMarker] },
  probeHeld: { required: [DetectorProbeMarker, Grabbed] },
  probePressed: { required: [DetectorProbeMarker, Pressed] },
  shutter: { required: [SlitShutterMarker] },
  shutterHeld: { required: [SlitShutterMarker, Grabbed] },
  shutterPressed: { required: [SlitShutterMarker, Pressed] },
  filters: { required: [FilterCrystalMarker] },
  filtersHeld: { required: [FilterCrystalMarker, Grabbed] },
  filtersPressed: { required: [FilterCrystalMarker, Pressed] },
  dials: { required: [AnalyzerDialMarker] },
  dialsHeld: { required: [AnalyzerDialMarker, Grabbed] },
  dialsPressed: { required: [AnalyzerDialMarker, Pressed] },
  guideArrow: { required: [GuideArrowMarker] },
  xrPlanes: { required: [XRPlane] },
}) {
  // Cached references (zero allocations inside update)
  private phosphorCanvas!: HTMLCanvasElement;
  private phosphorCtx!: CanvasRenderingContext2D;
  private phosphorTexture!: CanvasTexture;

  private bellCanvas!: HTMLCanvasElement;
  private bellCtx!: CanvasRenderingContext2D;
  private bellTexture!: CanvasTexture;

  // Floating 3D in-world Arrow Tooltip ("What to press & do?") & Event Popup ("What happened & Why?")
  private guideTooltipCanvas!: HTMLCanvasElement;
  private guideTooltipCtx!: CanvasRenderingContext2D;
  private guideTooltipTexture!: CanvasTexture;
  private guideTooltipMat!: MeshStandardMaterial;
  private guideTooltipMesh!: Mesh;

  private eventPopupCanvas!: HTMLCanvasElement;
  private eventPopupCtx!: CanvasRenderingContext2D;
  private eventPopupTexture!: CanvasTexture;
  private eventPopupMat!: MeshStandardMaterial;
  private eventPopupMesh!: Mesh;
  private lastEventSeq = -1;
  private eventPopupAge = 1;

  private laserLensMat: MeshStandardMaterial | null = null;
  private laserBeamMat: MeshStandardMaterial | null = null;
  private screenGroup: Object3D | null = null;
  private waveArcMats: MeshStandardMaterial[] = [];
  private waveArcs: Object3D[] = [];
  private slitCollar: Object3D | null = null;
  private slitCollarMat: MeshStandardMaterial | null = null;

  private probeTipMat: MeshStandardMaterial | null = null;
  private probeBeaconMat: MeshStandardMaterial | null = null;

  private aliceLampMat: MeshStandardMaterial | null = null;
  private bobLampMat: MeshStandardMaterial | null = null;
  private pulseAlice: Object3D | null = null;
  private pulseBob: Object3D | null = null;
  private eprCrystal: Object3D | null = null;

  // Bomb Rig refs
  private bombD0LampMat: MeshStandardMaterial | null = null;
  private bombD1LampMat: MeshStandardMaterial | null = null;
  private bombSocketRingMat: MeshStandardMaterial | null = null;
  private bombBs2SocketRingMat: MeshStandardMaterial | null = null;
  private bombPhaseMat: MeshStandardMaterial | null = null;
  private bombShockRing: Object3D | null = null;
  private bombShockMat: MeshStandardMaterial | null = null;
  private bombTravelPhoton: Object3D | null = null;

  // Tether Rig & Orb refs
  private tetherBeamMesh: Object3D | null = null;
  private tetherBeamMat: MeshStandardMaterial | null = null;
  private tetherPulseMesh: Object3D | null = null;
  private tetherLeftCoreMat: MeshStandardMaterial | null = null;
  private tetherRightCoreMat: MeshStandardMaterial | null = null;

  // Schrodinger Rig refs
  private awakeOrb: Object3D | null = null;
  private awakeMat: MeshStandardMaterial | null = null;
  private asleepOrb: Object3D | null = null;
  private asleepMat: MeshStandardMaterial | null = null;
  private gateDockRingMat: MeshStandardMaterial | null = null;

  // Roomscale Wave & Thrown Photons
  private roomWavePosAttr: BufferAttribute | null = null;
  private roomWaveMat: MeshStandardMaterial | null = null;
  private thrownPhotonPool: Mesh[] = [];
  private thrownPhotonMats: MeshStandardMaterial[] = [];
  private thrownPhotonProgress: number[] = [];
  private lastThrowSeq = 0;

  private guideArrowConeMat: MeshStandardMaterial | null = null;
  private guideArrowHaloMat: MeshStandardMaterial | null = null;
  private guideArrowHalo: Object3D | null = null;
  private crateBarMats: MeshStandardMaterial[] = [];
  private gateBarMats: MeshStandardMaterial[] = [];
  private lidHandleMat: MeshStandardMaterial | null = null;
  private dialBarMats: MeshStandardMaterial[] = [];

  private rigsBound = false;
  private probeBound = false;
  private extraRigsBound = false;
  private guideBound = false;
  private tableAutoSnapped = false;
  private onboarding = computeOnboardingHint(labController.state);
  private readonly releasedCratePosition = new Vector3();
  private lastScreenRev = -1;
  private lastVisibilityKey = '';
  private lastBenchX = 0;
  private lastTableY = DEFAULT_BENCH_Y;
  private lastBenchZ = 0;
  private lastLayoutScaleX = 1.0;
  private gateSnapCooldown = 0;
  private tetherShakeCooldown = 0;
  private prevTetherDistDelta = 0;
  private lastTetherNudgeSeq = 0;
  private readonly lastTouchAt = new Map<string, number>();

  private prevExplosions = 0;
  private prevDefused = 0;
  private prevQuarantined = 0;
  private prevDarkHits = 0;
  private prevSchMissions = 0;
  private prevTetherChallenges = 0;

  private readonly particleMeshes: Mesh[] = [];
  private readonly particleMats: MeshStandardMaterial[] = [];
  private readonly particleVel: Vector3[] = [];
  private readonly particleAge: number[] = [];
  private readonly particleMaxAge: number[] = [];

  private readonly tmpVec = new Vector3();
  private readonly tmpVecB = new Vector3();
  private readonly tmpDir = new Vector3();
  private readonly tmpTarget = new Vector3();
  private readonly tableBox = new Box3();
  private readonly tableSize = new Vector3();
  private readonly prevLeftPos = new Vector3(-0.18, 0.99, -0.48);
  private readonly prevRightPos = new Vector3(0.18, 0.99, -0.48);
  private readonly tmpColor = new Color();
  private readonly tmpEuler = new Euler(0, 0, 0, 'XYZ');
  private readonly tmpQuat = new Quaternion();

  init(): void {
    this.phosphorCanvas = document.createElement('canvas');
    this.phosphorCanvas.width = 512;
    this.phosphorCanvas.height = 288;
    const pCtx = this.phosphorCanvas.getContext('2d');
    if (!pCtx) {
      throw new Error('Could not acquire 2D context for PhosphorScreen');
    }
    this.phosphorCtx = pCtx;
    this.phosphorTexture = new CanvasTexture(this.phosphorCanvas);
    this.phosphorTexture.colorSpace = SRGBColorSpace;

    this.bellCanvas = document.createElement('canvas');
    this.bellCanvas.width = 512;
    this.bellCanvas.height = 192;
    const bCtx = this.bellCanvas.getContext('2d');
    if (!bCtx) {
      throw new Error('Could not acquire 2D context for BellTelemetryScreen');
    }
    this.bellCtx = bCtx;
    this.bellTexture = new CanvasTexture(this.bellCanvas);
    this.bellTexture.colorSpace = SRGBColorSpace;

    // Pre-allocate 3D floating Arrow Tooltip ("What to do & controller hint")
    this.guideTooltipCanvas = document.createElement('canvas');
    this.guideTooltipCanvas.width = 560;
    this.guideTooltipCanvas.height = 216;
    this.guideTooltipCtx = this.guideTooltipCanvas.getContext('2d')!;
    this.guideTooltipTexture = new CanvasTexture(this.guideTooltipCanvas);
    this.guideTooltipTexture.colorSpace = SRGBColorSpace;
    this.guideTooltipMat = new MeshStandardMaterial({
      color: '#000000',
      emissiveMap: this.guideTooltipTexture,
      emissive: '#ffffff',
      emissiveIntensity: 0.98,
      transparent: true,
      opacity: 0.96,
      roughness: 0.4,
      side: 2,
    });
    const tooltipGeo = new PlaneGeometry(0.32, 0.123);
    this.guideTooltipMesh = new Mesh(tooltipGeo, this.guideTooltipMat);
    this.guideTooltipMesh.name = 'GuideArrowTooltipCard';
    this.guideTooltipMesh.visible = false;
    this.world.scene.add(this.guideTooltipMesh);

    // Pre-allocate 3D floating Event Popup ("What happened & Why?")
    this.eventPopupCanvas = document.createElement('canvas');
    this.eventPopupCanvas.width = 560;
    this.eventPopupCanvas.height = 216;
    this.eventPopupCtx = this.eventPopupCanvas.getContext('2d')!;
    this.eventPopupTexture = new CanvasTexture(this.eventPopupCanvas);
    this.eventPopupTexture.colorSpace = SRGBColorSpace;
    this.eventPopupMat = new MeshStandardMaterial({
      color: '#000000',
      emissiveMap: this.eventPopupTexture,
      emissive: '#ffffff',
      emissiveIntensity: 0.98,
      transparent: true,
      opacity: 0.96,
      roughness: 0.4,
      side: 2,
    });
    const popupGeo = new PlaneGeometry(0.42, 0.162);
    this.eventPopupMesh = new Mesh(popupGeo, this.eventPopupMat);
    this.eventPopupMesh.name = 'EventWhyPopupCard';
    this.eventPopupMesh.visible = false;
    this.world.scene.add(this.eventPopupMesh);

    // Pre-allocate 4 throwable photon spheres in scene root (zero runtime allocation)
    const photonGeo = new SphereGeometry(0.017, 12, 10);
    for (let i = 0; i < 4; i += 1) {
      const mat = new MeshStandardMaterial({
        color: '#2ef299',
        emissive: '#2ef299',
        emissiveIntensity: 2.0,
      });
      const mesh = new Mesh(photonGeo, mat);
      mesh.name = `ThrownPhotonProjectile_${i}`;
      mesh.visible = false;
      this.world.scene.add(mesh);
      this.thrownPhotonPool.push(mesh);
      this.thrownPhotonMats.push(mat);
      this.thrownPhotonProgress.push(1);
    }

    // Pre-allocate 24 particle sparks/sparkles (zero runtime allocation)
    const particleGeo = new OctahedronGeometry(0.016, 0);
    for (let i = 0; i < 24; i += 1) {
      const pMat = new MeshStandardMaterial({
        color: '#fbbf24',
        emissive: '#fbbf24',
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 1,
      });
      const pMesh = new Mesh(particleGeo, pMat);
      pMesh.name = `LabBurstParticle_${i}`;
      pMesh.visible = false;
      this.world.scene.add(pMesh);
      this.particleMeshes.push(pMesh);
      this.particleMats.push(pMat);
      this.particleVel.push(new Vector3());
      this.particleAge.push(1);
      this.particleMaxAge.push(1);
    }

    this.cleanupFuncs.push(
      this.queries.probePressed.subscribe('qualify', () => {
        if (!this.canTriggerTouch('probe')) return;
        labController.toggleWhichPathDetector();
      }),
      this.queries.shutterPressed.subscribe('qualify', () => {
        if (!this.canTriggerTouch('shutter')) return;
        labController.toggleSlitMode();
      }),
      this.queries.filtersPressed.subscribe('qualify', (entity) => {
        if (!this.canTriggerTouch('filter')) return;
        const nm = entity.getValue(FilterCrystalMarker, 'wavelengthNm') as WavelengthNm;
        if (nm === 430 || nm === 532 || nm === 650) {
          labController.setWavelength(nm);
        }
      }),
      this.queries.dialsPressed.subscribe('qualify', (entity) => {
        if (!this.canTriggerTouch('dial')) return;
        const station = entity.getValue(AnalyzerDialMarker, 'station');
        if (station === 'bob') {
          labController.cycleBobAngle();
        } else {
          labController.cycleAliceAngle();
        }
      }),
      labController.subscribe(() => {
        const s = labController.state;
        this.onboarding = computeOnboardingHint(s, labController.holdingKind, labController.bombInFlight);

        const ox = labController.benchOffsetX;
        const oy = labController.tableHeightY;
        const oz = -0.54 + labController.benchOffsetZ;

        if (s.bombPuzzle.explosions > this.prevExplosions) {
          this.prevExplosions = s.bombPuzzle.explosions;
          this.spawnParticleBurst(ox + 0.01, oy + 0.08, oz - 0.11, 'explode');
          this.pulseControllers(0.95, 260);
        } else if (
          s.bombPuzzle.defusedCount > this.prevDefused ||
          s.bombPuzzle.quarantinedCount > this.prevQuarantined ||
          s.bombPuzzle.darkHits > this.prevDarkHits ||
          s.schrodinger.missionsSolved > this.prevSchMissions ||
          s.tether.challengesCompleted > this.prevTetherChallenges
        ) {
          this.prevDefused = s.bombPuzzle.defusedCount;
          this.prevQuarantined = s.bombPuzzle.quarantinedCount;
          this.prevDarkHits = s.bombPuzzle.darkHits;
          this.prevSchMissions = s.schrodinger.missionsSolved;
          this.prevTetherChallenges = s.tether.challengesCompleted;
          this.spawnParticleBurst(ox, oy + 0.14, oz - 0.04, 'celebrate');
          this.pulseControllers(0.65, 110);
        }
      }),
      this.queries.cratesHeld.subscribe('qualify', () => this.pulseControllers(0.28, 35)),
      this.queries.bs2Held.subscribe('qualify', () => this.pulseControllers(0.28, 35)),
      this.queries.gatesHeld.subscribe('qualify', () => this.pulseControllers(0.28, 35)),
      this.queries.tetherOrbsHeld.subscribe('qualify', () => this.pulseControllers(0.32, 40)),
      this.queries.boxLidHeld.subscribe('qualify', () => this.pulseControllers(0.25, 35)),
      this.queries.benchAnchorHeld.subscribe('qualify', () => this.pulseControllers(0.35, 45)),
      this.queries.cratesHeld.subscribe('disqualify', (entity) => {
        const crateId = entity.getValue(BombCrateMarker, 'crateId') as BombCrateId;
        if (!entity.object3D) return;
        entity.object3D.getWorldPosition(this.releasedCratePosition);
        this.releasedCratePosition.x -= labController.benchOffsetX;
        this.releasedCratePosition.y -= labController.tableHeightY - DEFAULT_BENCH_Y;
        this.releasedCratePosition.z -= labController.benchOffsetZ;
        const nearSlot = this.releasedCratePosition.distanceToSquared(BOMB_SLOT_POS) < 0.21 ** 2;
        if (nearSlot) {
          if (labController.canLoadBombCrate(crateId)) {
            labController.placeCrateInSlot(crateId);
            this.pulseControllers(0.48, 55);
          }
        } else if (labController.state.bombPuzzle.slotCrate === crateId) {
          labController.unloadCrate();
          this.pulseControllers(0.24, 30);
        }
      }),
      this.queries.bs2Held.subscribe('disqualify', (entity) => {
        if (!entity.object3D) return;
        entity.object3D.getWorldPosition(this.releasedCratePosition);
        this.releasedCratePosition.x -= labController.benchOffsetX;
        this.releasedCratePosition.y -= labController.tableHeightY - DEFAULT_BENCH_Y;
        this.releasedCratePosition.z -= labController.benchOffsetZ;
        const nearSocket =
          this.releasedCratePosition.distanceToSquared(BS2_IN_POS) < 0.17 ** 2;
        if (nearSocket !== labController.state.bombPuzzle.bs2Installed) {
          labController.setBs2Installed(nearSocket);
          this.pulseControllers(nearSocket ? 0.52 : 0.24, nearSocket ? 55 : 30);
        }
      }),
      this.queries.bs2Pressed.subscribe('qualify', () => {
        if (!this.canTriggerTouch('bs2')) return;
        labController.toggleBs2();
        this.pulseControllers(0.35, 40);
      }),
      this.queries.cratesPressed.subscribe('qualify', (entity) => {
        const cid = entity.getValue(BombCrateMarker, 'crateId') as BombCrateId;
        if (!this.canTriggerTouch(`crate_${cid}`)) return;
        if (labController.canLoadBombCrate(cid)) {
          labController.placeCrateInSlot(cid);
          this.pulseControllers(0.42, 45);
        } else if (labController.state.bombPuzzle.slotCrate === cid) {
          labController.unloadCrate();
          this.pulseControllers(0.28, 35);
        } else {
          labController.notifyCrateBlocked(cid);
          this.pulseControllers(0.18, 25);
        }
      }),
      this.queries.bombRigPressed.subscribe('qualify', () => {
        if (!this.canTriggerTouch('bomb_rig')) return;
        labController.performBombMissionAction();
        this.pulseControllers(0.35, 40);
      }),
      this.queries.tetherOrbsPressed.subscribe('qualify', () => {
        if (!this.canTriggerTouch('tether')) return;
        labController.triggerTetherCollapse();
      }),
      this.queries.boxLidPressed.subscribe('qualify', () => {
        if (!this.canTriggerTouch('lid')) return;
        labController.toggleObserveBox();
      }),
      this.queries.gatesPressed.subscribe('qualify', (entity) => {
        const g = entity.getValue(GateCubeMarker, 'gate') as QuantumGateType;
        if (!this.canTriggerTouch(`gate_${g}`)) return;
        if (g === 'H' || g === 'X' || g === 'Z') {
          labController.applyGate(g);
        }
      }),
      () => {
        this.phosphorTexture.dispose();
        this.bellTexture.dispose();
        this.guideTooltipTexture.dispose();
        this.guideTooltipMat.dispose();
        tooltipGeo.dispose();
        this.world.scene.remove(this.guideTooltipMesh);
        this.eventPopupTexture.dispose();
        this.eventPopupMat.dispose();
        popupGeo.dispose();
        this.world.scene.remove(this.eventPopupMesh);
        photonGeo.dispose();
        particleGeo.dispose();
        for (let i = 0; i < this.thrownPhotonPool.length; i += 1) {
          this.world.scene.remove(this.thrownPhotonPool[i]);
          this.thrownPhotonMats[i].dispose();
        }
        for (let i = 0; i < this.particleMeshes.length; i += 1) {
          this.world.scene.remove(this.particleMeshes[i]);
          this.particleMats[i].dispose();
        }
      },
    );
  }

  private canTriggerTouch(key: string, cooldownMs = 170): boolean {
    const now = performance.now();
    const prev = this.lastTouchAt.get(key) ?? 0;
    if (now - prev < cooldownMs) return false;
    this.lastTouchAt.set(key, now);
    return true;
  }

  private pulseControllers(intensity: number, durationMs: number): void {
    try {
      const xrSession = this.world.renderer.xr.getSession();
      if (!xrSession) return;
      for (const source of xrSession.inputSources) {
        const gp = source?.gamepad as
          | { hapticActuators?: Array<{ pulse?: (v: number, d: number) => Promise<boolean> }> }
          | undefined;
        gp?.hapticActuators?.[0]?.pulse?.(intensity, durationMs).catch?.(() => {});
      }
    } catch {
      // Non-XR or hand-only fallback without actuators
    }
  }

  private spawnParticleBurst(ox: number, oy: number, oz: number, kind: 'explode' | 'celebrate'): void {
    for (let i = 0; i < this.particleMeshes.length; i += 1) {
      const mesh = this.particleMeshes[i];
      const mat = this.particleMats[i];
      const vel = this.particleVel[i];
      const angle = (i / this.particleMeshes.length) * Math.PI * 2 + (i % 3) * 0.25;
      const speed = kind === 'explode' ? 0.9 + (i % 5) * 0.35 : 0.45 + (i % 4) * 0.22;
      const lift = kind === 'explode' ? 0.85 + (i % 4) * 0.38 : 1.05 + (i % 5) * 0.28;

      mesh.position.set(ox, oy, oz);
      mesh.scale.setScalar(1);
      mesh.visible = true;
      vel.set(Math.cos(angle) * speed, lift, Math.sin(angle) * speed);
      this.particleAge[i] = 0;
      this.particleMaxAge[i] = kind === 'explode' ? 0.62 + (i % 4) * 0.08 : 0.8 + (i % 4) * 0.09;

      const hex =
        kind === 'explode'
          ? i % 3 === 0
            ? '#fb7185'
            : i % 3 === 1
              ? '#f97316'
              : '#fde047'
          : i % 3 === 0
            ? '#34d399'
            : i % 3 === 1
              ? '#38bdf8'
              : '#fde047';
      mat.color.set(hex);
      mat.emissive.set(hex);
      mat.opacity = 1;
    }
  }

  private cloneOwnMaterial(mesh: Mesh): MeshStandardMaterial | null {
    const raw = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!(raw instanceof MeshStandardMaterial)) return null;
    const cloned = raw.clone();
    mesh.material = cloned;
    return cloned;
  }

  private bindRigsIfReady(): void {
    if (this.rigsBound) return;
    const slitEntity = this.queries.doubleSlitRig.entities.values().next().value;
    const bellEntity = this.queries.entanglementRig.entities.values().next().value;
    const slitObj = slitEntity?.object3D;
    const bellObj = bellEntity?.object3D;
    if (!slitObj || !bellObj) return;

    this.waveArcs = [];
    this.waveArcMats = [];

    slitObj.traverse((node) => {
      if (node.name === 'PhosphorScreenGroup') {
        this.screenGroup = node;
      }
      if (!(node instanceof Mesh)) {
        if (node.name === 'SlitDetectorCollar') this.slitCollar = node;
        return;
      }
      if (node.name === 'SlitDetectorCollar') {
        this.slitCollar = node;
        this.slitCollarMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'LaserApertureLens') {
        this.laserLensMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'LaserBeamCore') {
        this.laserBeamMat = this.cloneOwnMaterial(node);
      } else if (node.name.startsWith('WaveArc_')) {
        this.waveArcs.push(node);
        const mat = this.cloneOwnMaterial(node);
        if (mat) this.waveArcMats.push(mat);
      } else if (node.name === 'PhosphorScreenDisplay') {
        const mat = new MeshStandardMaterial({
          map: this.phosphorTexture,
          emissiveMap: this.phosphorTexture,
          emissive: '#ffffff',
          emissiveIntensity: 1.15,
          roughness: 0.25,
          metalness: 0.05,
        });
        node.material = mat;
      }
    });

    bellObj.traverse((node) => {
      if (node.name === 'EntangledPulseAlice') this.pulseAlice = node;
      if (node.name === 'EntangledPulseBob') this.pulseBob = node;
      if (node.name === 'EPRSourceCrystal') this.eprCrystal = node;
      if (!(node instanceof Mesh)) return;
      if (node.name === 'AliceOutcomeLamp') {
        this.aliceLampMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BobOutcomeLamp') {
        this.bobLampMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BellTelemetryScreen') {
        const mat = new MeshStandardMaterial({
          map: this.bellTexture,
          emissiveMap: this.bellTexture,
          emissive: '#ffffff',
          emissiveIntensity: 1.1,
          roughness: 0.28,
          metalness: 0.05,
        });
        node.material = mat;
      }
    });

    this.rigsBound = true;
    this.renderPhosphorTexture();
    this.renderBellTexture();
  }

  private bindExtraRigsIfReady(): void {
    if (this.extraRigsBound) return;
    const bombObj = this.queries.bombRig.entities.values().next().value?.object3D;
    const tetherObj = this.queries.tetherRig.entities.values().next().value?.object3D;
    const schObj = this.queries.schrodingerRig.entities.values().next().value?.object3D;
    const waveObj = this.queries.roomWave.entities.values().next().value?.object3D;
    if (!bombObj || !tetherObj || !schObj || !waveObj) return;

    bombObj.traverse((node) => {
      if (node.name === 'BombTravelPhoton') this.bombTravelPhoton = node;
      if (!(node instanceof Mesh)) return;
      if (node.name === 'BombDetectorD0Lamp') {
        this.bombD0LampMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BombDetectorD1Lamp') {
        this.bombD1LampMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BombTestSocketRing') {
        this.bombSocketRingMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BombBS2SocketRing') {
        this.bombBs2SocketRingMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BombPhasePiPlate') {
        this.bombPhaseMat = this.cloneOwnMaterial(node);
      } else if (node.name === 'BombExplosionShockRing') {
        this.bombShockRing = node;
        this.bombShockMat = this.cloneOwnMaterial(node);
      }
    });

    tetherObj.traverse((node) => {
      if (node.name === 'TetherCollapsePulse') this.tetherPulseMesh = node;
      if (node instanceof Mesh && node.name === 'TetherPlasmaBeam') {
        this.tetherBeamMesh = node;
        this.tetherBeamMat = this.cloneOwnMaterial(node);
      }
    });

    for (const orbEnt of this.queries.tetherOrbs.entities) {
      const side = orbEnt.getValue(TetherOrbMarker, 'side');
      orbEnt.object3D?.traverse((node) => {
        if (node instanceof Mesh && node.name.startsWith('TetherOrbCore_')) {
          const cloned = this.cloneOwnMaterial(node);
          if (side === 'right') this.tetherRightCoreMat = cloned;
          else this.tetherLeftCoreMat = cloned;
        }
      });
    }

    schObj.traverse((node) => {
      if (node.name === 'SchrodingerAwakeState') {
        this.awakeOrb = node;
        node.traverse((child) => {
          if (child instanceof Mesh && !this.awakeMat) {
            this.awakeMat = this.cloneOwnMaterial(child);
          } else if (child instanceof Mesh && this.awakeMat) {
            child.material = this.awakeMat;
          }
        });
        return;
      }
      if (node.name === 'SchrodingerAsleepState') {
        this.asleepOrb = node;
        node.traverse((child) => {
          if (child instanceof Mesh && !this.asleepMat) {
            this.asleepMat = this.cloneOwnMaterial(child);
          } else if (child instanceof Mesh && this.asleepMat) {
            child.material = this.asleepMat;
          }
        });
        return;
      }
      if (node instanceof Mesh && node.name === 'SchrodingerGateDockRing') {
        this.gateDockRingMat = this.cloneOwnMaterial(node);
      }
    });

    waveObj.traverse((node) => {
      if (node instanceof Mesh && node.name === 'RoomWaveRippleSurface') {
        this.roomWaveMat = this.cloneOwnMaterial(node);
        const attr = node.geometry.getAttribute('position');
        if (attr instanceof BufferAttribute) {
          this.roomWavePosAttr = attr;
        }
      }
    });

    this.crateBarMats = [];
    for (const cEnt of this.queries.crates.entities) {
      cEnt.object3D?.traverse((node) => {
        if (node instanceof Mesh && node.name.startsWith('CrateTopBar_')) {
          const cloned = this.cloneOwnMaterial(node);
          if (cloned) this.crateBarMats.push(cloned);
        }
      });
    }

    this.gateBarMats = [];
    for (const gEnt of this.queries.gates.entities) {
      gEnt.object3D?.traverse((node) => {
        if (node instanceof Mesh && node.name.startsWith('GateGlyphTop_')) {
          const cloned = this.cloneOwnMaterial(node);
          if (cloned) this.gateBarMats.push(cloned);
        }
      });
    }

    const lidObj = this.queries.boxLid.entities.values().next().value?.object3D;
    lidObj?.traverse((node) => {
      if (node instanceof Mesh && node.name === 'BoxLidGripHandle') {
        this.lidHandleMat = this.cloneOwnMaterial(node);
      }
    });

    this.dialBarMats = [];
    for (const dEnt of this.queries.dials.entities) {
      dEnt.object3D?.traverse((node) => {
        if (node instanceof Mesh && node.name.endsWith('PolarizerAxisBar')) {
          const cloned = this.cloneOwnMaterial(node);
          if (cloned) this.dialBarMats.push(cloned);
        }
      });
    }

    this.extraRigsBound = true;
  }

  private bindProbeAndGuideIfReady(): void {
    if (!this.probeBound) {
      const probeObj = this.queries.probe.entities.values().next().value?.object3D;
      if (probeObj) {
        probeObj.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          if (node.name === 'ProbeSensorTip') {
            this.probeTipMat = this.cloneOwnMaterial(node);
          } else if (node.name === 'ProbeBeaconRing') {
            this.probeBeaconMat = this.cloneOwnMaterial(node);
          }
        });
        this.probeBound = true;
      }
    }

    if (!this.guideBound) {
      const arrowObj = this.queries.guideArrow.entities.values().next().value?.object3D;
      if (arrowObj) {
        arrowObj.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          if (node.name === 'GuideArrowTipCone') {
            this.guideArrowConeMat = this.cloneOwnMaterial(node);
          } else if (node.name === 'GuideArrowHaloRing') {
            this.guideArrowHalo = node;
            this.guideArrowHaloMat = this.cloneOwnMaterial(node);
          }
        });
        this.guideBound = true;
      }
    }
  }

  private applyHoverFeedback(entities: Iterable<Entity>, delta: number, heldSet?: Set<Entity>): void {
    const rate = Math.min(1, delta * 14);
    for (const ent of entities) {
      const obj = ent.object3D;
      if (!obj) continue;
      const isHovered = this.queries.hovered.entities.has(ent);
      const isHeld = heldSet ? heldSet.has(ent) : false;
      const targetScale = isHeld ? 1.09 : isHovered ? 1.07 : 1.0;
      const cur = obj.scale.x;
      const next = cur + (targetScale - cur) * rate;
      obj.scale.setScalar(next);
    }
  }

  private renderPhosphorTexture(): void {
    const ctx = this.phosphorCtx;
    const w = this.phosphorCanvas.width;
    const h = this.phosphorCanvas.height;
    const state = labController.state;
    const beamHex = wavelengthColorHex(state.wavelengthNm);

    ctx.fillStyle = '#050b16';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i += 1) {
      const gx = (w / 6) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 32);
      ctx.lineTo(gx, h - 14);
      ctx.stroke();
    }

    ctx.fillStyle = state.whichPathDetector ? '#f59e0b' : '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    const modeLabel =
      state.slitMode === 'single'
        ? 'SINGLE SLIT DIFFRACTION'
        : state.whichPathDetector
          ? 'WHICH-PATH ON -> FRINGES COLLAPSED'
          : 'COHERENT INTERFERENCE |psi1 + psi2|^2';
    ctx.fillText(modeLabel, 14, 24);

    const impactTop = 38;
    const impactHeight = 148;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(14, impactTop, w - 28, impactHeight);

    for (let i = 0; i < state.recentHits.length; i += 1) {
      const hit = state.recentHits[i];
      const px = 22 + ((hit.xNorm + 1) * 0.5) * (w - 44);
      const py = impactTop + impactHeight * 0.5 + hit.yNorm * (impactHeight * 0.42);
      ctx.fillStyle = wavelengthColorHex(hit.wavelengthNm);
      ctx.beginPath();
      ctx.arc(px, py, 2.7, 0, Math.PI * 2);
      ctx.fill();
    }

    const curveTop = 196;
    const curveHeight = 76;
    const maxBin = Math.max(1, ...state.histogram);
    const barW = (w - 44) / SCREEN_HISTOGRAM_BINS;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    for (let b = 0; b < SCREEN_HISTOGRAM_BINS; b += 1) {
      const bh = (state.histogram[b] / maxBin) * (curveHeight - 8);
      ctx.fillRect(22 + b * barW, curveTop + curveHeight - bh, Math.max(2, barW - 1), bh);
    }

    ctx.strokeStyle = beamHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const samples = 96;
    for (let s = 0; s <= samples; s += 1) {
      const u = s / samples;
      const xNorm = u * 2 - 1;
      const p = evaluateDoubleSlitProbability(xNorm, state);
      const cx = 22 + u * (w - 44);
      const cy = curveTop + curveHeight - p * (curveHeight - 10) - 4;
      if (s === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    ctx.fillText(
      `Hits: ${state.totalHits} | Vis: ${(state.theoreticalVisibility * 100).toFixed(0)}% | L: ${(state.screenDistanceScale ?? 1).toFixed(2)}x`,
      16,
      h - 4,
    );

    this.phosphorTexture.needsUpdate = true;
  }

  private renderBellTexture(): void {
    const ctx = this.bellCtx;
    const w = this.bellCanvas.width;
    const h = this.bellCanvas.height;
    const state = labController.state;

    ctx.fillStyle = '#071022';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = state.chshWitnessS && state.chshWitnessS > 2 ? '#4ade80' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.fillStyle = '#c4b5fd';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText('BELL STATE |Phi+> = (|00> + |11>) / sqrt(2)', 18, 28);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '17px sans-serif';
    ctx.fillText(
      `Alice: ${state.aliceAngleDeg} deg   |   Bob: ${state.bobAngleDeg} deg`,
      18,
      58,
    );

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(
      `E(Theory): ${state.theoreticalCorrelation.toFixed(2)}   |   E(Measured): ${state.measuredCorrelation.toFixed(2)}`,
      18,
      92,
    );

    const agreePct =
      state.pairCount > 0
        ? Math.round((state.sameOutcomeCount / state.pairCount) * 100)
        : 0;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px sans-serif';
    ctx.fillText(
      `Pairs: ${state.pairCount}  |  Same: ${agreePct}%  |  Opposite: ${state.pairCount > 0 ? 100 - agreePct : 0}%`,
      18,
      122,
    );

    const cellCount = Object.keys(state.chshCells).length;
    const isCanon = state.chshCells[chshKey(state.aliceAngleDeg, state.bobAngleDeg)] != null;
    if (state.chshWitnessS != null) {
      ctx.fillStyle = state.chshWitnessS > 2 ? '#4ade80' : '#fbbf24';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(
        `CHSH S = ${state.chshWitnessS.toFixed(2)} ${state.chshWitnessS > 2 ? '> 2.00 QUANTUM VIOLATION!' : '<= 2.00'}`,
        18,
        156,
      );
    } else {
      ctx.fillStyle = '#67e8f9';
      ctx.font = '15px sans-serif';
      ctx.fillText(
        `CHSH Cells: ${cellCount}/4 ${isCanon ? '(current recorded)' : '-> Press CHSH Test'}`,
        18,
        156,
      );
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText(
      `Quest ${state.questStep}/4 | Last: A=${state.lastOutcomeA ?? '-'} B=${state.lastOutcomeB ?? '-'}`,
      18,
      180,
    );

    this.bellTexture.needsUpdate = true;
  }

  private wrapCardText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): [string, string] {
    const words = text.split(/\s+/).filter(Boolean);
    let line1 = '';
    let line2 = '';
    for (const word of words) {
      const test = line1 ? `${line1} ${word}` : word;
      if (!line2 && ctx.measureText(test).width <= maxWidth) {
        line1 = test;
      } else {
        const test2 = line2 ? `${line2} ${word}` : word;
        if (ctx.measureText(test2).width <= maxWidth) {
          line2 = test2;
        } else {
          break;
        }
      }
    }
    return [line1, line2];
  }

  private drawFloatingCardTexture(
    ctx: CanvasRenderingContext2D,
    tex: CanvasTexture,
    badge: string,
    headline: string,
    body: string,
    accentHex: string,
  ): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(7, 13, 28, 0.96)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 7;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    // Top control / status pill
    ctx.fillStyle = accentHex;
    ctx.fillRect(16, 14, w - 32, 34);
    ctx.fillStyle = '#071022';
    ctx.font = 'bold 21px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.slice(0, 44), 26, 32);

    // Headline ("What to do?" / "What happened!") across up to 2 crisp lines
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 23px sans-serif';
    const [head1, head2] = this.wrapCardText(ctx, headline, w - 36);
    ctx.fillText(head1, 18, 72);
    if (head2) ctx.fillText(head2, 18, 100);

    // Wrapped 2-line explanation ("Why?")
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    const [body1, body2] = this.wrapCardText(ctx, body, w - 36);
    const bodyBaseY = head2 ? 140 : 120;
    ctx.fillText(body1, 18, bodyBaseY);
    if (body2) ctx.fillText(body2, 18, bodyBaseY + 28);

    tex.needsUpdate = true;
  }

  private renderGuideTooltipTexture(): void {
    const o = this.onboarding;
    this.drawFloatingCardTexture(
      this.guideTooltipCtx,
      this.guideTooltipTexture,
      o.controlHint || 'TRIGGER / PINCH',
      o.ctaText,
      o.whyText || o.stepTag,
      o.accentHex,
    );
  }

  private renderEventPopupTexture(): void {
    this.drawFloatingCardTexture(
      this.eventPopupCtx,
      this.eventPopupTexture,
      'WHAT JUST HAPPENED · WHY',
      labController.eventTitle,
      labController.eventWhy,
      labController.eventAccent,
    );
  }

  update(delta: number, time: number): void {
    this.bindRigsIfReady();
    this.bindExtraRigsIfReady();
    this.bindProbeAndGuideIfReady();

    if (this.gateSnapCooldown > 0) this.gateSnapCooldown = Math.max(0, this.gateSnapCooldown - delta);
    if (this.tetherShakeCooldown > 0) this.tetherShakeCooldown = Math.max(0, this.tetherShakeCooldown - delta);

    // Animate 24 zero-allocation particle bursts
    for (let i = 0; i < this.particleMeshes.length; i += 1) {
      const age = this.particleAge[i];
      const maxAge = this.particleMaxAge[i];
      const mesh = this.particleMeshes[i];
      if (age < maxAge) {
        const nextAge = age + delta;
        this.particleAge[i] = nextAge;
        const p = Math.min(1, nextAge / maxAge);
        const vel = this.particleVel[i];
        vel.y -= 2.6 * delta;
        mesh.position.addScaledVector(vel, delta);
        mesh.rotation.x += 5.5 * delta;
        mesh.rotation.y += 4.2 * delta;
        mesh.scale.setScalar(Math.max(0.05, 1 - p * 0.85));
        this.particleMats[i].opacity = Math.max(0, 1 - p);
      } else if (mesh.visible) {
        mesh.visible = false;
      }
    }

    labController.tickSimulation(delta);

    const state = labController.state;
    const exp = state.experiment;
    const isBomb = exp === 'bomb_puzzle';
    const isTether = exp === 'tether';
    const isSchrodinger = exp === 'schrodinger';
    const isDoubleSlit = exp === 'double_slit';
    const isEntanglement = exp === 'entanglement';
    const vis = this.world.visibilityState.peek();

    // 0. Discover real tabletop height & surface dimensions via XRPlane in AR
    if (
      !labController.userRepositionedBench &&
      vis !== VisibilityState.NonImmersive &&
      this.queries.xrPlanes.entities.size > 0
    ) {
      let bestTableY: number | null = null;
      let bestTableW = 1.04;
      let bestTableD = 0.56;
      let bestDist = Infinity;
      for (const planeEntity of this.queries.xrPlanes.entities) {
        const obj = planeEntity.object3D;
        if (!obj) continue;
        obj.getWorldPosition(this.tmpVec);
        if (this.tmpVec.y >= 0.55 && this.tmpVec.y <= 1.15 && Math.abs(this.tmpVec.x) <= 0.8) {
          const dist = Math.hypot(this.tmpVec.x, this.tmpVec.z + 0.54);
          if (dist < bestDist) {
            bestDist = dist;
            bestTableY = this.tmpVec.y;
            this.tableBox.setFromObject(obj);
            this.tableBox.getSize(this.tableSize);
            if (this.tableSize.x > 0.25 && this.tableSize.z > 0.2) {
              bestTableW = this.tableSize.x;
              bestTableD = this.tableSize.z;
            }
          }
        }
      }
      if (bestTableY != null) {
        labController.applyDetectedTableDimensions(bestTableW, bestTableD, bestTableY);
        if (!this.tableAutoSnapped && bestTableY >= 0.65 && bestTableY <= 1.12) {
          this.tableAutoSnapped = true;
          labController.snapToDetectedTable();
        }
      }
    }

    // 0b. Handle grabbing the front bench anchor bar to move the entire optical lab onto any real table
    const benchAnchorEntity = this.queries.benchAnchor.entities.values().next().value;
    if (benchAnchorEntity?.object3D) {
      if (this.queries.benchAnchorHeld.entities.has(benchAnchorEntity)) {
        benchAnchorEntity.object3D.getWorldPosition(this.tmpVec);
        labController.setBenchOffset(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z + 0.275, true);
      } else {
        this.tmpTarget.set(labController.benchOffsetX, labController.tableHeightY, -0.275 + labController.benchOffsetZ);
        benchAnchorEntity.object3D.position.lerp(this.tmpTarget, Math.min(1, delta * 14));
      }
    }

    // Apply bench position offset (dx, tableY, dz) & tabletop width scale (sx)
    const dx = labController.benchOffsetX;
    const dy = labController.tableHeightY - DEFAULT_BENCH_Y;
    const dz = labController.benchOffsetZ;
    const sx = labController.layoutScaleX;
    const benchEntity = this.queries.bench.entities.values().next().value;
    const slitEntity = this.queries.doubleSlitRig.entities.values().next().value;
    const bellEntity = this.queries.entanglementRig.entities.values().next().value;
    const bombEntity = this.queries.bombRig.entities.values().next().value;
    const tetherEntity = this.queries.tetherRig.entities.values().next().value;
    const schEntity = this.queries.schrodingerRig.entities.values().next().value;
    const roomWaveEntity = this.queries.roomWave.entities.values().next().value;
    const bs2Entity = this.queries.bs2.entities.values().next().value;
    const lidEntity = this.queries.boxLid.entities.values().next().value;
    const probeEntity = this.queries.probe.entities.values().next().value;
    const shutterEntity = this.queries.shutter.entities.values().next().value;

    if (
      Math.abs(dx - this.lastBenchX) > 0.001 ||
      Math.abs(labController.tableHeightY - this.lastTableY) > 0.001 ||
      Math.abs(dz - this.lastBenchZ) > 0.001 ||
      Math.abs(sx - this.lastLayoutScaleX) > 0.005
    ) {
      this.lastBenchX = dx;
      this.lastTableY = labController.tableHeightY;
      this.lastBenchZ = dz;
      this.lastLayoutScaleX = sx;
      const rigs = [benchEntity, slitEntity, bellEntity, bombEntity, tetherEntity, schEntity];
      for (const r of rigs) {
        if (r?.object3D) r.object3D.position.set(dx, labController.tableHeightY, -0.54 + dz);
      }
      if (benchEntity?.object3D) benchEntity.object3D.scale.x = sx;
      const shadowObj = this.world.getSceneObject('shadow-catcher');
      if (shadowObj) shadowObj.position.set(dx, 0.001, -0.54 + dz);
      const panelObj = this.world.getSceneObject('lab-panel');
      if (panelObj) panelObj.position.set(dx, 1.335 + dy * 0.85, -0.78 + dz);
    }

    // 1. Visibility switch across all 5 modes
    const visKey = `${exp}:${state.roomscaleWave}`;
    if (this.lastVisibilityKey !== visKey) {
      if (bombEntity?.object3D) bombEntity.object3D.visible = isBomb;
      for (const e of this.queries.crates.entities) if (e.object3D) e.object3D.visible = isBomb;
      if (bs2Entity?.object3D) bs2Entity.object3D.visible = isBomb;

      if (tetherEntity?.object3D) tetherEntity.object3D.visible = isTether;
      for (const e of this.queries.tetherOrbs.entities) if (e.object3D) e.object3D.visible = isTether;

      if (schEntity?.object3D) schEntity.object3D.visible = isSchrodinger;
      if (lidEntity?.object3D) lidEntity.object3D.visible = isSchrodinger;
      for (const e of this.queries.gates.entities) if (e.object3D) e.object3D.visible = isSchrodinger;

      if (slitEntity?.object3D) slitEntity.object3D.visible = isDoubleSlit;
      if (probeEntity?.object3D) probeEntity.object3D.visible = isDoubleSlit;
      if (shutterEntity?.object3D) shutterEntity.object3D.visible = isDoubleSlit;
      for (const e of this.queries.filters.entities) if (e.object3D) e.object3D.visible = isDoubleSlit;
      if (roomWaveEntity?.object3D) {
        roomWaveEntity.object3D.visible = isDoubleSlit && state.roomscaleWave;
      }

      if (bellEntity?.object3D) bellEntity.object3D.visible = isEntanglement;
      for (const e of this.queries.dials.entities) if (e.object3D) e.object3D.visible = isEntanglement;

      this.lastVisibilityKey = visKey;
    }

    // Universal tactile Hovered scale highlight (only on active interactive pieces)
    this.applyHoverFeedback(this.queries.benchAnchor.entities, delta, this.queries.benchAnchorHeld.entities);
    if (isBomb) {
      this.applyHoverFeedback(this.queries.crates.entities, delta, this.queries.cratesHeld.entities);
      this.applyHoverFeedback(this.queries.bs2.entities, delta, this.queries.bs2Held.entities);
    } else if (isTether) {
      this.applyHoverFeedback(this.queries.tetherOrbs.entities, delta, this.queries.tetherOrbsHeld.entities);
    } else if (isSchrodinger) {
      this.applyHoverFeedback(this.queries.gates.entities, delta, this.queries.gatesHeld.entities);
      this.applyHoverFeedback(this.queries.boxLid.entities, delta, this.queries.boxLidHeld.entities);
    } else if (isDoubleSlit) {
      this.applyHoverFeedback(this.queries.probe.entities, delta, this.queries.probeHeld.entities);
      this.applyHoverFeedback(this.queries.shutter.entities, delta, this.queries.shutterHeld.entities);
      this.applyHoverFeedback(this.queries.filters.entities, delta, this.queries.filtersHeld.entities);
    } else if (isEntanglement) {
      this.applyHoverFeedback(this.queries.dials.entities, delta, this.queries.dialsHeld.entities);
    }

    // Track current held item kind for responsive step-by-step onboarding CTAs
    const curHoldingKind =
      this.queries.cratesHeld.entities.size > 0
        ? 'crate'
        : this.queries.bs2Held.entities.size > 0
          ? 'bs2'
          : this.queries.gatesHeld.entities.size > 0
            ? 'gate'
            : this.queries.probeHeld.entities.size > 0
              ? 'probe'
              : 'none';
    labController.setHoldingKind(curHoldingKind);
    const onboarding = this.onboarding;
    const blink = 0.5 + 0.5 * Math.sin(time * 7.8);

    // Blink emissive highlights on active onboarding objects
    const crateEmissive = onboarding.target === 'crates' ? 0.9 + blink * 2.2 : 1.0;
    for (let i = 0; i < this.crateBarMats.length; i += 1) {
      this.crateBarMats[i].emissiveIntensity = crateEmissive;
    }
    const gateEmissive = onboarding.target === 'gates' ? 0.9 + blink * 2.2 : 1.2;
    for (let i = 0; i < this.gateBarMats.length; i += 1) {
      this.gateBarMats[i].emissiveIntensity = gateEmissive;
    }
    if (this.lidHandleMat) {
      this.lidHandleMat.emissiveIntensity = onboarding.target === 'box_lid' ? 1.1 + blink * 2.3 : 0.9;
    }
    const dialEmissive = onboarding.target === 'dials' ? 0.9 + blink * 2.0 : 0.9;
    for (let i = 0; i < this.dialBarMats.length; i += 1) {
      this.dialBarMats[i].emissiveIntensity = dialEmissive;
    }

    // 2. Mode 1: Quantum Bomb Puzzle mechanics & VFX
    if (isBomb) {
      const bp = state.bombPuzzle;
      this.tmpVec.set(BOMB_SLOT_POS.x + dx, BOMB_SLOT_POS.y + dy, BOMB_SLOT_POS.z + dz);

      for (const crateEnt of this.queries.crates.entities) {
        const obj = crateEnt.object3D;
        if (!obj) continue;
        const cid = crateEnt.getValue(BombCrateMarker, 'crateId') as BombCrateId;
        if (this.queries.cratesHeld.entities.has(crateEnt)) continue;
        if (bp.slotCrate === cid) {
          obj.position.lerp(this.tmpVec, Math.min(1, delta * 12));
        } else {
          const home = cid === 'alpha' ? CRATE_ALPHA_HOME : CRATE_BETA_HOME;
          this.tmpTarget.set(home.x * sx + dx, home.y + dy, home.z + dz);
          obj.position.lerp(this.tmpTarget, Math.min(1, delta * 10));
        }
      }

      if (bs2Entity?.object3D && !this.queries.bs2Held.entities.has(bs2Entity)) {
        const bTarget = bp.bs2Installed ? BS2_IN_POS : BS2_OUT_POS;
        const bx = bp.bs2Installed ? bTarget.x : bTarget.x * sx;
        this.tmpTarget.set(bx + dx, bTarget.y + dy, bTarget.z + dz);
        bs2Entity.object3D.position.lerp(this.tmpTarget, Math.min(1, delta * 10));
      }

      if (this.bombBs2SocketRingMat) {
        const needsBs2 = !bp.bs2Installed;
        this.bombBs2SocketRingMat.color.set(needsBs2 ? '#22d3ee' : '#0ea5e9');
        this.bombBs2SocketRingMat.emissive.set(needsBs2 ? '#22d3ee' : '#0ea5e9');
        this.bombBs2SocketRingMat.emissiveIntensity = needsBs2
          ? 1.5 + blink * 2.1
          : 0.6;
      }

      if (this.bombPhaseMat) {
        this.bombPhaseMat.emissiveIntensity = bp.phasePiEnabled ? 1.85 : 0.2;
        this.bombPhaseMat.opacity = bp.phasePiEnabled ? 0.85 : 0.25;
      }
      if (this.bombSocketRingMat) {
        const sColor =
          bp.lastOutcome === 'defused'
            ? '#34d399'
            : !labController.bombInFlight && (bp.lastOutcome === 'exploded' || bp.lastOutcome === 'wrong_guess')
              ? '#fb7185'
              : '#fbbf24';
        this.bombSocketRingMat.color.set(sColor);
        this.bombSocketRingMat.emissive.set(sColor);
        this.bombSocketRingMat.emissiveIntensity = onboarding.target === 'bomb_slot' ? 2.2 : bp.slotCrate ? 1.4 : 0.55;
      }
      if (this.bombD0LampMat) {
        const darkActive = !labController.bombInFlight && bp.lastOutcome === 'dark_d0';
        this.bombD0LampMat.emissive.set(darkActive ? '#fde047' : '#d97706');
        this.bombD0LampMat.emissiveIntensity = darkActive
          ? 2.4 + 0.5 * Math.sin(time * 8)
          : 0.35;
      }
      if (this.bombD1LampMat) {
        const safeActive = !labController.bombInFlight && bp.lastOutcome === 'safe_d1';
        this.bombD1LampMat.emissiveIntensity = safeActive ? 2.2 : 0.45;
      }
      if (this.bombShockRing && this.bombShockMat) {
        if (labController.bombExplosionTimer > 0) {
          const p = 1 - labController.bombExplosionTimer / 1.25;
          this.bombShockRing.visible = true;
          this.bombShockRing.scale.setScalar(1 + p * 3.4);
          this.bombShockMat.opacity = 1 - p;
          this.bombShockMat.transparent = true;
        } else {
          this.bombShockRing.visible = false;
        }
      }
      if (this.bombTravelPhoton) {
        const fly = labController.bombPhotonFlyPhase;
        if (fly < 1) {
          this.bombTravelPhoton.visible = true;
          // Segment travel inside bomb-rig local coordinates
          if (fly < 0.25) {
            const t = fly / 0.25;
            this.bombTravelPhoton.position.set(-0.3 + t * 0.1, 0.068, 0.09);
          } else if (bp.lastOutcome === 'exploded') {
            const t = Math.min(1, (fly - 0.25) / 0.75);
            this.bombTravelPhoton.position.set(-0.2 + t * 0.21, 0.068, 0.09 - t * 0.2);
          } else if (fly < 0.75) {
            const t = (fly - 0.25) / 0.5;
            this.bombTravelPhoton.position.set(-0.2 + t * 0.41, 0.068, 0.09 - t * 0.2);
          } else {
            const t = (fly - 0.75) / 0.25;
            if (bp.lastOutcome === 'dark_d0') {
              this.bombTravelPhoton.position.set(0.21, 0.068, -0.11 - t * 0.095);
            } else {
              this.bombTravelPhoton.position.set(0.21 + t * 0.15, 0.068, -0.11);
            }
          }
        } else {
          this.bombTravelPhoton.visible = false;
        }
      }
    }

    // 3. Mode 2: Two-Hand Quantum Tether
    if (isTether) {
      let leftObj: Object3D | null = null;
      let rightObj: Object3D | null = null;
      let leftHeld = false;
      let rightHeld = false;

      for (const orbEnt of this.queries.tetherOrbs.entities) {
        const side = orbEnt.getValue(TetherOrbMarker, 'side');
        const held = this.queries.tetherOrbsHeld.entities.has(orbEnt);
        if (side === 'right') {
          rightObj = orbEnt.object3D ?? null;
          rightHeld = held;
        } else {
          leftObj = orbEnt.object3D ?? null;
          leftHeld = held;
        }
      }

      // Handle explicit HUD Nudge button cleanly
      if (labController.tetherNudgeSeq !== this.lastTetherNudgeSeq && leftObj && rightObj && !leftHeld && !rightHeld) {
        this.lastTetherNudgeSeq = labController.tetherNudgeSeq;
        const half = Math.min(1.05, state.tether.distanceM * 0.5);
        leftObj.position.x = -half;
        rightObj.position.x = half;
      }

      if (leftObj && rightObj) {
        leftObj.getWorldPosition(this.tmpVec);
        rightObj.getWorldPosition(this.tmpVecB);

        // Shake detection on held orbs!
        if (delta > 0.001 && this.tetherShakeCooldown <= 0) {
          const speedL = leftHeld ? this.tmpVec.distanceTo(this.prevLeftPos) / delta : 0;
          const speedR = rightHeld ? this.tmpVecB.distanceTo(this.prevRightPos) / delta : 0;
          if (speedL > 1.75 || speedR > 1.75) {
            this.tetherShakeCooldown = 0.7;
            labController.triggerTetherCollapse();
          }
        }
        this.prevLeftPos.copy(this.tmpVec);
        this.prevRightPos.copy(this.tmpVecB);

        const dist = this.tmpVec.distanceTo(this.tmpVecB);
        if (Math.abs(dist - this.prevTetherDistDelta) > 0.02) {
          this.prevTetherDistDelta = dist;
          labController.updateTetherDistance(dist);
        }

        // Align plasma beam & collapse pulse in tether-rig local coordinates (offset by [dx, tableHeightY, -0.54 + dz])
        if (this.tetherBeamMesh) {
          this.tmpTarget.copy(this.tmpVec).add(this.tmpVecB).multiplyScalar(0.5);
          this.tetherBeamMesh.position.set(
            this.tmpTarget.x - dx,
            this.tmpTarget.y - labController.tableHeightY,
            this.tmpTarget.z + 0.54 - dz,
          );
          this.tmpDir.copy(this.tmpVecB).sub(this.tmpVec);
          const len = this.tmpDir.length();
          if (len > 0.001) {
            this.tmpDir.divideScalar(len);
            this.tmpQuat.setFromUnitVectors(UP_AXIS, this.tmpDir);
            this.tetherBeamMesh.quaternion.copy(this.tmpQuat);
            this.tetherBeamMesh.scale.set(1, len, 1);
          }
          if (this.tetherBeamMat) {
            const beamHex =
              state.tether.mode === 'correlated' ? '#38bdf8' : '#a78bfa';
            this.tetherBeamMat.color.set(beamHex);
            this.tetherBeamMat.emissive.set(beamHex);
            this.tetherBeamMat.emissiveIntensity =
              labController.pairFlyPhase < 1 ? 2.4 : 1.15;
          }
        }

        if (this.tetherPulseMesh) {
          if (labController.pairFlyPhase < 1) {
            const t = labController.pairFlyPhase;
            this.tetherPulseMesh.visible = true;
            this.tmpTarget.copy(this.tmpVec).lerp(this.tmpVecB, t);
            this.tetherPulseMesh.position.set(
              this.tmpTarget.x - dx,
              this.tmpTarget.y - labController.tableHeightY,
              this.tmpTarget.z + 0.54 - dz,
            );
          } else {
            this.tetherPulseMesh.visible = false;
          }
        }

        if (this.tetherLeftCoreMat) {
          const hex =
            state.tether.leftSpin === null
              ? '#38bdf8'
              : state.tether.leftSpin > 0
                ? '#22d3ee'
                : '#f43f5e';
          this.tetherLeftCoreMat.color.set(hex);
          this.tetherLeftCoreMat.emissive.set(hex);
        }
        if (this.tetherRightCoreMat) {
          const hex =
            state.tether.rightSpin === null
              ? '#a78bfa'
              : state.tether.rightSpin > 0
                ? '#22d3ee'
                : '#f43f5e';
          this.tetherRightCoreMat.color.set(hex);
          this.tetherRightCoreMat.emissive.set(hex);
        }
      }
    }

    // 4. Mode 3: Schrodinger Box & H/X/Z Gate Cubes
    if (isSchrodinger) {
      const sch = state.schrodinger;
      if (lidEntity?.object3D) {
        if (this.queries.boxLidHeld.entities.has(lidEntity)) {
          if (lidEntity.object3D.position.y - dy > 1.12 && sch.boxClosed) {
            labController.toggleObserveBox(false);
          }
        } else {
          if (sch.boxClosed) {
            this.tmpTarget.set(dx, 1.052 + dy, -0.56 + dz);
            lidEntity.object3D.position.lerp(this.tmpTarget, Math.min(1, delta * 10));
            lidEntity.object3D.rotation.x += (0 - lidEntity.object3D.rotation.x) * Math.min(1, delta * 10);
          } else {
            this.tmpTarget.set(dx, 1.22 + dy, -0.68 + dz);
            lidEntity.object3D.position.lerp(this.tmpTarget, Math.min(1, delta * 10));
            lidEntity.object3D.rotation.x += (-0.52 - lidEntity.object3D.rotation.x) * Math.min(1, delta * 10);
          }
        }
      }

      this.tmpVec.set(SCHRODINGER_DOCK_POS.x + dx, SCHRODINGER_DOCK_POS.y + dy, SCHRODINGER_DOCK_POS.z + dz);
      for (const gateEnt of this.queries.gates.entities) {
        const obj = gateEnt.object3D;
        if (!obj) continue;
        const g = gateEnt.getValue(GateCubeMarker, 'gate') as QuantumGateType;
        if (this.queries.gatesHeld.entities.has(gateEnt)) {
          obj.getWorldPosition(this.tmpTarget);
          if (this.tmpTarget.distanceTo(this.tmpVec) < 0.17 && this.gateSnapCooldown <= 0) {
            this.gateSnapCooldown = 0.55;
            if (g === 'H' || g === 'X' || g === 'Z') {
              labController.applyGate(g);
              this.pulseControllers(0.42, 50);
            }
          }
        } else {
          const home = g === 'H' ? GATE_H_HOME : g === 'X' ? GATE_X_HOME : GATE_Z_HOME;
          const popLift =
            labController.gateFlashTimer > 0 && labController.lastAppliedGate === g ? 0.026 : 0;
          this.tmpTarget.set(home.x * sx + dx, home.y + dy + popLift, home.z + dz);
          obj.position.lerp(this.tmpTarget, Math.min(1, delta * 11));
        }
      }

      const probAwake = sch.alpha * sch.alpha;
      const probAsleep = sch.beta * sch.beta;
      if (this.awakeOrb && this.awakeMat) {
        this.awakeOrb.rotation.y = time * 1.4;
        const showAwake = sch.boxClosed ? probAwake > 0.01 : sch.observedState === 'awake';
        this.awakeOrb.visible = showAwake;
        const sc = sch.boxClosed ? 0.55 + probAwake * 0.65 : 1.18;
        this.awakeOrb.scale.setScalar(sc);
        this.awakeMat.opacity = sch.boxClosed ? 0.25 + probAwake * 0.65 : 0.96;
      }
      if (this.asleepOrb && this.asleepMat) {
        this.asleepOrb.rotation.y = -time * 1.2;
        const showAsleep = sch.boxClosed ? probAsleep > 0.01 : sch.observedState === 'asleep';
        this.asleepOrb.visible = showAsleep;
        const sc = sch.boxClosed ? 0.55 + probAsleep * 0.65 : 1.18;
        this.asleepOrb.scale.setScalar(sc);
        this.asleepMat.opacity = sch.boxClosed ? 0.25 + probAsleep * 0.65 : 0.96;
      }
      if (this.gateDockRingMat) {
        this.gateDockRingMat.emissiveIntensity =
          labController.gateFlashTimer > 0 ? 2.1 : 0.85;
      }
    }

    // 5. Mode 4: Double-Slit Probe, Shutter, Filters, Roomscale Wave & Thrown Photons
    if (isDoubleSlit) {
      if (probeEntity?.object3D) {
        const isHeld = this.queries.probeHeld.entities.has(probeEntity);
        if (isHeld) {
          labController.probeAutoControlled = false;
          probeEntity.object3D.getWorldPosition(this.tmpVec);
          this.tmpTarget.set(SLIT_A_SENSOR_POS.x + dx, SLIT_A_SENSOR_POS.y + dy, SLIT_A_SENSOR_POS.z + dz);
          const nearSlit = this.tmpVec.distanceTo(this.tmpTarget) < 0.16;
          if (nearSlit !== state.whichPathDetector) {
            labController.setWhichPathDetector(nearSlit, true);
          }
        } else {
          const baseTarget = state.whichPathDetector ? ACTIVE_PROBE_POS : STANDBY_PROBE_POS;
          this.tmpTarget.set(baseTarget.x + dx, baseTarget.y + dy, baseTarget.z + dz);
          probeEntity.object3D.position.lerp(this.tmpTarget, Math.min(1, delta * 7));
        }

        const probeColor = state.whichPathDetector ? '#f59e0b' : '#22d3ee';
        this.tmpColor.set(probeColor);
        if (this.probeTipMat) {
          this.probeTipMat.color.copy(this.tmpColor);
          this.probeTipMat.emissive.copy(this.tmpColor);
          this.probeTipMat.emissiveIntensity = state.whichPathDetector ? 1.8 : 0.95;
        }
        if (this.probeBeaconMat) {
          this.probeBeaconMat.color.copy(this.tmpColor);
          this.probeBeaconMat.emissive.copy(this.tmpColor);
        }
      }

      if (shutterEntity?.object3D) {
        const heldShutter = this.queries.shutterHeld.entities.has(shutterEntity);
        if (heldShutter) {
          const curY = shutterEntity.object3D.position.y - dy;
          const nextMode = curY < 1.03 ? 'single' : 'both';
          if (nextMode !== state.slitMode) {
            labController.setSlitMode(nextMode);
          }
        } else {
          const targetY = (state.slitMode === 'single' ? 0.98 : 1.085) + dy;
          this.tmpTarget.set(-0.08 + dx, targetY, -0.56 + dz);
          shutterEntity.object3D.position.lerp(this.tmpTarget, Math.min(1, delta * 10));
        }
        shutterEntity.setValue(SlitShutterMarker, 'closed', state.slitMode === 'single');
      }

      this.tmpVec.set(LASER_APERTURE_POS.x + dx, LASER_APERTURE_POS.y + dy, LASER_APERTURE_POS.z + dz);
      for (const filterEnt of this.queries.filters.entities) {
        const obj = filterEnt.object3D;
        if (!obj) continue;
        const nm = filterEnt.getValue(FilterCrystalMarker, 'wavelengthNm') as WavelengthNm;
        const isHeld = this.queries.filtersHeld.entities.has(filterEnt);
        if (isHeld) {
          obj.getWorldPosition(this.tmpTarget);
          if (this.tmpTarget.distanceTo(this.tmpVec) < 0.14 && state.wavelengthNm !== nm) {
            labController.setWavelength(nm);
          }
        } else {
          const homeX = nm === 650 ? -0.35 : nm === 532 ? -0.29 : -0.23;
          const activeLift = state.wavelengthNm === nm ? 0.014 : 0;
          this.tmpTarget.set(homeX + dx, 0.888 + dy + activeLift, -0.38 + dz);
          obj.position.lerp(this.tmpTarget, Math.min(1, delta * 8));
        }
      }

      this.tmpColor.set(wavelengthColorHex(state.wavelengthNm));
      if (this.laserLensMat) {
        this.laserLensMat.color.copy(this.tmpColor);
        this.laserLensMat.emissive.copy(this.tmpColor);
      }
      if (this.laserBeamMat) {
        this.laserBeamMat.color.copy(this.tmpColor);
        this.laserBeamMat.emissive.copy(this.tmpColor);
        this.laserBeamMat.emissiveIntensity =
          1.35 + (labController.pulseBurstTimer > 0 ? 0.9 : 0);
      }
      if (this.screenGroup) {
        const targetScreenX = 0.22 + ((state.screenDistanceScale ?? 1.0) - 0.75) * 0.21;
        this.screenGroup.position.x +=
          (targetScreenX - this.screenGroup.position.x) * Math.min(1, delta * 8);
      }
      if (this.slitCollar) this.slitCollar.visible = state.whichPathDetector;
      if (this.slitCollarMat) {
        this.slitCollarMat.emissive.set('#f59e0b');
        this.slitCollarMat.emissiveIntensity = 1.4 + 0.4 * Math.sin(time * 5);
      }

      const waveSpeed = state.wavelengthNm === 430 ? 0.85 : state.wavelengthNm === 532 ? 0.72 : 0.6;
      const coherentBoost = state.slitMode === 'both' && !state.whichPathDetector ? 1 : 0.4;
      for (let i = 0; i < this.waveArcs.length; i += 1) {
        const arc = this.waveArcs[i];
        const phase = (time * waveSpeed + i / this.waveArcs.length) % 1;
        arc.position.x = 0.03 + phase * 0.29;
        const scale = 0.65 + phase * 1.45;
        arc.scale.set(scale, scale, 1);
        const mat = this.waveArcMats[i];
        if (mat) {
          mat.color.copy(this.tmpColor);
          mat.emissive.copy(this.tmpColor);
          mat.opacity = (1 - phase) * 0.65 * coherentBoost;
        }
      }

      // Roomscale living-room 3D floor interference wave surface
      if (state.roomscaleWave && this.roomWavePosAttr) {
        const attr = this.roomWavePosAttr;
        const arr = attr.array as Float32Array;
        const k = state.wavelengthNm === 430 ? 11.5 : state.wavelengthNm === 532 ? 9.2 : 7.4;
        const slitOffsetZ = 0.26 * (state.slitSeparationMm / 0.48);
        const coh = state.whichPathDetector || state.slitMode === 'single' ? 0 : 1;
        for (let i = 0; i < attr.count; i += 1) {
          const x = arr[i * 3];
          const y = arr[i * 3 + 1]; // plane local X/Y becomes floor X/Z
          const dx = x + 0.75;
          const r1 = Math.hypot(dx, y - slitOffsetZ);
          const r2 = Math.hypot(dx, y + slitOffsetZ);
          const w1 = Math.sin(k * r1 - time * 5.2) / (1 + r1 * 0.85);
          const w2 = coh > 0 ? Math.sin(k * r2 - time * 5.2) / (1 + r2 * 0.85) : 0;
          arr[i * 3 + 2] = (w1 + w2) * 0.048;
        }
        attr.needsUpdate = true;
        if (this.roomWaveMat) {
          this.roomWaveMat.color.copy(this.tmpColor);
          this.roomWaveMat.emissive.copy(this.tmpColor);
        }
      }

      // Thrown photon packet projectile animation
      if (labController.throwPhotonSeq !== this.lastThrowSeq) {
        const slot = this.lastThrowSeq % this.thrownPhotonPool.length;
        this.lastThrowSeq = labController.throwPhotonSeq;
        this.thrownPhotonProgress[slot] = 0;
        this.thrownPhotonMats[slot].color.copy(this.tmpColor);
        this.thrownPhotonMats[slot].emissive.copy(this.tmpColor);
      }
      for (let i = 0; i < this.thrownPhotonPool.length; i += 1) {
        const prog = this.thrownPhotonProgress[i];
        const mesh = this.thrownPhotonPool[i];
        if (prog < 1) {
          const next = Math.min(1, prog + delta * 1.75);
          this.thrownPhotonProgress[i] = next;
          mesh.visible = true;
          const xPos = -0.32 + next * 0.54 + dx;
          const arcY = 0.992 + dy + Math.sin(next * Math.PI) * 0.08;
          mesh.position.set(xPos, arcY, -0.56 + dz);
        } else {
          mesh.visible = false;
        }
      }
    } else {
      for (let i = 0; i < this.thrownPhotonPool.length; i += 1) {
        this.thrownPhotonPool[i].visible = false;
      }
    }

    // 6. Mode 5: Bell Entanglement dials & flying pair pulses
    if (isEntanglement) {
      if (this.eprCrystal) this.eprCrystal.rotation.y = time * 1.1;

      for (const dialEnt of this.queries.dials.entities) {
        const obj = dialEnt.object3D;
        if (!obj) continue;
        const station = dialEnt.getValue(AnalyzerDialMarker, 'station');
        const isAlice = station !== 'bob';
        obj.position.set((isAlice ? -0.34 : 0.34) * sx + dx, 1.005 + dy, -0.56 + dz);

        if (this.queries.dialsHeld.entities.has(dialEnt)) {
          this.tmpEuler.setFromQuaternion(obj.quaternion, 'XYZ');
          const snapped = snapAngleDeg(this.tmpEuler.x);
          if (isAlice && snapped !== state.aliceAngleDeg) {
            labController.setAnalyzerAngles(snapped, state.bobAngleDeg);
          } else if (!isAlice && snapped !== state.bobAngleDeg) {
            labController.setAnalyzerAngles(state.aliceAngleDeg, snapped);
          }
        } else {
          const targetRad =
            ((isAlice ? state.aliceAngleDeg : state.bobAngleDeg) * Math.PI) / 180;
          obj.rotation.x += (targetRad - obj.rotation.x) * Math.min(1, delta * 9);
        }
      }

      const flyT = labController.pairFlyPhase;
      const flying = flyT < 1;
      if (this.pulseAlice) {
        this.pulseAlice.visible = flying;
        this.pulseAlice.position.x = -0.34 * flyT;
      }
      if (this.pulseBob) {
        this.pulseBob.visible = flying;
        this.pulseBob.position.x = 0.34 * flyT;
      }

      if (this.aliceLampMat) {
        const hex = state.lastOutcomeA === -1 ? '#f43f5e' : '#22d3ee';
        this.aliceLampMat.color.set(hex);
        this.aliceLampMat.emissive.set(hex);
        this.aliceLampMat.emissiveIntensity = flyT > 0.85 ? 1.5 : 0.7;
      }
      if (this.bobLampMat) {
        const hex = state.lastOutcomeB === -1 ? '#f43f5e' : '#22d3ee';
        this.bobLampMat.color.set(hex);
        this.bobLampMat.emissive.set(hex);
        this.bobLampMat.emissiveIntensity = flyT > 0.85 ? 1.5 : 0.7;
      }
    }

    // 7. Bouncing 3D Gaming Onboarding Arrow pointing straight at next active target
    const arrowEntity = this.queries.guideArrow.entities.values().next().value;
    if (arrowEntity?.object3D) {
      const arrowObj = arrowEntity.object3D;
      arrowObj.visible = onboarding.visible;
      if (onboarding.visible) {
        const tgt = onboarding.target;
        let usesBenchOffset = true;
        if (tgt === 'crates') {
          if (state.bombPuzzle.slotCrate === 'alpha') {
            this.tmpTarget.set(CRATE_BETA_HOME.x * sx, 1.01 + dy, CRATE_BETA_HOME.z);
          } else {
            this.tmpTarget.set(CRATE_ALPHA_HOME.x * sx, 1.01 + dy, CRATE_ALPHA_HOME.z);
          }
        } else if (tgt === 'bs2_out') {
          this.tmpTarget.set(BS2_OUT_POS.x * sx, 1.01 + dy, BS2_OUT_POS.z);
        } else if (tgt === 'bs2_socket') {
          this.tmpTarget.set(BS2_IN_POS.x, 1.01 + dy, BS2_IN_POS.z);
        } else if (tgt === 'bomb_slot') {
          this.tmpTarget.set(BOMB_SLOT_POS.x, 1.01 + dy, BOMB_SLOT_POS.z);
        } else if (tgt === 'bomb_fire') {
          this.tmpTarget.set(-0.34, 1.0 + dy, -0.45);
        } else if (tgt === 'bomb_dark') {
          this.tmpTarget.set(0.21, 1.02 + dy, -0.745);
        } else if (tgt === 'bomb_next') {
          this.tmpTarget.set(-0.36, 1.06 + dy, -0.74);
        } else if (tgt === 'tether_orbs' || tgt === 'tether_shake') {
          usesBenchOffset = false;
          const leftEnt = this.queries.tetherOrbs.entities.values().next().value;
          if (leftEnt?.object3D) {
            leftEnt.object3D.getWorldPosition(this.tmpTarget);
            this.tmpTarget.y += 0.11;
          } else {
            this.tmpTarget.set(-0.18 + dx, 1.11 + dy, -0.48 + dz);
          }
        } else if (tgt === 'gates') {
          this.tmpTarget.set(GATE_Z_HOME.x * sx, 0.99 + dy, GATE_Z_HOME.z);
        } else if (tgt === 'gate_dock') {
          this.tmpTarget.set(SCHRODINGER_DOCK_POS.x, 0.98 + dy, SCHRODINGER_DOCK_POS.z);
        } else if (tgt === 'box_lid') {
          this.tmpTarget.set(0, 1.07 + dy, -0.44);
        } else if (tgt === 'probe') {
          this.tmpTarget.set(STANDBY_PROBE_POS.x, 1.06 + dy, STANDBY_PROBE_POS.z);
        } else if (tgt === 'slit_a') {
          this.tmpTarget.set(SLIT_A_SENSOR_POS.x, 1.09 + dy, SLIT_A_SENSOR_POS.z);
        } else if (tgt === 'roomscale') {
          this.tmpTarget.set(0.22, 1.16 + dy, -0.56);
        } else if (tgt === 'dials') {
          this.tmpTarget.set(0.34 * sx, 1.13 + dy, -0.56);
        }
        if (usesBenchOffset) {
          this.tmpTarget.x += dx;
          this.tmpTarget.z += dz;
        }

        this.tmpTarget.y += Math.sin(time * 5.4) * 0.024;
        arrowObj.position.lerp(this.tmpTarget, Math.min(1, delta * 14));
        arrowObj.rotation.y = time * 1.4;
        if (this.guideArrowHalo) {
          this.guideArrowHalo.scale.setScalar(0.88 + blink * 0.35);
        }
        if (this.guideArrowConeMat) {
          this.guideArrowConeMat.color.set(onboarding.accentHex);
          this.guideArrowConeMat.emissive.set(onboarding.accentHex);
          this.guideArrowConeMat.emissiveIntensity = 1.4 + blink * 1.2;
        }
        if (this.guideArrowHaloMat) {
          this.guideArrowHaloMat.color.set(onboarding.accentHex);
          this.guideArrowHaloMat.emissive.set(onboarding.accentHex);
        }
      }
    }

    // 7b. Floating 3D Arrow Controller/Action Card + Event "Why?" Popup
    if (this.guideTooltipMesh) {
      this.guideTooltipMesh.visible = onboarding.visible && Boolean(arrowEntity?.object3D);
      if (this.guideTooltipMesh.visible && arrowEntity?.object3D) {
        const ax = arrowEntity.object3D.position.x;
        const ay = arrowEntity.object3D.position.y;
        const az = arrowEntity.object3D.position.z;
        // Keep arrow tooltip inside safe Quest 3 viewport and clearly below lab-panel without edge clipping
        let cardX = Math.max(dx - 0.21, Math.min(dx + 0.21, ax));
        if (ay >= 1.05 + dy && Math.abs(ax - dx) < 0.22) {
          cardX = ax >= dx ? dx + 0.26 : dx - 0.26;
        }
        const cardY = ay >= 1.05 + dy ? ay + 0.12 : Math.max(1.155 + dy, ay + 0.13);
        const cardZ = Math.min(-0.58 + dz, az);
        this.tmpVec.set(cardX, cardY, cardZ);
        this.guideTooltipMesh.position.lerp(this.tmpVec, Math.min(1, delta * 14));
        this.world.camera.getWorldPosition(this.tmpVecB);
        this.guideTooltipMesh.lookAt(this.tmpVecB.x, this.guideTooltipMesh.position.y + 0.06, this.tmpVecB.z);
      }
    }

    if (this.lastEventSeq !== labController.eventSeq) {
      this.lastEventSeq = labController.eventSeq;
      this.eventPopupAge = 0;
      this.renderEventPopupTexture();
    }
    if (this.eventPopupMesh) {
      const showPopup = labController.eventTimer > 0;
      this.eventPopupMesh.visible = showPopup;
      if (showPopup) {
        this.eventPopupAge += delta;
        const pop =
          this.eventPopupAge < 0.22
            ? 0.65 + (this.eventPopupAge / 0.22) * 0.42
            : Math.max(1.0, 1.07 - Math.min(1, (this.eventPopupAge - 0.22) / 0.18) * 0.07);
        const fade = labController.eventTimer < 0.5 ? Math.max(0.05, labController.eventTimer / 0.5) : 0.96;
        const liftY = Math.min(0.025, this.eventPopupAge * 0.08);
        this.eventPopupMesh.scale.setScalar(pop);
        this.eventPopupMat.opacity = fade;
        this.eventPopupMesh.position.set(dx, 1.565 + dy * 0.85 + liftY, -0.74 + dz);
        this.world.camera.getWorldPosition(this.tmpVecB);
        this.eventPopupMesh.lookAt(this.tmpVecB.x, this.eventPopupMesh.position.y + 0.05, this.tmpVecB.z);
      }
    }

    // 8. Redraw dynamic 2D canvas display textures when state changes
    if (labController.visualDirty || this.lastScreenRev !== labController.stateRevision) {
      if (isDoubleSlit) {
        this.renderPhosphorTexture();
      } else if (isEntanglement) {
        this.renderBellTexture();
      }
      this.renderGuideTooltipTexture();
      labController.visualDirty = false;
      this.lastScreenRev = labController.stateRevision;
    }
  }
}
