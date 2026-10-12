// Background music: one looping track, played through Web Audio so the loop has
// no gap. Each pass of the track overlaps the next by CROSSFADE_S, fading out as
// the next fades in, which also hides a rough start or end on the recording.
// Until public/audio/theme.mp3 exists, a generated drone plays in its place.

/** Where the track is served from, next to index.html. */
export const MUSIC_URL = "audio/theme.mp3";
export const MUSIC_KEY = "music-settings";
/** Seconds each pass of the track overlaps the next. */
export const CROSSFADE_S = 3;

export interface MusicSettings {
  /** Slider position, 0–1. */
  volume: number;
  muted: boolean;
  /** Keep playing while the tab is hidden. */
  background: boolean;
}

/** On and quiet; silent while the tab is hidden. */
export const MUSIC_DEFAULTS: MusicSettings = { volume: 0.25, muted: false, background: false };

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export function loadMusicSettings(store: Pick<Store, "getItem">): MusicSettings {
  try {
    const raw = JSON.parse(store.getItem(MUSIC_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return { ...MUSIC_DEFAULTS };
    const volume = typeof raw.volume === "number" && Number.isFinite(raw.volume)
      ? Math.min(1, Math.max(0, raw.volume))
      : MUSIC_DEFAULTS.volume;
    return {
      volume,
      muted: typeof raw.muted === "boolean" ? raw.muted : MUSIC_DEFAULTS.muted,
      background: typeof raw.background === "boolean" ? raw.background : MUSIC_DEFAULTS.background,
    };
  } catch {
    return { ...MUSIC_DEFAULTS };
  }
}

export function saveMusicSettings(store: Pick<Store, "setItem">, s: MusicSettings): void {
  try { store.setItem(MUSIC_KEY, JSON.stringify(s)); } catch { /* private window or blocked storage */ }
}

/** The output level for these settings: squared, so the low end of the slider stays quiet. */
export function musicGain(s: MusicSettings, hidden: boolean): number {
  if (s.muted || s.volume <= 0 || (hidden && !s.background)) return 0;
  return s.volume * s.volume;
}

/** A quiet A-minor drone that fades in and out: the stand-in until the real track is added. */
export function placeholderTrack(sampleRate: number, seconds: number): Float32Array {
  const n = Math.round(sampleRate * seconds);
  const out = new Float32Array(n);
  // Frequency, level, and the rate (Hz) each partial slowly swells at.
  const partials: [number, number, number][] = [
    [55.0, 0.12, 0.07], [82.41, 0.08, 0.11], [110.0, 0.07, 0.05], [130.81, 0.05, 0.13], [164.81, 0.03, 0.09],
  ];
  const fade = Math.min(2, seconds / 4) * sampleRate;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let v = 0;
    for (const [f, a, lfo] of partials) v += a * (0.6 + 0.4 * Math.sin(2 * Math.PI * lfo * t)) * Math.sin(2 * Math.PI * f * t);
    const env = Math.min(1, i / fade, (n - 1 - i) / fade);
    out[i] = v * env;
  }
  return out;
}

/* ── The player ── */

interface GainParam {
  value: number;
  setValueAtTime(v: number, at: number): unknown;
  linearRampToValueAtTime(v: number, at: number): unknown;
  cancelScheduledValues(at: number): unknown;
}
interface Gain { gain: GainParam; connect(dest: unknown): unknown }
interface Buffer { duration: number; getChannelData(ch: number): Float32Array }

/** The slice of AudioContext the player uses, so tests can stand in for it. */
export interface MusicAudioContext {
  currentTime: number;
  sampleRate: number;
  state: AudioContextState;
  destination: unknown;
  createGain(): Gain;
  createBuffer(channels: number, length: number, rate: number): Buffer;
  createBufferSource(): { buffer: Buffer | null; connect(dest: unknown): unknown; start(at: number): void; stop(at: number): void };
  decodeAudioData(data: ArrayBuffer): Promise<Buffer>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
}

export interface MusicDeps {
  createContext(): MusicAudioContext;
  /** The track's bytes, or null if it isn't there. */
  fetchTrack(): Promise<ArrayBuffer | null>;
  /** Repeating timer that keeps the next passes scheduled. */
  setTimer(fn: () => void, ms: number): number;
  clearTimer(id: number): void;
  /** How long volume changes and pauses fade over. */
  fadeMs: number;
}

const PLACEHOLDER_S = 16;

export class MusicPlayer {
  private ctx: MusicAudioContext | null = null;
  private master: Gain | null = null;
  private buffer: Buffer | null = null;
  private loading: Promise<void> | null = null;
  private nextStart = 0;
  private timer: number | null = null;
  private started = false;
  private hidden = false;
  /** Bumped on each update, so a stale fade-out doesn't pause music that came back on. */
  private generation = 0;
  usingPlaceholder = false;

  constructor(private deps: MusicDeps, private settings: MusicSettings) {}

  /** Call from a tap or key press: browsers only allow audio to start from one. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.update(this.settings, this.hidden);
  }

  async update(settings: MusicSettings, hidden: boolean): Promise<void> {
    this.settings = settings;
    this.hidden = hidden;
    if (!this.started) return;
    const gen = ++this.generation;
    const target = musicGain(settings, hidden);
    if (target > 0) {
      await this.load();
      if (gen !== this.generation || !this.ctx) return;
      if (this.ctx.state !== "running") await this.ctx.resume();
      this.rampTo(target);
    } else if (this.ctx) {
      this.rampTo(0);
      await new Promise((r) => setTimeout(r, this.deps.fadeMs));
      if (gen === this.generation && this.ctx.state === "running") await this.ctx.suspend();
    }
  }

  private rampTo(level: number): void {
    const g = this.master!.gain;
    const now = this.ctx!.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(level, now + this.deps.fadeMs / 1000);
  }

  private load(): Promise<void> {
    this.loading ??= (async () => {
      const ctx = this.deps.createContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      const bytes = await this.deps.fetchTrack().catch(() => null);
      if (bytes) {
        try { this.buffer = await ctx.decodeAudioData(bytes); } catch { this.buffer = null; }
      }
      if (!this.buffer) {
        const samples = placeholderTrack(ctx.sampleRate, PLACEHOLDER_S);
        const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
        buf.getChannelData(0).set(samples);
        this.buffer = buf;
        this.usingPlaceholder = true;
      }
      this.nextStart = ctx.currentTime + 0.05;
      this.schedule();
      this.timer = this.deps.setTimer(() => this.schedule(), 1000);
    })();
    return this.loading;
  }

  /** Keeps the next two passes queued. */
  private schedule(): void {
    const ctx = this.ctx!;
    const dur = this.buffer!.duration;
    const period = dur - CROSSFADE_S;
    while (this.nextStart < ctx.currentTime + period + 1) {
      const at = this.nextStart;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(1, at + CROSSFADE_S);
      g.gain.setValueAtTime(1, at + dur - CROSSFADE_S);
      g.gain.linearRampToValueAtTime(0, at + dur);
      g.connect(this.master);
      const src = ctx.createBufferSource();
      src.buffer = this.buffer;
      src.connect(g);
      src.start(at);
      src.stop(at + dur);
      this.nextStart = at + period;
    }
  }
}
