export type GameSound = "deal" | "card" | "bid" | "round" | "game" | "tick";

let context: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function soundEnabled() { return typeof window !== "undefined" && localStorage.getItem("judgement_sound") !== "off"; }
export function setSoundEnabled(enabled: boolean) { localStorage.setItem("judgement_sound", enabled ? "on" : "off"); }

function prepareNoise(audio: AudioContext) {
  if (noiseBuffer) return;
  noiseBuffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .45), audio.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
}

export function preloadGameAudio() {
  if (typeof window === "undefined" || context) return;
  try { context = new AudioContext(); prepareNoise(context); } catch { context = null; noiseBuffer = null; }
}

function tone(audio: AudioContext, frequency: number, offset: number, duration: number, volume: number, shape: OscillatorType = "sine") {
  const start = audio.currentTime + offset; const gain = audio.createGain(); const oscillator = audio.createOscillator();
  gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + .008); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.type = shape; oscillator.frequency.setValueAtTime(frequency, start); oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + duration);
}

function noise(audio: AudioContext, offset: number, duration: number, volume: number, frequency: number) {
  if (!noiseBuffer) return;
  const start = audio.currentTime + offset; const source = audio.createBufferSource(); const filter = audio.createBiquadFilter(); const gain = audio.createGain();
  source.buffer = noiseBuffer; filter.type = "bandpass"; filter.frequency.setValueAtTime(frequency, start); filter.Q.setValueAtTime(.7, start);
  gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + .008); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter); filter.connect(gain); gain.connect(audio.destination); source.start(start, Math.random() * .12, duration); source.stop(start + duration);
}

export function playGameSound(sound: GameSound) {
  if (!soundEnabled()) return;
  try {
    preloadGameAudio(); if (!context) return; void context.resume().catch(() => undefined); prepareNoise(context);
    if (sound === "deal") {
      noise(context, 0, .16, .035, 1_850); noise(context, .08, .16, .032, 2_200); noise(context, .16, .18, .028, 1_700);
      tone(context, 145, .02, .035, .022, "triangle"); tone(context, 170, .18, .04, .018, "triangle"); return;
    }
    if (sound === "card") { noise(context, 0, .075, .04, 2_600); tone(context, 155, .035, .045, .028, "triangle"); return; }
    if (sound === "bid") { tone(context, 420, 0, .07, .04); tone(context, 630, .035, .07, .025); return; }
    if (sound === "tick") { tone(context, 760, 0, .035, .022, "square"); return; }
    if (sound === "round") { tone(context, 523, 0, .14, .045); tone(context, 659, .07, .16, .04); tone(context, 784, .14, .18, .035); return; }
    [523, 659, 784, 1_047].forEach((frequency, index) => tone(context!, frequency, index * .085, .24, .045 - index * .004));
  } catch { /* Audio is optional and must never delay or block play. */ }
}
