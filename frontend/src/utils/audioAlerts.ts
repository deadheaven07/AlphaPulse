// Web Audio API Native Sound Synthesizer (Zero external audio asset dependencies)
export class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Celebratory Chime for Profit Target Hit (Two harmonic rising tones: D5 -> A5 -> D6)
  playProfitChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.22); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.42); // D6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.12);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.48);
    } catch (e) {
      console.warn("AudioContext playProfitChime prevented:", e);
    }
  }

  // Urgent Pulsing Buzzer for Stop-Loss Breach or Threatening News (Low warning saw-tooth tones)
  playWarningBuzzer() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.18].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now + delay);
        osc.frequency.linearRampToValueAtTime(130, now + delay + 0.14);

        gain.gain.setValueAtTime(0.28, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
    } catch (e) {
      console.warn("AudioContext playWarningBuzzer prevented:", e);
    }
  }

  // Fast Double Beep for Tactical Consolidation Breakout
  playBreakoutBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [0, 0.12].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(784.0, now + delay); // G5
        osc.frequency.exponentialRampToValueAtTime(987.77, now + delay + 0.08); // B5

        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.09);
      });
    } catch (e) {
      console.warn("AudioContext playBreakoutBeep prevented:", e);
    }
  }
}

export const soundManager = new SoundManager();
