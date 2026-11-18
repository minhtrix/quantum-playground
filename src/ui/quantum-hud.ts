import { VisibilityState, type World } from '@iwsdk/core';
import { labController } from '../simulation/lab-controller.js';
import { computeOnboardingHint, getBombMissionControls, type ExperimentMode } from '../simulation/quantum-physics.js';

export function mountQuantumHud(world: World): () => void {
  const existing = document.getElementById('qp-hud-root');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'qp-hud-root';
  root.innerHTML = `
    <style>
      #qp-hud-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        font-family: Inter, system-ui, -apple-system, sans-serif;
        color: #f8fafc;
        z-index: 20;
      }
      .qp-top-bar {
        position: absolute;
        top: 12px;
        left: 14px;
        right: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }
      .qp-left-pill {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(9, 15, 29, 0.78);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        padding: 5px 8px;
      }
      .qp-mode-tabs {
        display: flex;
        gap: 4px;
      }
      .qp-tab {
        background: transparent;
        border: 1px solid transparent;
        color: #94a3b8;
        border-radius: 999px;
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .qp-tab:hover {
        color: #f8fafc;
      }
      .qp-tab.active {
        background: rgba(2, 132, 199, 0.36);
        border-color: rgba(56, 189, 248, 0.65);
        color: #ffffff;
      }
      .qp-score-pill {
        font-size: 11px;
        font-weight: 800;
        color: #34d399;
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(52, 211, 153, 0.32);
        border-radius: 999px;
        padding: 3px 9px;
        white-space: nowrap;
      }
      .qp-cta-banner {
        position: absolute;
        top: 54px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(9, 15, 29, 0.88);
        backdrop-filter: blur(10px);
        border: 1.5px solid #fbbf24;
        box-shadow: 0 0 22px rgba(251, 191, 36, 0.28);
        border-radius: 999px;
        padding: 6px 14px;
        max-width: 90vw;
      }
      .qp-cta-tag {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #090f1d;
        background: #fbbf24;
        border-radius: 999px;
        padding: 2px 8px;
        white-space: nowrap;
      }
      .qp-cta-text {
        font-size: 12.5px;
        font-weight: 700;
        color: #f8fafc;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .qp-demo-link {
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(148, 163, 184, 0.26);
        color: #cbd5e1;
        border-radius: 999px;
        padding: 5px 11px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .qp-demo-link:hover {
        border-color: #38bdf8;
        color: #ffffff;
      }
      .qp-bottom-dock {
        position: absolute;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        pointer-events: auto;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        background: rgba(9, 15, 29, 0.82);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        padding: 6px 10px;
        max-width: 96vw;
        overflow-x: auto;
      }
      .qp-btn {
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.28);
        color: #f8fafc;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .qp-btn:hover {
        border-color: #38bdf8;
        background: rgba(15, 39, 68, 0.95);
      }
      .qp-btn-primary {
        background: linear-gradient(135deg, #0284c7, #2563eb);
        border-color: #38bdf8;
      }
      .qp-btn-cta {
        background: linear-gradient(135deg, #d97706, #f59e0b);
        border-color: #fde047;
        color: #090f1d;
        font-weight: 800;
      }
      .qp-btn[hidden] { display: none; }
      .qp-btn:disabled { cursor: default; opacity: 0.68; }
      @media (max-width: 720px) {
        .qp-cta-banner { top: 58px; }
        .qp-cta-text { font-size: 11px; }
      }
    </style>

    <div class="qp-top-bar">
      <div class="qp-left-pill">
        <div class="qp-mode-tabs">
          <button type="button" class="qp-tab" data-mode="bomb_puzzle" data-testid="tab-bomb_puzzle">Bomb</button>
          <button type="button" class="qp-tab" data-mode="tether" data-testid="tab-tether">Tether</button>
          <button type="button" class="qp-tab" data-mode="schrodinger" data-testid="tab-schrodinger">Box</button>
          <button type="button" class="qp-tab" data-mode="double_slit" data-testid="tab-double_slit">Slits</button>
          <button type="button" class="qp-tab" data-mode="entanglement" data-testid="tab-entanglement">Bell</button>
        </div>
        <span id="qp-score-pill" class="qp-score-pill">0 PTS</span>
      </div>
    </div>

    <div id="qp-cta-banner" class="qp-cta-banner" role="status">
      <span id="qp-cta-tag" class="qp-cta-tag">1 / 3 - REFERENCE</span>
      <span id="qp-cta-text" class="qp-cta-text">Find a hidden bomb. Test the empty rig first.</span>
    </div>

    <div class="qp-bottom-dock">
      <button id="qp-enter-xr" class="qp-btn qp-btn-primary" type="button" data-testid="btn-enter-xr">Enter MR</button>
      <button id="qp-act-1" class="qp-btn" type="button" data-testid="btn-act-1">Action 1</button>
      <button id="qp-act-2" class="qp-btn" type="button" data-testid="btn-act-2">Action 2</button>
      <button id="qp-quarantine-btn" class="qp-btn" type="button" data-testid="btn-quarantine" hidden>Quarantine</button>
      <button id="qp-act-3" class="qp-btn" type="button" data-testid="btn-act-3">Action 3</button>
      <button id="qp-reset-btn" class="qp-btn" type="button" data-testid="btn-reset">Reset</button>
      <button id="qp-table-btn" class="qp-demo-link" type="button" title="Simulate narrow vs wide table layout">Table: Std</button>
      <button id="qp-demo-btn" class="qp-demo-link" type="button">Demo Guide</button>
    </div>
  `;

  document.body.appendChild(root);

  const scorePill = document.getElementById('qp-score-pill')!;
  const ctaBanner = document.getElementById('qp-cta-banner')!;
  const ctaTag = document.getElementById('qp-cta-tag')!;
  const ctaText = document.getElementById('qp-cta-text')!;

  const enterXrBtn = document.getElementById('qp-enter-xr') as HTMLButtonElement;
  const act1Btn = document.getElementById('qp-act-1') as HTMLButtonElement;
  const act2Btn = document.getElementById('qp-act-2') as HTMLButtonElement;
  const quarantineBtn = document.getElementById('qp-quarantine-btn') as HTMLButtonElement;
  const act3Btn = document.getElementById('qp-act-3') as HTMLButtonElement;
  const resetBtn = document.getElementById('qp-reset-btn') as HTMLButtonElement;
  const tableBtn = document.getElementById('qp-table-btn') as HTMLButtonElement;
  const demoBtn = document.getElementById('qp-demo-btn') as HTMLButtonElement;

  const modeTabs = root.querySelectorAll<HTMLButtonElement>('.qp-tab');
  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const m = tab.getAttribute('data-mode') as ExperimentMode | null;
      if (m) labController.setExperiment(m);
    });
  });

  enterXrBtn.addEventListener('click', () => world.launchXR());
  tableBtn.addEventListener('click', () => labController.cycleTableLayoutProfile());
  quarantineBtn.addEventListener('click', () => labController.quarantineCrate());
  demoBtn.addEventListener('click', () => {
    window.open('./demo.html', '_blank', 'noopener,noreferrer');
  });

  act1Btn.addEventListener('click', () => {
    const exp = labController.state.experiment;
    if (exp === 'bomb_puzzle') labController.performBombMissionAction();
    else if (exp === 'tether') labController.nudgeTetherDistance(0.45);
    else if (exp === 'schrodinger') labController.applyGate('Z');
    else if (exp === 'double_slit') labController.toggleWhichPathDetector();
    else labController.cycleAliceAngle();
  });

  act2Btn.addEventListener('click', () => {
    const exp = labController.state.experiment;
    if (exp === 'bomb_puzzle') labController.selectAlternateBombCrate();
    else if (exp === 'tether') labController.triggerTetherCollapse();
    else if (exp === 'schrodinger') labController.applyGate('H');
    else if (exp === 'double_slit') labController.toggleRoomscaleWave();
    else labController.cycleBobAngle();
  });

  act3Btn.addEventListener('click', () => {
    const exp = labController.state.experiment;
    if (exp === 'bomb_puzzle') return;
    if (exp === 'tether') labController.toggleTetherMode();
    else if (exp === 'schrodinger') labController.toggleObserveBox();
    else if (exp === 'double_slit') labController.triggerThrowPhoton();
    else labController.stepNextChshSetting();
  });

  resetBtn.addEventListener('click', () => labController.resetCurrentExperiment());

  const syncHud = () => {
    const s = labController.state;
    const isBomb = s.experiment === 'bomb_puzzle';
    const hint = computeOnboardingHint(s, labController.holdingKind, labController.bombInFlight);

    if (isBomb) {
      const bp = s.bombPuzzle;
      const left = bp.maxProbes > 0 ? Math.max(0, bp.maxProbes - bp.crateProbesFired) : 0;
      scorePill.textContent = bp.training
        ? 'CASE 1/3 · TRAINING'
        : `CASE ${bp.round} · ${left} SHOTS · ${s.score} PTS`;
    } else {
      scorePill.textContent = s.streak > 0 ? `${s.score} PTS • ${s.streak}x` : `${s.score} PTS`;
    }
    const widthNote = labController.detectedTableWidthM
      ? `${labController.detectedTableWidthM.toFixed(2)}m`
      : '';
    tableBtn.textContent =
      labController.tableLayoutProfile === 'compact'
        ? `Table: Narrow${widthNote ? ' (' + widthNote + ')' : ''}`
        : labController.tableLayoutProfile === 'wide'
          ? `Table: Wide${widthNote ? ' (' + widthNote + ')' : ''}`
          : `Table: Std${widthNote ? ' (' + widthNote + ')' : ''}`;
    act3Btn.hidden = isBomb;
    resetBtn.hidden = isBomb;
    act1Btn.disabled = isBomb && labController.bombInFlight;
    ctaTag.textContent = hint.stepTag;
    ctaTag.style.background = hint.accentHex;
    ctaBanner.style.borderColor = hint.accentHex;
    ctaText.textContent = hint.ctaText;

    modeTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-mode') === s.experiment);
    });

    act2Btn.hidden = false;
    quarantineBtn.hidden = true;
    if (isBomb) {
      const controls = getBombMissionControls(s.bombPuzzle, labController.bombInFlight);
      act1Btn.textContent = controls.primary;
      act1Btn.className = 'qp-btn qp-btn-cta';
      act2Btn.hidden = !controls.alternate;
      act2Btn.textContent = controls.alternate;
      act2Btn.className = 'qp-btn';
      quarantineBtn.hidden = !controls.canQuarantine;
      quarantineBtn.textContent = 'Quarantine';
    } else if (s.experiment === 'tether') {
      const t = s.tether;
      act1Btn.textContent = `Spread (${t.distanceM.toFixed(1)}m)`;
      act1Btn.className = 'qp-btn';
      act2Btn.textContent = 'Collapse!';
      act2Btn.className = t.collapses === 0 ? 'qp-btn qp-btn-cta' : 'qp-btn';
      act3Btn.textContent = t.mode === 'correlated' ? '|Phi+>' : '|Psi->';
      act3Btn.className = 'qp-btn';
      resetBtn.textContent = 'Reset';
    } else if (s.experiment === 'schrodinger') {
      const sch = s.schrodinger;
      act1Btn.textContent = 'Gate Z';
      act1Btn.className = 'qp-btn';
      act2Btn.textContent = 'Gate H';
      act2Btn.className = 'qp-btn';
      act3Btn.textContent = sch.boxClosed ? 'Open Lid' : 'Close Lid';
      act3Btn.className = sch.boxClosed && sch.appliedGates.length >= 2 ? 'qp-btn qp-btn-cta' : 'qp-btn';
      resetBtn.textContent = 'Reset Box';
    } else if (s.experiment === 'double_slit') {
      act1Btn.textContent = `Probe: ${s.whichPathDetector ? 'ON' : 'OFF'}`;
      act1Btn.className = !s.whichPathDetector ? 'qp-btn qp-btn-cta' : 'qp-btn';
      act2Btn.textContent = `Room: ${s.roomscaleWave ? 'ON' : 'OFF'}`;
      act2Btn.className = s.whichPathDetector && !s.roomscaleWave ? 'qp-btn qp-btn-cta' : 'qp-btn';
      act3Btn.textContent = 'Throw Photon';
      act3Btn.className = 'qp-btn';
      resetBtn.textContent = 'Reset';
    } else {
      act1Btn.textContent = `Alice: ${s.aliceAngleDeg} deg`;
      act1Btn.className = 'qp-btn';
      act2Btn.textContent = `Bob: ${s.bobAngleDeg} deg`;
      act2Btn.className = 'qp-btn';
      act3Btn.textContent = `CHSH (${Object.keys(s.chshCells).length}/4)`;
      act3Btn.className = s.chshWitnessS === null ? 'qp-btn qp-btn-cta' : 'qp-btn';
      resetBtn.textContent = 'Reset';
    }
  };

  const offState = labController.subscribe(syncHud);
  const offVis = world.visibilityState.subscribe((vis) => {
    root.style.display = vis === VisibilityState.NonImmersive ? 'block' : 'none';
  });
  syncHud();

  return () => {
    offState();
    offVis();
    root.remove();
  };
}
