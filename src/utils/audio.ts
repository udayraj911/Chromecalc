let audioCtx: AudioContext | null = null;

export function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTactileClick(
  type: 'sine' | 'square' | 'triangle',
  toneType: 'number' | 'operator' | 'clear' | 'equals' | 'error'
) {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (toneType === 'number') {
      // Crisp high-pitch chirp
      const freq = 600 + Math.random() * 80;
      osc.frequency.setValueAtTime(freq, now);
      // Volume envelope
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } 
    else if (toneType === 'operator') {
      // Deeper mechanical tap
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } 
    else if (toneType === 'clear') {
      // Descending power-down slide
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } 
    else if (toneType === 'equals') {
      // Uplifting ascending synth chime
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } 
    else if (toneType === 'error') {
      // Buzzer noise
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.setValueAtTime(118, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Audio context failed or blocked by browser policy
    console.warn('Audio click playback failed:', e);
  }
}
