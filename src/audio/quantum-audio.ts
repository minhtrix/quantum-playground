import type { QuantumGateType, WavelengthNm } from '../simulation/quantum-physics.js';

class QuantumAudioManager {
  private ctx: AudioContext | null = null;
  private lastClickMs = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    gainPeak: number,
    type: OscillatorType = 'sine',
    delaySec = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart), now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, freqEnd),
      now + durationSec,
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  playPhotonClick(nm: WavelengthNm, xNorm = 0): void {
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastClickMs < 55) return;
    this.lastClickMs = nowMs;

    const baseFreq = nm === 430 ? 880 : nm === 532 ? 660 : 480;
    const pitchOffset = (xNorm || 0) * 140;
    this.playTone(baseFreq + pitchOffset, (baseFreq + pitchOffset) * 0.85, 0.045, 0.02, 'sine');
  }

  playCollapse(collapsed: boolean): void {
    if (collapsed) {
      this.playTone(540, 210, 0.18, 0.05, 'triangle');
    } else {
      this.playTone(392, 587.33, 0.15, 0.045, 'sine', 0);
      this.playTone(587.33, 783.99, 0.16, 0.045, 'sine', 0.08);
    }
  }

  playBellPair(sameOutcome: boolean): void {
    if (sameOutcome) {
      this.playTone(523.25, 523.25, 0.16, 0.04, 'sine', 0);
      this.playTone(783.99, 783.99, 0.2, 0.04, 'triangle', 0.03);
    } else {
      this.playTone(466.16, 440, 0.14, 0.035, 'triangle', 0);
      this.playTone(622.25, 600, 0.14, 0.035, 'sine', 0.05);
    }
  }

  playDialStep(angleDeg: number): void {
    const freq = 320 + angleDeg * 3.5;
    this.playTone(freq, freq * 1.12, 0.06, 0.035, 'triangle');
  }

  playMilestoneUnlocked(): void {
    this.playTone(523.25, 523.25, 0.14, 0.05, 'triangle', 0);
    this.playTone(659.25, 659.25, 0.16, 0.05, 'triangle', 0.08);
    this.playTone(987.77, 1046.5, 0.24, 0.06, 'sine', 0.16);
  }

  playExplosion(): void {
    // Low sub punch + downward saw sweep for quantum bomb detonation
    this.playTone(165, 42, 0.42, 0.12, 'sawtooth', 0);
    this.playTone(240, 55, 0.36, 0.08, 'square', 0.03);
    this.playTone(95, 40, 0.5, 0.1, 'triangle', 0.08);
  }

  playDefuseWin(): void {
    this.playTone(523.25, 523.25, 0.11, 0.06, 'triangle', 0);
    this.playTone(659.25, 659.25, 0.12, 0.06, 'triangle', 0.07);
    this.playTone(783.99, 783.99, 0.14, 0.06, 'sine', 0.14);
    this.playTone(1046.5, 1174.66, 0.28, 0.07, 'sine', 0.21);
  }

  playDarkPortPing(): void {
    // Mysterious crystalline double chime signaling interaction-free proof!
    this.playTone(880, 1174.66, 0.18, 0.06, 'sine', 0);
    this.playTone(1318.5, 1396.9, 0.24, 0.05, 'triangle', 0.09);
  }

  playGateClick(gate: QuantumGateType): void {
    const startFreq = gate === 'H' ? 620 : gate === 'X' ? 490 : 760;
    this.playTone(startFreq, startFreq * 1.24, 0.09, 0.045, 'triangle', 0);
  }

  playTetherSnap(correlated: boolean): void {
    if (correlated) {
      this.playTone(440, 880, 0.16, 0.055, 'sine', 0);
      this.playTone(660, 1320, 0.18, 0.045, 'triangle', 0.04);
    } else {
      this.playTone(780, 390, 0.16, 0.055, 'triangle', 0);
      this.playTone(520, 260, 0.18, 0.045, 'sine', 0.05);
    }
  }

  playThrowPhoton(): void {
    this.playTone(520, 960, 0.14, 0.045, 'sine', 0);
  }
}

export const quantumAudio = new QuantumAudioManager();
