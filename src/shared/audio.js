export function playUiTone(frequency = 660, duration = 0.08) {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch (error) {
    // Audio is optional and can be blocked until user interaction.
  }
}
