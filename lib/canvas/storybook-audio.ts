// Gentle storybook music and sound effects for SAI Canvas movies, made with the Web Audio API.
// Nothing is downloaded: every note is synthesised. The movie player (in its sandbox) only sends
// cue names such as "scene" or "sparkle"; this file decides what they sound like.

type Mood = { tempo: number; root: number; chords: number[][]; level: number };

// Chords are semitone offsets from the root note. Moods follow the sky of each scene.
const moods: Record<string, Mood> = {
  bright: { tempo: 96, root: 60, chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], level: 1 },
  lullaby: { tempo: 72, root: 65, chords: [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]], level: 0.8 },
  tense: { tempo: 84, root: 57, chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]], level: 0.85 },
  dreamy: { tempo: 80, root: 62, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12], [-5, -1, 2, 5]], level: 0.85 },
};
const moodForSky: Record<string, string> = { day: "bright", dawn: "dreamy", sunset: "dreamy", night: "lullaby", space: "lullaby", storm: "tense", underwater: "dreamy" };

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class StorybookAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private timer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private mood: Mood = moods.bright;
  private playing = false;
  muted = false;

  /** Call from a click handler so the browser allows sound. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(this.ctx.destination);
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.impulse(2.4);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.35;
      this.reverb.connect(wet).connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      this.musicBus.connect(this.reverb);
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  start() {
    if (!this.ctx || !this.musicBus) return;
    this.playing = true;
    this.step = 0;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(0.5 * this.mood.level, this.ctx.currentTime, 0.8);
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 100);
  }

  setSky(sky: string) {
    const next = moods[moodForSky[sky] ?? "bright"];
    if (next === this.mood) return;
    this.mood = next;
    if (this.ctx && this.musicBus && this.playing) this.musicBus.gain.setTargetAtTime(0.5 * next.level, this.ctx.currentTime, 0.6);
  }

  stop(fade = 1.5) {
    this.playing = false;
    if (this.ctx && this.musicBus) this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    const ctx = this.ctx;
    window.setTimeout(() => { if (!this.playing && this.timer !== null) { window.clearInterval(this.timer); this.timer = null; } }, fade * 1000 + 200);
    return ctx;
  }

  /** Short sound effects the movie can ask for. */
  sfx(name: string) {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + 0.01;
    const bell = (midi: number, at: number, gain = 0.18, length = 0.9) => this.tone("sine", freq(midi), at, length, gain, true);
    switch (name) {
      case "chime": [72, 76, 79, 84].forEach((m, i) => bell(m, t + i * 0.09, 0.14, 1.4)); break;
      case "sparkle": case "twinkle": [88, 91, 95, 98, 93].forEach((m, i) => bell(m, t + i * 0.05, 0.06, 0.5)); break;
      case "magic": [72, 76, 79, 83, 86, 91].forEach((m, i) => bell(m, t + i * 0.06, 0.08, 1)); break;
      case "pop": this.sweep(500, 900, t, 0.08, 0.15); break;
      case "blip": this.sweep(700, 1000, t, 0.06, 0.06); break;
      case "boing": case "hop": this.sweep(220, 520, t, 0.18, 0.12); break;
      case "whoosh": this.noise(t, 0.5, 0.12, 900, 3000); break;
      case "rumble": this.noise(t, 0.9, 0.18, 120, 200); break;
      case "thunder": this.noise(t, 2.2, 0.32, 60, 160); this.noise(t + 0.05, 0.4, 0.12, 400, 900); break;
      case "splash": this.noise(t, 0.6, 0.16, 1200, 600); break;
      case "sing": [76, 79, 81, 84, 81, 79, 88].forEach((m, i) => this.tone("sine", freq(m), t + i * 0.22, 0.7, 0.07, true, null, 0.04)); break;
    }
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.playing) return;
    const eighth = 60 / this.mood.tempo / 2;
    while (this.nextNote < ctx.currentTime + 0.4) {
      const bar = Math.floor(this.step / 8) % this.mood.chords.length;
      const chord = this.mood.chords[bar];
      const beat = this.step % 8;
      const root = this.mood.root;
      // Music box: a rising and falling arpeggio over two octaves.
      const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
      const tones = [...chord, ...chord.map((n) => n + 12)];
      const note = root + tones[pattern[beat] % tones.length] + (beat >= 4 ? 12 : 0);
      this.tone("triangle", freq(note), this.nextNote, 1.2, 0.07, false, this.musicBus);
      this.tone("sine", freq(note + 12), this.nextNote, 0.6, 0.025, false, this.musicBus);
      // A soft pad at the start of each bar.
      if (beat === 0) chord.forEach((n) => this.tone("sine", freq(root + n - 12), this.nextNote, eighth * 8.5, 0.035, false, this.musicBus, 0.6));
      this.nextNote += eighth;
      this.step++;
    }
  }

  private tone(type: OscillatorType, hz: number, at: number, length: number, gain: number, toMaster: boolean, bus?: GainNode | null, attack = 0.005) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = hz;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(env);
    if (toMaster) { env.connect(this.master!); env.connect(this.reverb!); } else env.connect(bus ?? this.musicBus!);
    osc.start(at);
    osc.stop(at + length + 0.05);
  }

  private sweep(from: number, to: number, at: number, length: number, gain: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + length);
    env.gain.setValueAtTime(gain, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.05);
    osc.connect(env).connect(this.master!);
    osc.start(at);
    osc.stop(at + length + 0.1);
  }

  private noise(at: number, length: number, gain: number, low: number, high: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(low, at);
    filter.frequency.exponentialRampToValueAtTime(high, at + length * 0.6);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + length * 0.3);
    env.gain.exponentialRampToValueAtTime(0.0001, at + length);
    src.connect(filter).connect(env).connect(this.master!);
    src.start(at);
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const length = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buffer;
  }
}
