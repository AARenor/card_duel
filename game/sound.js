// All voices are synthesised locally after the first player gesture.
let context;
let volume = 0.45;
export function setVolume(value) { volume = value; }
export function sound(type) {
  try {
    context ||= new AudioContext();
    if (context.state === 'suspended') context.resume();
    const notes = type === 'victory' ? [392, 494, 587, 784] : type === 'combo' ? [523, 659, 784] : type === 'play' ? [110] : [330];
    notes.forEach((frequency, i) => {
      const at = context.currentTime + i * 0.09;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type === 'play' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      if (type === 'swish') oscillator.frequency.exponentialRampToValueAtTime(160, at + 0.12);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.18), at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + (type === 'victory' ? 0.35 : 0.18));
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at); oscillator.stop(at + 0.4);
    });
  } catch (_) { /* Sound is optional if the browser blocks audio. */ }
}
