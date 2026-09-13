export type GameSound = "card" | "bid" | "round" | "game" | "tick";
let context: AudioContext | null = null;

export function soundEnabled() { return typeof window !== "undefined" && localStorage.getItem("judgement_sound") !== "off"; }
export function setSoundEnabled(enabled: boolean) { localStorage.setItem("judgement_sound", enabled ? "on" : "off"); }
export function preloadGameAudio() {
  if (typeof window === "undefined" || context) return;
  try { context = new AudioContext(); } catch { context = null; }
}
export function playGameSound(sound: GameSound) {
  if (!soundEnabled()) return;
  try {
    preloadGameAudio(); if (!context) return; void context.resume();
    const start = context.currentTime; const gain = context.createGain(); gain.connect(context.destination);
    const tones: Record<GameSound, [number, number, number]> = { card: [170, .045, .035], bid: [410, .07, .04], round: [520, .16, .05], game: [660, .26, .055], tick: [740, .035, .022] };
    const [frequency, duration, volume] = tones[sound]; gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    const oscillator = context.createOscillator(); oscillator.type = sound === "card" ? "triangle" : "sine"; oscillator.frequency.setValueAtTime(frequency, start);
    if (sound === "round" || sound === "game") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, start + duration);
    oscillator.connect(gain); oscillator.start(start); oscillator.stop(start + duration);
  } catch { /* Audio is optional and must never block play. */ }
}
