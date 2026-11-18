import {
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
} from '@iwsdk/core';

const benchDeckMat = new MeshStandardMaterial({
  color: '#111827',
  roughness: 0.42,
  metalness: 0.58,
});

const benchTrimMat = new MeshStandardMaterial({
  color: '#334155',
  roughness: 0.28,
  metalness: 0.85,
});

const cyanAccentMat = new MeshStandardMaterial({
  color: '#22d3ee',
  emissive: '#0ea5e9',
  emissiveIntensity: 0.9,
  roughness: 0.25,
  metalness: 0.3,
});

const brassMountMat = new MeshStandardMaterial({
  color: '#d4a656',
  roughness: 0.3,
  metalness: 0.86,
});

const darkHousingMat = new MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.45,
  metalness: 0.65,
});

const slitBarrierMat = new MeshStandardMaterial({
  color: '#0f172a',
  roughness: 0.5,
  metalness: 0.7,
});

const phosphorBackMat = new MeshStandardMaterial({
  color: '#0b1220',
  roughness: 0.35,
  metalness: 0.5,
});

const phosphorSurfaceMat = new MeshStandardMaterial({
  color: '#08111f',
  emissive: '#0b2239',
  emissiveIntensity: 0.45,
  roughness: 0.25,
  metalness: 0.1,
});

const laserBeamBaseMat = new MeshStandardMaterial({
  color: '#2ef299',
  emissive: '#2ef299',
  emissiveIntensity: 1.5,
  transparent: true,
  opacity: 0.72,
  roughness: 0.15,
});

const waveArcBaseMat = new MeshStandardMaterial({
  color: '#2ef299',
  emissive: '#2ef299',
  emissiveIntensity: 1.15,
  transparent: true,
  opacity: 0.55,
  side: 2,
  roughness: 0.2,
});

const eprCrystalMat = new MeshStandardMaterial({
  color: '#a78bfa',
  emissive: '#7c3aed',
  emissiveIntensity: 1.25,
  roughness: 0.18,
  metalness: 0.25,
});

function createHardwarePlaque(
  name: string,
  width: number,
  height: number,
  title: string,
  subtitle: string,
  accentHex: string,
  bgHex = '#09111f',
): Group {
  const plaque = new Group();
  plaque.name = `${name}Group`;

  const backing = new Mesh(new BoxGeometry(width, height, 0.004), darkHousingMat);
  backing.name = `${name}Backing`;
  backing.position.z = -0.002;
  plaque.add(backing);

  let faceMat: MeshStandardMaterial;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = subtitle ? 128 : 96;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 8;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (subtitle) {
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText(title, canvas.width / 2, canvas.height * 0.38);
        ctx.fillStyle = accentHex;
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.76);
      } else {
        ctx.font = 'bold 62px sans-serif';
        ctx.fillText(title, canvas.width / 2, canvas.height * 0.52);
      }
      const tex = new CanvasTexture(canvas);
      tex.colorSpace = SRGBColorSpace;
      faceMat = new MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: '#ffffff',
        emissiveIntensity: 0.72,
        roughness: 0.35,
        metalness: 0.05,
      });
    } else {
      faceMat = new MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.5 });
    }
  } else {
    faceMat = new MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.5 });
  }

  const face = new Mesh(new PlaneGeometry(width * 0.96, height * 0.92), faceMat);
  face.name = `${name}Face`;
  face.position.z = 0.0006;
  plaque.add(face);
  return plaque;
}

const orbCoreMat = new MeshStandardMaterial({
  color: '#38bdf8',
  emissive: '#2563eb',
  emissiveIntensity: 1.3,
  roughness: 0.2,
  metalness: 0.35,
});

/**
 * Precision optical breadboard tabletop centered at local y = 0 (deck top sits at y = 0).
 */
export function createOpticalBench(): Group {
  const root = new Group();
  root.name = 'QuantumOpticalBench';

  const slab = new Mesh(new BoxGeometry(0.96, 0.042, 0.48), benchDeckMat);
  slab.name = 'BenchBreadboardSlab';
  slab.position.set(0, -0.021, 0);
  slab.receiveShadow = true;
  slab.castShadow = true;
  root.add(slab);

  const plinthSkirt = new Mesh(new BoxGeometry(0.90, 0.036, 0.42), darkHousingMat);
  plinthSkirt.name = 'BenchSubFrame';
  plinthSkirt.position.set(0, -0.06, 0);
  plinthSkirt.castShadow = true;
  root.add(plinthSkirt);

  const railGeo = new BoxGeometry(0.98, 0.012, 0.016);
  const railFront = new Mesh(railGeo, benchTrimMat);
  railFront.name = 'BenchRailFront';
  railFront.position.set(0, 0.004, 0.232);
  root.add(railFront);

  const railBack = new Mesh(railGeo, benchTrimMat);
  railBack.name = 'BenchRailBack';
  railBack.position.set(0, 0.004, -0.232);
  root.add(railBack);

  const trimGlow = new Mesh(new BoxGeometry(0.94, 0.005, 0.008), cyanAccentMat);
  trimGlow.name = 'BenchGlowStrip';
  trimGlow.position.set(0, -0.002, 0.242);
  root.add(trimGlow);

  const opticalTrack = new Mesh(new BoxGeometry(0.84, 0.004, 0.026), benchTrimMat);
  opticalTrack.name = 'BenchOpticalTrack';
  opticalTrack.position.set(0, 0.002, -0.02);
  root.add(opticalTrack);

  // Brass corner armor bumpers for sci-fi optical hardware silhouette
  const cornerCoords: Array<[number, number]> = [
    [-0.47, -0.23],
    [0.47, -0.23],
    [-0.47, 0.23],
    [0.47, 0.23],
  ];
  cornerCoords.forEach(([cx, cz], idx) => {
    const bumper = new Mesh(new BoxGeometry(0.032, 0.05, 0.032), brassMountMat);
    bumper.name = `BenchCornerBumper_${idx}`;
    bumper.position.set(cx, -0.019, cz);
    root.add(bumper);
  });

  return root;
}

/**
 * Grabbable front carry handle attached to the optical bench edge so users can freely move the lab onto a real table.
 */
export function createBenchAnchorHandle(): Group {
  const root = new Group();
  root.name = 'BenchAnchorGrabHandle';

  const leftArm = new Mesh(new BoxGeometry(0.014, 0.014, 0.038), brassMountMat);
  leftArm.name = 'AnchorHandleArmLeft';
  leftArm.position.set(-0.072, 0, -0.01);
  root.add(leftArm);

  const rightArm = new Mesh(new BoxGeometry(0.014, 0.014, 0.038), brassMountMat);
  rightArm.name = 'AnchorHandleArmRight';
  rightArm.position.set(0.072, 0, -0.01);
  root.add(rightArm);

  const gripBar = new Mesh(new CylinderGeometry(0.011, 0.011, 0.16, 16), darkHousingMat);
  gripBar.name = 'AnchorHandleGripBar';
  gripBar.rotation.z = Math.PI / 2;
  gripBar.position.set(0, 0, 0.008);
  root.add(gripBar);

  const glowRing = new Mesh(new CylinderGeometry(0.0125, 0.0125, 0.06, 16), cyanAccentMat);
  glowRing.name = 'AnchorHandleGlowBand';
  glowRing.rotation.z = Math.PI / 2;
  glowRing.position.set(0, 0, 0.008);
  root.add(glowRing);

  return root;
}

/**
 * Double-slit interferometer rig resting flush on the bench at y = 0.
 * Beam travels left-to-right onto an angled face-on phosphor screen.
 */
export function createDoubleSlitRig(): Group {
  const root = new Group();
  root.name = 'DoubleSlitRig';

  const dockPad = new Mesh(
    new CylinderGeometry(0.052, 0.058, 0.008, 24),
    benchTrimMat,
  );
  dockPad.name = 'ProbeStandbyPad';
  dockPad.position.set(-0.14, 0.004, 0.14);
  root.add(dockPad);

  const dockRing = new Mesh(new RingGeometry(0.036, 0.044, 24), cyanAccentMat);
  dockRing.name = 'ProbeStandbyRing';
  dockRing.rotation.x = -Math.PI / 2;
  dockRing.position.set(-0.14, 0.009, 0.14);
  root.add(dockRing);

  const filterRack = new Mesh(new BoxGeometry(0.20, 0.008, 0.052), benchTrimMat);
  filterRack.name = 'LaserFilterTray';
  filterRack.position.set(-0.29, 0.004, 0.16);
  root.add(filterRack);

  // 1) Laser Emitter Station (left)
  const laserGroup = new Group();
  laserGroup.name = 'LaserEmitterGroup';
  laserGroup.position.set(-0.37, 0, -0.02);

  const laserBase = new Mesh(new BoxGeometry(0.095, 0.022, 0.095), brassMountMat);
  laserBase.name = 'LaserMountBase';
  laserBase.position.y = 0.011;
  laserGroup.add(laserBase);

  const laserPillar = new Mesh(
    new CylinderGeometry(0.018, 0.022, 0.085, 16),
    benchTrimMat,
  );
  laserPillar.name = 'LaserMountPillar';
  laserPillar.position.y = 0.062;
  laserGroup.add(laserPillar);

  const laserBody = new Mesh(
    new CylinderGeometry(0.026, 0.028, 0.13, 20),
    darkHousingMat,
  );
  laserBody.name = 'LaserBarrel';
  laserBody.rotation.z = Math.PI / 2;
  laserBody.position.set(0, 0.112, 0);
  laserBody.castShadow = true;
  laserGroup.add(laserBody);

  for (let i = 0; i < 3; i += 1) {
    const fin = new Mesh(new TorusGeometry(0.028, 0.004, 8, 20), brassMountMat);
    fin.name = `LaserCoolFin_${i}`;
    fin.rotation.y = Math.PI / 2;
    fin.position.set(-0.03 + i * 0.03, 0.112, 0);
    laserGroup.add(fin);
  }

  const laserNozzle = new Mesh(
    new CylinderGeometry(0.018, 0.022, 0.024, 16),
    brassMountMat,
  );
  laserNozzle.name = 'LaserApertureCollar';
  laserNozzle.rotation.z = Math.PI / 2;
  laserNozzle.position.set(0.072, 0.112, 0);
  laserGroup.add(laserNozzle);

  const laserLens = new Mesh(new SphereGeometry(0.012, 16, 12), laserBeamBaseMat);
  laserLens.name = 'LaserApertureLens';
  laserLens.position.set(0.082, 0.112, 0);
  laserGroup.add(laserLens);

  const beamCore = new Mesh(
    new CylinderGeometry(0.0055, 0.0055, 0.21, 12),
    laserBeamBaseMat,
  );
  beamCore.name = 'LaserBeamCore';
  beamCore.rotation.z = Math.PI / 2;
  beamCore.position.set(0.186, 0.112, 0);
  laserGroup.add(beamCore);

  root.add(laserGroup);

  // 2) Dual-Slit Mask Station (center-left)
  const slitGroup = new Group();
  slitGroup.name = 'SlitBarrierGroup';
  slitGroup.position.set(-0.08, 0, -0.02);

  const slitBase = new Mesh(new BoxGeometry(0.06, 0.02, 0.19), brassMountMat);
  slitBase.name = 'SlitMountBase';
  slitBase.position.y = 0.01;
  slitGroup.add(slitBase);

  // Barrier panels creating two clean vertical apertures along Z
  const backWing = new Mesh(new BoxGeometry(0.014, 0.175, 0.058), slitBarrierMat);
  backWing.name = 'SlitBackWing';
  backWing.position.set(0, 0.107, -0.056);
  slitGroup.add(backWing);

  const centerSeptum = new Mesh(new BoxGeometry(0.014, 0.175, 0.022), slitBarrierMat);
  centerSeptum.name = 'SlitCenterDivider';
  centerSeptum.position.set(0, 0.107, 0);
  slitGroup.add(centerSeptum);

  const frontWing = new Mesh(new BoxGeometry(0.014, 0.175, 0.058), slitBarrierMat);
  frontWing.name = 'SlitFrontWing';
  frontWing.position.set(0, 0.107, 0.056);
  slitGroup.add(frontWing);

  // Sensor collar at front slit A (glows amber when Which-Path detector is ON)
  const detectorCollar = new Mesh(
    new TorusGeometry(0.024, 0.004, 12, 24),
    cyanAccentMat,
  );
  detectorCollar.name = 'SlitDetectorCollar';
  detectorCollar.rotation.y = Math.PI / 2;
  detectorCollar.position.set(0.006, 0.112, 0.02);
  detectorCollar.visible = false;
  slitGroup.add(detectorCollar);

  root.add(slitGroup);

  // 3) Wavefront Propagation Arcs (slits -> screen)
  const waveGroup = new Group();
  waveGroup.name = 'WaveFieldGroup';
  waveGroup.position.set(-0.06, 0.112, -0.02);

  for (let i = 0; i < 6; i += 1) {
    const arc = new Mesh(
      new RingGeometry(0.042, 0.048, 24, 1, -0.52, 1.04),
      waveArcBaseMat,
    );
    arc.name = `WaveArc_${i}`;
    arc.rotation.x = -Math.PI / 2;
    arc.position.set(0.055 * (i + 1), 0, 0);
    waveGroup.add(arc);
  }
  root.add(waveGroup);

  // 4) Angled Phosphor Screen Station (right, tilted toward viewer so face is readable)
  const screenGroup = new Group();
  screenGroup.name = 'PhosphorScreenGroup';
  screenGroup.position.set(0.28, 0, -0.01);
  screenGroup.rotation.y = -0.68;

  const screenPedestal = new Mesh(
    new BoxGeometry(0.36, 0.024, 0.09),
    brassMountMat,
  );
  screenPedestal.name = 'ScreenMountBase';
  screenPedestal.position.y = 0.012;
  screenGroup.add(screenPedestal);

  const screenFrame = new Mesh(
    new BoxGeometry(0.39, 0.23, 0.022),
    phosphorBackMat,
  );
  screenFrame.name = 'ScreenHousingFrame';
  screenFrame.position.set(0, 0.135, 0);
  screenFrame.castShadow = true;
  screenGroup.add(screenFrame);

  const phosphorScreen = new Mesh(
    new PlaneGeometry(0.36, 0.20),
    phosphorSurfaceMat,
  );
  phosphorScreen.name = 'PhosphorScreenDisplay';
  phosphorScreen.position.set(0, 0.135, 0.013);
  screenGroup.add(phosphorScreen);

  root.add(screenGroup);

  return root;
}

/**
 * Grabbable & clickable Which-Path Quantum Probe.
 */
export function createDetectorProbe(): Group {
  const root = new Group();
  root.name = 'WhichPathProbe';

  const handle = new Mesh(
    new CylinderGeometry(0.017, 0.02, 0.088, 18),
    darkHousingMat,
  );
  handle.name = 'ProbeGrip';
  handle.position.y = 0.044;
  handle.castShadow = true;
  root.add(handle);

  const collar = new Mesh(
    new CylinderGeometry(0.021, 0.019, 0.018, 18),
    brassMountMat,
  );
  collar.name = 'ProbeBrassCollar';
  collar.position.y = 0.094;
  root.add(collar);

  const tip = new Mesh(
    new OctahedronGeometry(0.02, 0),
    cyanAccentMat,
  );
  tip.name = 'ProbeSensorTip';
  tip.position.y = 0.12;
  root.add(tip);

  const halo = new Mesh(
    new TorusGeometry(0.028, 0.0035, 10, 24),
    cyanAccentMat,
  );
  halo.name = 'ProbeBeaconRing';
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.12;
  root.add(halo);

  return root;
}

/**
 * Entanglement EPR crystal source + Alice & Bob rotatable analyzer dials + correlation readout billboard.
 */
export function createEntanglementRig(): Group {
  const root = new Group();
  root.name = 'EntanglementRig';

  // Central EPR Source
  const sourceBase = new Mesh(
    new CylinderGeometry(0.055, 0.065, 0.028, 24),
    brassMountMat,
  );
  sourceBase.name = 'EPRSourceBase';
  sourceBase.position.set(0, 0.014, -0.02);
  root.add(sourceBase);

  const cradleRing = new Mesh(
    new TorusGeometry(0.048, 0.005, 12, 28),
    benchTrimMat,
  );
  cradleRing.name = 'EPRSourceCradle';
  cradleRing.position.set(0, 0.115, -0.02);
  root.add(cradleRing);

  const eprCrystal = new Mesh(new OctahedronGeometry(0.032, 0), eprCrystalMat);
  eprCrystal.name = 'EPRSourceCrystal';
  eprCrystal.position.set(0, 0.115, -0.02);
  root.add(eprCrystal);

  // Entangled twin photon beams & flying pulses
  const pulseGeo = new SphereGeometry(0.015, 14, 10);
  const pulseA = new Mesh(pulseGeo, cyanAccentMat);
  pulseA.name = 'EntangledPulseAlice';
  pulseA.position.set(-0.08, 0.115, -0.02);
  root.add(pulseA);

  const pulseB = new Mesh(pulseGeo, cyanAccentMat);
  pulseB.name = 'EntangledPulseBob';
  pulseB.position.set(0.08, 0.115, -0.02);
  root.add(pulseB);

  // Helper to build symmetrical Alice / Bob analyzer pedestals (dials are separate interactive entities)
  const buildAnalyzerStation = (label: 'Alice' | 'Bob', xPos: number) => {
    const station = new Group();
    station.name = `${label}AnalyzerStation`;
    station.position.set(xPos, 0, -0.02);

    const base = new Mesh(new BoxGeometry(0.11, 0.024, 0.11), brassMountMat);
    base.name = `${label}StationBase`;
    base.position.y = 0.012;
    station.add(base);

    const post = new Mesh(
      new CylinderGeometry(0.014, 0.018, 0.088, 16),
      benchTrimMat,
    );
    post.name = `${label}StationPost`;
    post.position.y = 0.068;
    station.add(post);

    const outcomeLamp = new Mesh(
      new SphereGeometry(0.02, 16, 12),
      cyanAccentMat,
    );
    outcomeLamp.name = `${label}OutcomeLamp`;
    outcomeLamp.position.set(0, 0.21, 0);
    station.add(outcomeLamp);

    return station;
  };

  root.add(buildAnalyzerStation('Alice', -0.34));
  root.add(buildAnalyzerStation('Bob', 0.34));

  // Center-back correlation telemetry plate (system paints CanvasTexture onto BellTelemetryScreen)
  const displayFrame = new Mesh(
    new BoxGeometry(0.40, 0.16, 0.018),
    phosphorBackMat,
  );
  displayFrame.name = 'BellTelemetryFrame';
  displayFrame.position.set(0, 0.24, -0.14);
  root.add(displayFrame);

  const displayFace = new Mesh(
    new PlaneGeometry(0.37, 0.135),
    phosphorSurfaceMat,
  );
  displayFace.name = 'BellTelemetryScreen';
  displayFace.position.set(0, 0.24, -0.13);
  root.add(displayFace);

  return root;
}

/**
 * Bouncing 3D Neon Gaming Onboarding Arrow pointing down at the next interactive object or socket.
 */
export function createGuideArrow(): Group {
  const root = new Group();
  root.name = 'OnboardingGuideArrow';

  const arrowMat = new MeshStandardMaterial({
    color: '#fde047',
    emissive: '#fbbf24',
    emissiveIntensity: 1.9,
    roughness: 0.18,
    metalness: 0.15,
  });

  // Downward pointing arrowhead (tip sits cleanly at local y = 0.0)
  const cone = new Mesh(new ConeGeometry(0.028, 0.052, 16), arrowMat);
  cone.name = 'GuideArrowTipCone';
  cone.rotation.x = Math.PI;
  cone.position.y = 0.026;
  root.add(cone);

  const shaft = new Mesh(new CylinderGeometry(0.011, 0.011, 0.055, 14), arrowMat);
  shaft.name = 'GuideArrowShaft';
  shaft.position.y = 0.078;
  root.add(shaft);

  const halo = new Mesh(
    new TorusGeometry(0.042, 0.004, 10, 28),
    new MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#38bdf8',
      emissiveIntensity: 1.8,
    }),
  );
  halo.name = 'GuideArrowHaloRing';
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.005;
  root.add(halo);

  return root;
}

/**
 * Grabbable & rotatable optical polarizer wheel centered at its ring axis.
 */
export function createAnalyzerDial(label: 'Alice' | 'Bob'): Group {
  const root = new Group();
  root.name = `${label}PolarizerDial`;

  const outerRing = new Mesh(
    new TorusGeometry(0.056, 0.0085, 14, 30),
    darkHousingMat,
  );
  outerRing.name = `${label}DialRing`;
  outerRing.rotation.y = Math.PI / 2;
  root.add(outerRing);

  const brassRim = new Mesh(
    new TorusGeometry(0.061, 0.003, 10, 30),
    brassMountMat,
  );
  brassRim.name = `${label}DialBrassTrim`;
  brassRim.rotation.y = Math.PI / 2;
  root.add(brassRim);

  const polBar = new Mesh(new BoxGeometry(0.012, 0.102, 0.011), cyanAccentMat);
  polBar.name = `${label}PolarizerAxisBar`;
  root.add(polBar);

  return root;
}

/**
 * Tactile slit shutter with top brass grip handle; slides vertically over Slit B.
 */
export function createSlitShutter(): Group {
  const root = new Group();
  root.name = 'SingleSlitShutterEntity';

  const plate = new Mesh(new BoxGeometry(0.02, 0.09, 0.022), brassMountMat);
  plate.name = 'ShutterGatePlate';
  plate.position.y = 0.045;
  root.add(plate);

  const cap = new Mesh(new CylinderGeometry(0.014, 0.014, 0.012, 16), cyanAccentMat);
  cap.name = 'ShutterHandleKnob';
  cap.position.y = 0.098;
  root.add(cap);

  return root;
}

/**
 * Clickable / grabbable wavelength filter crystal resting in the bench filter tray.
 */
export function createFilterCrystal(wavelengthNm: 430 | 532 | 650): Group {
  const hex =
    wavelengthNm === 430 ? '#4dc8ff' : wavelengthNm === 532 ? '#2ef299' : '#ff4d6d';
  const root = new Group();
  root.name = `FilterCrystal_${wavelengthNm}`;

  const pedestal = new Mesh(
    new CylinderGeometry(0.017, 0.02, 0.012, 14),
    brassMountMat,
  );
  pedestal.name = `FilterBase_${wavelengthNm}`;
  pedestal.position.y = 0.006;
  root.add(pedestal);

  const gemMat = new MeshStandardMaterial({
    color: hex,
    emissive: hex,
    emissiveIntensity: 1.25,
    roughness: 0.16,
    metalness: 0.15,
  });
  const gem = new Mesh(new CylinderGeometry(0.012, 0.012, 0.036, 6), gemMat);
  gem.name = `FilterPrism_${wavelengthNm}`;
  gem.position.y = 0.03;
  gem.castShadow = true;
  root.add(gem);

  return root;
}

const opticGlassMat = new MeshStandardMaterial({
  color: '#7dd3fc',
  emissive: '#0284c7',
  emissiveIntensity: 0.45,
  transparent: true,
  opacity: 0.52,
  roughness: 0.08,
  metalness: 0.25,
  side: 2,
});

const safeGreenMat = new MeshStandardMaterial({
  color: '#34d399',
  emissive: '#10b981',
  emissiveIntensity: 0.9,
  roughness: 0.22,
  metalness: 0.2,
});

const darkAmberMat = new MeshStandardMaterial({
  color: '#fbbf24',
  emissive: '#d97706',
  emissiveIntensity: 0.7,
  roughness: 0.22,
  metalness: 0.25,
});

const bombDangerMat = new MeshStandardMaterial({
  color: '#fb7185',
  emissive: '#e11d48',
  emissiveIntensity: 1.0,
  roughness: 0.2,
  metalness: 0.3,
});

/**
 * Mach-Zehnder Quantum Bomb Tester rig (BS1 -> Upper Test Arm / Lower Ref Arm -> BS2 -> D0 / D1).
 */
export function createBombRig(): Group {
  const root = new Group();
  root.name = 'QuantumBombInterferometerRig';

  // Single-photon pulsed launcher (left front)
  const sourceBase = new Mesh(new BoxGeometry(0.08, 0.02, 0.08), brassMountMat);
  sourceBase.name = 'BombSourceBase';
  sourceBase.position.set(-0.36, 0.01, 0.09);
  root.add(sourceBase);

  const sourceTube = new Mesh(
    new CylinderGeometry(0.02, 0.022, 0.09, 16),
    darkHousingMat,
  );
  sourceTube.name = 'BombSourceBarrel';
  sourceTube.rotation.z = Math.PI / 2;
  sourceTube.position.set(-0.35, 0.068, 0.09);
  root.add(sourceTube);

  const sourceNozzle = new Mesh(
    new CylinderGeometry(0.012, 0.014, 0.016, 14),
    cyanAccentMat,
  );
  sourceNozzle.name = 'BombSourceAperture';
  sourceNozzle.rotation.z = Math.PI / 2;
  sourceNozzle.position.set(-0.30, 0.068, 0.09);
  root.add(sourceNozzle);

  // Corner optical posts: BS1 (-0.20, 0.09), M1 (-0.20, -0.11), M2 (0.21, 0.09), BS2 mount (0.21, -0.11)
  const corners: Array<[string, number, number]> = [
    ['BS1Mount', -0.20, 0.09],
    ['MirrorM1Mount', -0.20, -0.11],
    ['MirrorM2Mount', 0.21, 0.09],
    ['BS2SocketMount', 0.21, -0.11],
  ];
  for (const [name, cx, cz] of corners) {
    const pad = new Mesh(new CylinderGeometry(0.028, 0.032, 0.012, 16), benchTrimMat);
    pad.name = `${name}Pad`;
    pad.position.set(cx, 0.006, cz);
    root.add(pad);
  }

  // Glowing cyan socket target ring around BS2 corner mount so removed BS2 is unmistakable
  const bs2SocketRing = new Mesh(new RingGeometry(0.031, 0.044, 24), cyanAccentMat.clone());
  bs2SocketRing.name = 'BombBS2SocketRing';
  bs2SocketRing.rotation.x = -Math.PI / 2;
  bs2SocketRing.position.set(0.21, 0.013, -0.11);
  root.add(bs2SocketRing);

  const bs2Plaque = createHardwarePlaque('BombBS2Plaque', 0.068, 0.026, 'BS2', '', '#22d3ee');
  bs2Plaque.rotation.x = -Math.PI / 2;
  bs2Plaque.position.set(0.21, 0.004, -0.055);
  root.add(bs2Plaque);

  const bs1Plate = new Mesh(new BoxGeometry(0.052, 0.062, 0.008), opticGlassMat);
  bs1Plate.name = 'BombBS1Plate';
  bs1Plate.position.set(-0.20, 0.062, 0.09);
  bs1Plate.rotation.y = Math.PI / 4;
  root.add(bs1Plate);

  const m1Plate = new Mesh(new BoxGeometry(0.052, 0.062, 0.01), brassMountMat);
  m1Plate.name = 'BombMirrorM1Plate';
  m1Plate.position.set(-0.20, 0.062, -0.11);
  m1Plate.rotation.y = Math.PI / 4;
  root.add(m1Plate);

  const m2Plate = new Mesh(new BoxGeometry(0.052, 0.062, 0.01), brassMountMat);
  m2Plate.name = 'BombMirrorM2Plate';
  m2Plate.position.set(0.21, 0.062, 0.09);
  m2Plate.rotation.y = Math.PI / 4;
  root.add(m2Plate);

  // Test Crate Socket (Upper arm midpoint [0.01, 0.01, -0.11])
  const socketBase = new Mesh(new BoxGeometry(0.116, 0.012, 0.116), darkHousingMat);
  socketBase.name = 'BombTestSocketPad';
  socketBase.position.set(0.01, 0.006, -0.11);
  root.add(socketBase);

  const socketRing = new Mesh(new RingGeometry(0.052, 0.066, 28), darkAmberMat);
  socketRing.name = 'BombTestSocketRing';
  socketRing.rotation.x = -Math.PI / 2;
  socketRing.position.set(0.01, 0.013, -0.11);
  root.add(socketRing);

  const slotPlaque = createHardwarePlaque('BombSlotPlaque', 0.088, 0.032, 'SLOT', 'DROP CRATE', '#fbbf24');
  slotPlaque.rotation.x = -Math.PI / 3;
  slotPlaque.position.set(0.01, 0.015, -0.028);
  root.add(slotPlaque);

  // Optional pi phase-shifter gate on Lower->BS2 segment ([0.21, 0.062, -0.01])
  const phasePlate = new Mesh(
    new BoxGeometry(0.048, 0.054, 0.012),
    new MeshStandardMaterial({
      color: '#a78bfa',
      emissive: '#7c3aed',
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.45,
      roughness: 0.15,
    }),
  );
  phasePlate.name = 'BombPhasePiPlate';
  phasePlate.position.set(0.21, 0.058, -0.01);
  root.add(phasePlate);

  // Output Detector D1 (Safe port: right of BS2 at [0.36, 0.062, -0.11])
  const d1Body = new Mesh(new BoxGeometry(0.056, 0.072, 0.056), darkHousingMat);
  d1Body.name = 'BombDetectorD1Housing';
  d1Body.position.set(0.36, 0.036, -0.11);
  root.add(d1Body);

  const d1Lamp = new Mesh(new SphereGeometry(0.024, 16, 14), safeGreenMat.clone());
  d1Lamp.name = 'BombDetectorD1Lamp';
  d1Lamp.position.set(0.36, 0.088, -0.11);
  root.add(d1Lamp);

  const d1Plaque = createHardwarePlaque('BombDetectorD1Plaque', 0.078, 0.034, 'D1', 'SAFE / BOTH', '#4ade80');
  d1Plaque.position.set(0.36, 0.038, -0.079);
  root.add(d1Plaque);

  // Output Detector D0 (Dark port: back arm from BS2 at [0.21, 0.062, -0.20])
  const d0Body = new Mesh(new BoxGeometry(0.052, 0.066, 0.048), darkHousingMat);
  d0Body.name = 'BombDetectorD0Housing';
  d0Body.position.set(0.21, 0.033, -0.205);
  root.add(d0Body);

  const d0Lamp = new Mesh(new SphereGeometry(0.024, 16, 14), darkAmberMat.clone());
  d0Lamp.name = 'BombDetectorD0Lamp';
  d0Lamp.position.set(0.21, 0.082, -0.205);
  root.add(d0Lamp);

  const d0Plaque = createHardwarePlaque('BombDetectorD0Plaque', 0.082, 0.036, 'D0', 'PROOF', '#fbbf24');
  d0Plaque.rotation.x = -0.32;
  d0Plaque.position.set(0.21, 0.125, -0.202);
  root.add(d0Plaque);

  // Beam tracks along arms
  const makeArmBeam = (name: string, length: number, px: number, py: number, pz: number, rotY = 0) => {
    const beam = new Mesh(
      new CylinderGeometry(0.0045, 0.0045, length, 10),
      new MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#38bdf8',
        emissiveIntensity: 1.15,
        transparent: true,
        opacity: 0.45,
      }),
    );
    beam.name = name;
    beam.rotation.z = Math.PI / 2;
    beam.rotation.y = rotY;
    beam.position.set(px, py, pz);
    root.add(beam);
  };

  makeArmBeam('BombBeamFeed', 0.10, -0.25, 0.068, 0.09);
  makeArmBeam('BombBeamLowerX', 0.41, 0.005, 0.068, 0.09);
  makeArmBeam('BombBeamUpperX', 0.41, 0.005, 0.068, -0.11);
  makeArmBeam('BombBeamLeftZ', 0.20, -0.20, 0.068, -0.01, Math.PI / 2);
  makeArmBeam('BombBeamRightZ', 0.20, 0.21, 0.068, -0.01, Math.PI / 2);
  makeArmBeam('BombBeamToD1', 0.14, 0.285, 0.068, -0.11);
  makeArmBeam('BombBeamToD0', 0.09, 0.21, 0.068, -0.158, Math.PI / 2);

  // Explosion shockwave ring & probe photon VFX
  const shockRing = new Mesh(
    new TorusGeometry(0.075, 0.012, 12, 32),
    bombDangerMat.clone(),
  );
  shockRing.name = 'BombExplosionShockRing';
  shockRing.rotation.x = Math.PI / 2;
  shockRing.position.set(0.01, 0.065, -0.11);
  shockRing.visible = false;
  root.add(shockRing);

  const photonOrb = new Mesh(
    new SphereGeometry(0.015, 14, 12),
    new MeshStandardMaterial({
      color: '#facc15',
      emissive: '#fde047',
      emissiveIntensity: 2.0,
    }),
  );
  photonOrb.name = 'BombTravelPhoton';
  photonOrb.position.set(-0.30, 0.068, 0.09);
  photonOrb.visible = false;
  root.add(photonOrb);

  return root;
}

/**
 * Grabbable mystery test crate (Alpha = 1 stripe / Beta = 2 stripes) hiding either quartz glass or a live photon bomb.
 */
export function createMysteryCrate(crateId: 'alpha' | 'beta'): Group {
  const root = new Group();
  root.name = `MysteryCrate_${crateId}`;

  const accentHex = crateId === 'alpha' ? '#38bdf8' : '#f59e0b';
  const accentMat = new MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.0,
    roughness: 0.22,
    metalness: 0.35,
  });

  const chassis = new Mesh(new BoxGeometry(0.088, 0.076, 0.088), darkHousingMat);
  chassis.name = `CrateChassis_${crateId}`;
  chassis.position.y = 0.038;
  chassis.castShadow = true;
  root.add(chassis);

  const collar = new Mesh(new BoxGeometry(0.094, 0.016, 0.094), brassMountMat);
  collar.name = `CrateArmorCollar_${crateId}`;
  collar.position.y = 0.012;
  root.add(collar);

  const glassTop = new Mesh(new BoxGeometry(0.062, 0.014, 0.062), opticGlassMat);
  glassTop.name = `CrateViewport_${crateId}`;
  glassTop.position.y = 0.078;
  root.add(glassTop);

  // Tactile indicator bars on front and top so Alpha vs Beta are unmistakable at a glance
  const barCount = crateId === 'alpha' ? 1 : 2;
  for (let i = 0; i < barCount; i += 1) {
    const xOff = barCount === 1 ? 0 : i === 0 ? -0.014 : 0.014;
    const topBar = new Mesh(new BoxGeometry(0.012, 0.008, 0.044), accentMat);
    topBar.name = `CrateTopBar_${crateId}_${i}`;
    topBar.position.set(xOff, 0.087, 0);
    root.add(topBar);

    const frontBar = new Mesh(new BoxGeometry(0.012, 0.044, 0.008), accentMat);
    frontBar.name = `CrateFrontBar_${crateId}_${i}`;
    frontBar.position.set(xOff, 0.04, 0.046);
    root.add(frontBar);
  }

  const crateLetter = crateId === 'alpha' ? 'A' : 'B';
  const frontPlaque = createHardwarePlaque(
    `CratePlaqueFront_${crateId}`,
    0.056,
    0.034,
    crateLetter,
    'CRATE',
    accentHex,
  );
  frontPlaque.position.set(0, 0.042, 0.052);
  root.add(frontPlaque);

  const topPlaque = createHardwarePlaque(
    `CratePlaqueTop_${crateId}`,
    0.054,
    0.028,
    crateLetter,
    '',
    accentHex,
  );
  topPlaque.rotation.x = -Math.PI / 2;
  topPlaque.position.set(0, 0.092, 0);
  root.add(topPlaque);

  return root;
}

/**
 * Removable BS2 dichroic beam-splitter cube prism for the Mach-Zehnder Bomb Interferometer.
 */
export function createBeamSplitterTile(): Group {
  const root = new Group();
  root.name = 'BombBS2BeamSplitter';

  const foot = new Mesh(new BoxGeometry(0.076, 0.016, 0.076), brassMountMat);
  foot.name = 'BS2BaseFoot';
  foot.position.y = 0.008;
  foot.castShadow = true;
  root.add(foot);

  // Solid cemented cube housing makes near-hand pinch reliable on both hands while keeping diagonal vane visible
  const prismCube = new Mesh(
    new BoxGeometry(0.068, 0.068, 0.068),
    new MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.34,
      roughness: 0.12,
      metalness: 0.1,
    }),
  );
  prismCube.name = 'BS2PrismCube';
  prismCube.position.y = 0.05;
  root.add(prismCube);

  const vane = new Mesh(new BoxGeometry(0.064, 0.064, 0.008), opticGlassMat);
  vane.name = 'BS2GlassVane';
  vane.position.y = 0.05;
  vane.rotation.y = Math.PI / 4;
  root.add(vane);

  const rim = new Mesh(new BoxGeometry(0.072, 0.012, 0.072), cyanAccentMat);
  rim.name = 'BS2TopCap';
  rim.position.y = 0.09;
  root.add(rim);

  const capLabel = createHardwarePlaque('BS2CapLabel', 0.062, 0.028, 'BS2', '', '#22d3ee');
  capLabel.rotation.x = -Math.PI / 2;
  capLabel.position.set(0, 0.098, 0);
  root.add(capLabel);

  return root;
}

/**
 * Quantum Tether emitter base & live dynamically stretched entanglement filament between Left and Right orbs.
 */
export function createTetherRig(): Group {
  const root = new Group();
  root.name = 'QuantumTetherRig';

  const hub = new Mesh(new CylinderGeometry(0.056, 0.068, 0.022, 24), darkHousingMat);
  hub.name = 'TetherSourcePod';
  hub.position.set(0, 0.011, 0.04);
  root.add(hub);

  const crystal = new Mesh(new OctahedronGeometry(0.026, 0), eprCrystalMat);
  crystal.name = 'TetherSourceCrystal';
  crystal.position.set(0, 0.044, 0.04);
  root.add(crystal);

  // Dynamically positioned & oriented in QuantumLabSystem between tether-left and tether-right
  const filament = new Mesh(
    new CylinderGeometry(0.007, 0.007, 1.0, 12),
    new MeshStandardMaterial({
      color: '#a78bfa',
      emissive: '#7c3aed',
      emissiveIntensity: 1.45,
      transparent: true,
      opacity: 0.78,
    }),
  );
  filament.name = 'TetherPlasmaBeam';
  root.add(filament);

  const pulseOrb = new Mesh(
    new SphereGeometry(0.018, 12, 10),
    new MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#e0f2fe',
      emissiveIntensity: 2.0,
    }),
  );
  pulseOrb.name = 'TetherCollapsePulse';
  pulseOrb.visible = false;
  root.add(pulseOrb);

  return root;
}

/**
 * Free-floating entangled orb encapsulated in dual brass gimbal rings (Left or Right).
 */
export function createTetherOrb(side: 'left' | 'right'): Group {
  const root = new Group();
  root.name = `TetherEntangledOrb_${side}`;

  const coreMat = new MeshStandardMaterial({
    color: side === 'left' ? '#38bdf8' : '#a78bfa',
    emissive: side === 'left' ? '#0284c7' : '#7c3aed',
    emissiveIntensity: 1.4,
    roughness: 0.14,
    metalness: 0.2,
  });
  const core = new Mesh(new SphereGeometry(0.046, 20, 18), coreMat);
  core.name = `TetherOrbCore_${side}`;
  core.castShadow = true;
  root.add(core);

  const ringA = new Mesh(new TorusGeometry(0.058, 0.004, 10, 28), brassMountMat);
  ringA.name = `TetherOrbGimbalA_${side}`;
  ringA.rotation.x = 0.65;
  root.add(ringA);

  const ringB = new Mesh(new TorusGeometry(0.064, 0.0035, 10, 28), cyanAccentMat);
  ringB.name = `TetherOrbGimbalB_${side}`;
  ringB.rotation.y = 0.85;
  root.add(ringB);

  return root;
}

/**
 * Translucent quantum chamber holding simultaneous Awake |0> (gold) and Asleep |1> (indigo) superposition avatars.
 */
export function createSchrodingerRig(): Group {
  const root = new Group();
  root.name = 'SchrodingerSuperpositionChamber';

  const floorPlate = new Mesh(new BoxGeometry(0.24, 0.016, 0.22), darkHousingMat);
  floorPlate.name = 'SchrodingerBasePlate';
  floorPlate.position.set(0, 0.008, -0.02);
  root.add(floorPlate);

  // Corner brass struts forming open frame around translucent panes
  const strutGeo = new BoxGeometry(0.016, 0.16, 0.016);
  const corners: Array<[number, number]> = [
    [-0.11, -0.12],
    [0.11, -0.12],
    [-0.11, 0.08],
    [0.11, 0.08],
  ];
  corners.forEach(([sx, sz], idx) => {
    const strut = new Mesh(strutGeo, brassMountMat);
    strut.name = `SchrodingerStrut_${idx}`;
    strut.position.set(sx, 0.09, sz);
    root.add(strut);
  });

  // Translucent inspection walls
  const frontGlass = new Mesh(new BoxGeometry(0.21, 0.145, 0.006), opticGlassMat);
  frontGlass.name = 'SchrodingerFrontGlass';
  frontGlass.position.set(0, 0.09, 0.08);
  root.add(frontGlass);

  const backGlass = new Mesh(new BoxGeometry(0.21, 0.145, 0.006), opticGlassMat);
  backGlass.name = 'SchrodingerBackGlass';
  backGlass.position.set(0, 0.09, -0.12);
  root.add(backGlass);

  // Ghost state Awake |0>: Upright golden holographic quantum cat silhouette
  const awakeCatMat = new MeshStandardMaterial({
    color: '#fde047',
    emissive: '#f59e0b',
    emissiveIntensity: 1.45,
    transparent: true,
    opacity: 0.78,
    roughness: 0.15,
  });
  const awakeCat = new Group();
  awakeCat.name = 'SchrodingerAwakeState';
  awakeCat.position.set(-0.044, 0.064, -0.02);

  const awakeBody = new Mesh(new CylinderGeometry(0.018, 0.024, 0.044, 14), awakeCatMat);
  awakeBody.name = 'AwakeCatBody';
  awakeCat.add(awakeBody);

  const awakeHead = new Mesh(new SphereGeometry(0.019, 14, 12), awakeCatMat);
  awakeHead.name = 'AwakeCatHead';
  awakeHead.position.set(0, 0.032, 0.004);
  awakeCat.add(awakeHead);

  const awakeEarL = new Mesh(new ConeGeometry(0.007, 0.016, 8), awakeCatMat);
  awakeEarL.name = 'AwakeCatEarL';
  awakeEarL.position.set(-0.011, 0.052, 0.004);
  awakeEarL.rotation.z = 0.25;
  awakeCat.add(awakeEarL);

  const awakeEarR = new Mesh(new ConeGeometry(0.007, 0.016, 8), awakeCatMat);
  awakeEarR.name = 'AwakeCatEarR';
  awakeEarR.position.set(0.011, 0.052, 0.004);
  awakeEarR.rotation.z = -0.25;
  awakeCat.add(awakeEarR);

  const awakeTail = new Mesh(new TorusGeometry(0.02, 0.0038, 8, 16, Math.PI * 1.15), awakeCatMat);
  awakeTail.name = 'AwakeCatTail';
  awakeTail.position.set(0.016, -0.005, -0.012);
  awakeTail.rotation.y = Math.PI / 2;
  awakeCat.add(awakeTail);
  root.add(awakeCat);

  // Ghost state Asleep |1>: Curled sleeping indigo holographic quantum cat silhouette
  const asleepCatMat = new MeshStandardMaterial({
    color: '#a78bfa',
    emissive: '#6366f1',
    emissiveIntensity: 1.45,
    transparent: true,
    opacity: 0.78,
    roughness: 0.2,
  });
  const asleepCat = new Group();
  asleepCat.name = 'SchrodingerAsleepState';
  asleepCat.position.set(0.044, 0.048, -0.02);

  const asleepBody = new Mesh(new SphereGeometry(0.025, 14, 12), asleepCatMat);
  asleepBody.name = 'AsleepCatCurledBody';
  asleepBody.scale.set(1.2, 0.68, 1.0);
  asleepCat.add(asleepBody);

  const asleepHead = new Mesh(new SphereGeometry(0.016, 12, 10), asleepCatMat);
  asleepHead.name = 'AsleepCatHead';
  asleepHead.position.set(-0.016, 0.012, 0.014);
  asleepCat.add(asleepHead);

  const asleepEarL = new Mesh(new ConeGeometry(0.006, 0.012, 8), asleepCatMat);
  asleepEarL.name = 'AsleepCatEarL';
  asleepEarL.position.set(-0.022, 0.026, 0.014);
  asleepEarL.rotation.z = 0.65;
  asleepCat.add(asleepEarL);

  const asleepEarR = new Mesh(new ConeGeometry(0.006, 0.012, 8), asleepCatMat);
  asleepEarR.name = 'AsleepCatEarR';
  asleepEarR.position.set(-0.008, 0.026, 0.014);
  asleepEarR.rotation.z = 0.2;
  asleepCat.add(asleepEarR);

  const asleepTailRing = new Mesh(new TorusGeometry(0.016, 0.0032, 8, 18), asleepCatMat);
  asleepTailRing.name = 'AsleepCatHaloZ';
  asleepTailRing.rotation.x = Math.PI / 2;
  asleepTailRing.position.set(0.004, 0.05, 0);
  asleepCat.add(asleepTailRing);
  root.add(asleepCat);

  // Front magnetic gate socket pad
  const gatePad = new Mesh(new CylinderGeometry(0.046, 0.052, 0.01, 20), benchTrimMat);
  gatePad.name = 'SchrodingerGateDockPad';
  gatePad.position.set(0, 0.005, 0.145);
  root.add(gatePad);

  const gateRing = new Mesh(new RingGeometry(0.034, 0.044, 24), cyanAccentMat);
  gateRing.name = 'SchrodingerGateDockRing';
  gateRing.rotation.x = -Math.PI / 2;
  gateRing.position.set(0, 0.011, 0.145);
  root.add(gateRing);

  return root;
}

/**
 * Grabbable / clickable armored chamber lid that collapses Schrodinger's box when opened.
 */
export function createBoxLid(): Group {
  const root = new Group();
  root.name = 'SchrodingerChamberLid';

  const lidPlate = new Mesh(new BoxGeometry(0.244, 0.016, 0.224), darkHousingMat);
  lidPlate.name = 'BoxLidArmorPlate';
  lidPlate.castShadow = true;
  root.add(lidPlate);

  const lidTrim = new Mesh(new BoxGeometry(0.252, 0.008, 0.232), brassMountMat);
  lidTrim.name = 'BoxLidBrassRim';
  lidTrim.position.y = -0.006;
  root.add(lidTrim);

  const handle = new Mesh(new BoxGeometry(0.088, 0.016, 0.02), cyanAccentMat);
  handle.name = 'BoxLidGripHandle';
  handle.position.set(0, 0.018, 0.04);
  root.add(handle);

  return root;
}

/**
 * Sculpted physical Quantum Logic Gate cube ('H', 'X', or 'Z') with geometric 3D relief emblem.
 */
export function createGateCube(gate: 'H' | 'X' | 'Z'): Group {
  const root = new Group();
  root.name = `QuantumGateCube_${gate}`;

  const hex = gate === 'H' ? '#38bdf8' : gate === 'X' ? '#fb7185' : '#34d399';
  const emblemMat = new MeshStandardMaterial({
    color: hex,
    emissive: hex,
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.2,
  });

  const block = new Mesh(new BoxGeometry(0.052, 0.052, 0.052), darkHousingMat);
  block.name = `GateBlock_${gate}`;
  block.position.y = 0.026;
  block.castShadow = true;
  root.add(block);

  // Add recognizable 3D bar letter relief on top face (y = 0.054) AND front face (z = 0.028)
  const addGlyph = (parent: Group, namePrefix: string, isTop: boolean) => {
    const g = new Group();
    g.name = namePrefix;
    if (isTop) {
      g.position.set(0, 0.054, 0);
      g.rotation.x = -Math.PI / 2;
    } else {
      g.position.set(0, 0.026, 0.027);
    }
    if (gate === 'H') {
      const l = new Mesh(new BoxGeometry(0.008, 0.032, 0.005), emblemMat);
      l.name = `${namePrefix}_L`;
      l.position.x = -0.011;
      const r = new Mesh(new BoxGeometry(0.008, 0.032, 0.005), emblemMat);
      r.name = `${namePrefix}_R`;
      r.position.x = 0.011;
      const mid = new Mesh(new BoxGeometry(0.024, 0.008, 0.005), emblemMat);
      mid.name = `${namePrefix}_Mid`;
      g.add(l, r, mid);
    } else if (gate === 'X') {
      const d1 = new Mesh(new BoxGeometry(0.008, 0.038, 0.005), emblemMat);
      d1.name = `${namePrefix}_D1`;
      d1.rotation.z = Math.PI / 4;
      const d2 = new Mesh(new BoxGeometry(0.008, 0.038, 0.005), emblemMat);
      d2.name = `${namePrefix}_D2`;
      d2.rotation.z = -Math.PI / 4;
      g.add(d1, d2);
    } else {
      const top = new Mesh(new BoxGeometry(0.03, 0.008, 0.005), emblemMat);
      top.name = `${namePrefix}_T`;
      top.position.y = 0.012;
      const bot = new Mesh(new BoxGeometry(0.03, 0.008, 0.005), emblemMat);
      bot.name = `${namePrefix}_B`;
      bot.position.y = -0.012;
      const diag = new Mesh(new BoxGeometry(0.008, 0.034, 0.005), emblemMat);
      diag.name = `${namePrefix}_Diag`;
      diag.rotation.z = -Math.PI / 4;
      g.add(top, bot, diag);
    }
    parent.add(g);
  };

  addGlyph(root, `GateGlyphTop_${gate}`, true);
  addGlyph(root, `GateGlyphFront_${gate}`, false);

  return root;
}

/**
 * Roomscale 3D interference wave surface for living-room double-slit wave visualization.
 */
export function createRoomWaveField(): Group {
  const root = new Group();
  root.name = 'RoomscaleInterferenceWaveField';

  const waveGeo = new PlaneGeometry(2.8, 2.2, 44, 34);
  const waveMat = new MeshStandardMaterial({
    color: '#2ef299',
    emissive: '#0ea5e9',
    emissiveIntensity: 0.9,
    wireframe: true,
    transparent: true,
    opacity: 0.62,
    side: 2,
    depthWrite: false,
  });
  const mesh = new Mesh(waveGeo, waveMat);
  mesh.name = 'RoomWaveRippleSurface';
  mesh.rotation.x = -Math.PI / 2;
  root.add(mesh);

  return root;
}

