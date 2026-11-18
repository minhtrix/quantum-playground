import { createSystem, UIKit, UIKitMLAsset, VisibilityState } from '@iwsdk/core';
import { labController } from '../simulation/lab-controller.js';
import { computeOnboardingHint, getBombMissionControls } from '../simulation/quantum-physics.js';

const fitAscii = (raw: string, maxLen: number): string => {
  const clean = raw.replace(/[^\x20-\x7e]/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3).trimEnd()}...`;
};

export class LabPanelSystem extends createSystem({}) {
  private scoreBadge: UIKit.Text | null = null;
  private modeTitle: UIKit.Text | null = null;
  private ctaTag: UIKit.Text | null = null;
  private ctaText: UIKit.Text | null = null;

  private lblTabBomb: UIKit.Text | null = null;
  private lblTabTether: UIKit.Text | null = null;
  private lblTabBox: UIKit.Text | null = null;
  private lblTabSlits: UIKit.Text | null = null;
  private lblTabBell: UIKit.Text | null = null;

  private lblAct1: UIKit.Text | null = null;
  private lblAct2: UIKit.Text | null = null;
  private lblAct3: UIKit.Text | null = null;
  private lblResetLab: UIKit.Text | null = null;

  init(): void {
    const panel = this.world.getSceneObject<UIKitMLAsset>('lab-panel');
    if (!panel) return;

    this.scoreBadge = panel.getElementById<UIKit.Text>('panel-score-badge') ?? null;
    this.modeTitle = panel.getElementById<UIKit.Text>('panel-mode-title') ?? null;
    this.ctaTag = panel.getElementById<UIKit.Text>('panel-cta-tag') ?? null;
    this.ctaText = panel.getElementById<UIKit.Text>('panel-cta-text') ?? null;

    this.lblTabBomb = panel.getElementById<UIKit.Text>('lbl-tab-bomb') ?? null;
    this.lblTabTether = panel.getElementById<UIKit.Text>('lbl-tab-tether') ?? null;
    this.lblTabBox = panel.getElementById<UIKit.Text>('lbl-tab-box') ?? null;
    this.lblTabSlits = panel.getElementById<UIKit.Text>('lbl-tab-slits') ?? null;
    this.lblTabBell = panel.getElementById<UIKit.Text>('lbl-tab-bell') ?? null;

    this.lblAct1 = panel.getElementById<UIKit.Text>('lbl-act-1') ?? null;
    this.lblAct2 = panel.getElementById<UIKit.Text>('lbl-act-2') ?? null;
    this.lblAct3 = panel.getElementById<UIKit.Text>('lbl-act-3') ?? null;
    this.lblResetLab = panel.getElementById<UIKit.Text>('lbl-reset-lab') ?? null;

    const missionRow = panel.getElementById('mission-actions');
    const missionPrimary = panel.getElementById('bomb-primary');
    const missionAlternate = panel.getElementById('bomb-alternate');
    const missionQuarantine = panel.getElementById('bomb-quarantine');
    const missionPrimaryLabel = panel.getElementById<UIKit.Text>('lbl-bomb-primary');
    const missionAlternateLabel = panel.getElementById<UIKit.Text>('lbl-bomb-alternate');
    const missionQuarantineLabel = panel.getElementById<UIKit.Text>('lbl-bomb-quarantine');
    const experimentTop = panel.getElementById('experiment-actions-top');
    const experimentBottom = panel.getElementById('experiment-actions-bottom');
    const resultCard = panel.getElementById('mission-result');

    const bindClick = (id: string, fn: () => void) => {
      const el = panel.getElementById(id);
      if (!el) return;
      el.addEventListener('click', fn);
      this.cleanupFuncs.push(() => el.removeEventListener('click', fn));
    };

    bindClick('tab-bomb', () => labController.setExperiment('bomb_puzzle'));
    bindClick('tab-tether', () => labController.setExperiment('tether'));
    bindClick('tab-box', () => labController.setExperiment('schrodinger'));
    bindClick('tab-slits', () => labController.setExperiment('double_slit'));
    bindClick('tab-bell', () => labController.setExperiment('entanglement'));

    bindClick('bomb-primary', () => labController.performBombMissionAction());
    bindClick('bomb-alternate', () => labController.selectAlternateBombCrate());
    bindClick('bomb-quarantine', () => labController.quarantineCrate());

    bindClick('btn-act-1', () => {
      const exp = labController.state.experiment;
      if (exp === 'bomb_puzzle') return;
      if (exp === 'tether') labController.nudgeTetherDistance(0.45);
      else if (exp === 'schrodinger') labController.applyGate('Z');
      else if (exp === 'double_slit') labController.toggleWhichPathDetector();
      else labController.cycleAliceAngle();
    });

    bindClick('btn-act-2', () => {
      const exp = labController.state.experiment;
      if (exp === 'bomb_puzzle') return;
      if (exp === 'tether') labController.triggerTetherCollapse();
      else if (exp === 'schrodinger') labController.applyGate('H');
      else if (exp === 'double_slit') labController.toggleRoomscaleWave();
      else labController.cycleBobAngle();
    });

    bindClick('btn-act-3', () => {
      const exp = labController.state.experiment;
      if (exp === 'bomb_puzzle') return;
      if (exp === 'tether') labController.toggleTetherMode();
      else if (exp === 'schrodinger') labController.toggleObserveBox();
      else if (exp === 'double_slit') labController.triggerThrowPhoton();
      else labController.stepNextChshSetting();
    });

    bindClick('btn-reset-lab', () => labController.resetCurrentExperiment());

    const btnXr = panel.getElementById('btn-xr');
    const btnExitXr = panel.getElementById('btn-exit-xr');
    if (btnXr && btnExitXr) {
      if (!this.world.xrEnabled) {
        btnXr.setProperties({ display: 'none' });
        btnExitXr.setProperties({ display: 'none' });
      } else {
        bindClick('btn-xr', () => this.world.launchXR());
        bindClick('btn-exit-xr', () => this.world.exitXR());
        this.cleanupFuncs.push(
          this.world.visibilityState.subscribe((visibilityState) => {
            const is2D = visibilityState === VisibilityState.NonImmersive;
            btnXr.setProperties({ display: is2D ? 'flex' : 'none' });
            btnExitXr.setProperties({ display: is2D ? 'none' : 'flex' });
          }),
        );
      }
    }

    const syncPanel = () => {
      const s = labController.state;
      const isBomb = s.experiment === 'bomb_puzzle';
      const hint = computeOnboardingHint(s, labController.holdingKind, labController.bombInFlight);

      missionRow?.setProperties({ display: isBomb ? 'flex' : 'none' });
      experimentTop?.setProperties({ display: isBomb ? 'none' : 'flex' });
      experimentBottom?.setProperties({ display: isBomb ? 'none' : 'flex' });
      if (isBomb) {
        const b = s.bombPuzzle;
        const left = b.maxProbes > 0 ? Math.max(0, b.maxProbes - b.crateProbesFired) : 0;
        const tableTag =
          labController.tableLayoutProfile === 'compact'
            ? 'NARROW'
            : labController.tableLayoutProfile === 'wide'
              ? 'WIDE'
              : '';
        this.scoreBadge?.setProperties({
          text: b.training
            ? `CASE 1/3 · TRAINING${tableTag ? ' · ' + tableTag : ''}`
            : `CASE ${b.round} · ${left} SHOTS · ${s.score} PTS`,
        });
      } else {
        this.scoreBadge?.setProperties({
          text: `SCORE ${s.score} | STREAK ${s.streak}x`,
        });
      }
      const cardBg =
        hint.accentHex === '#fb7185'
          ? '#3b0d17'
          : hint.accentHex === '#34d399'
            ? '#063d2d'
            : hint.accentHex === '#fbbf24' || hint.accentHex === '#f59e0b'
              ? '#2e2208'
              : '#0b1628';
      resultCard?.setProperties({ borderColor: hint.accentHex, backgroundColor: cardBg });
      this.ctaTag?.setProperties({ text: fitAscii(hint.stepTag, 36), color: hint.accentHex });
      this.ctaText?.setProperties({ text: isBomb ? fitAscii(hint.ctaText, 58) : fitAscii(hint.ctaText, 54) });

      this.lblTabBomb?.setProperties({ text: s.experiment === 'bomb_puzzle' ? '*Bomb' : 'Bomb' });
      this.lblTabTether?.setProperties({ text: s.experiment === 'tether' ? '*Tether' : 'Tether' });
      this.lblTabBox?.setProperties({ text: s.experiment === 'schrodinger' ? '*Box' : 'Box' });
      this.lblTabSlits?.setProperties({ text: s.experiment === 'double_slit' ? '*Slits' : 'Slits' });
      this.lblTabBell?.setProperties({ text: s.experiment === 'entanglement' ? '*Bell' : 'Bell' });

      if (isBomb) {
        const b = s.bombPuzzle;
        const controls = getBombMissionControls(b, labController.bombInFlight);
        this.modeTitle?.setProperties({
          text: b.training
            ? 'Bomb Test: Training'
            : b.caseKind === 'optics_drift'
              ? `Case ${b.round}: Optics Drift`
              : `Case ${b.round}: Photon Budget`,
        });
        missionPrimaryLabel?.setProperties({ text: controls.primary });
        missionPrimary?.setProperties({ opacity: controls.waiting ? 0.68 : 1 });
        missionAlternate?.setProperties({ display: controls.alternate ? 'flex' : 'none' });
        missionAlternateLabel?.setProperties({ text: controls.alternate });
        missionQuarantine?.setProperties({ display: controls.canQuarantine ? 'flex' : 'none' });
        missionQuarantineLabel?.setProperties({ text: 'Quarantine' });
      } else if (s.experiment === 'tether') {
        const t = s.tether;
        this.modeTitle?.setProperties({ text: 'Quantum Tether' });
        this.lblAct1?.setProperties({ text: `Spread (${t.distanceM.toFixed(1)}m)` });
        this.lblAct2?.setProperties({ text: 'Collapse Pair' });
        this.lblAct3?.setProperties({ text: t.mode === 'correlated' ? '|Phi+>' : '|Psi->' });
        this.lblResetLab?.setProperties({ text: 'Reset' });
      } else if (s.experiment === 'schrodinger') {
        const sch = s.schrodinger;
        this.modeTitle?.setProperties({ text: 'Schrodinger Box' });
        this.lblAct1?.setProperties({ text: 'Gate Z' });
        this.lblAct2?.setProperties({ text: 'Gate H' });
        this.lblAct3?.setProperties({ text: sch.boxClosed ? 'Open Lid' : 'Close Lid' });
        this.lblResetLab?.setProperties({ text: 'Reset Box' });
      } else if (s.experiment === 'double_slit') {
        this.modeTitle?.setProperties({ text: 'Double-Slit' });
        this.lblAct1?.setProperties({ text: `Probe: ${s.whichPathDetector ? 'ON' : 'OFF'}` });
        this.lblAct2?.setProperties({ text: `Room: ${s.roomscaleWave ? 'ON' : 'OFF'}` });
        this.lblAct3?.setProperties({ text: 'Throw Photon' });
        this.lblResetLab?.setProperties({ text: 'Reset' });
      } else {
        this.modeTitle?.setProperties({ text: 'Bell CHSH Test' });
        this.lblAct1?.setProperties({ text: `Alice: ${s.aliceAngleDeg} deg` });
        this.lblAct2?.setProperties({ text: `Bob: ${s.bobAngleDeg} deg` });
        this.lblAct3?.setProperties({ text: `CHSH (${Object.keys(s.chshCells).length}/4)` });
        this.lblResetLab?.setProperties({ text: 'Reset' });
      }
    };

    this.cleanupFuncs.push(labController.subscribe(syncPanel));
    syncPanel();
  }
}
