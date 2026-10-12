import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  MUSIC_DEFAULTS, MUSIC_KEY, MUSIC_URL, CROSSFADE_S,
  loadMusicSettings, saveMusicSettings, musicGain, placeholderTrack, MusicPlayer,
  type MusicAudioContext,
} from "../src/audio";

/**
 * The background track: one looping piece of music, on and quiet by default,
 * muted from the header, silent while the tab is hidden unless the player asks
 * otherwise. Until the real track is in public/audio/, a generated drone plays.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");

function memoryStore(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    m,
  };
}

describe("settings", () => {
  it("starts on and quiet, paused in the background", () => {
    expect(loadMusicSettings(memoryStore())).toEqual(MUSIC_DEFAULTS);
    expect(MUSIC_DEFAULTS.muted).toBe(false);
    expect(MUSIC_DEFAULTS.background).toBe(false);
    expect(MUSIC_DEFAULTS.volume).toBeGreaterThan(0);
    expect(MUSIC_DEFAULTS.volume).toBeLessThanOrEqual(0.3);
  });

  it("round-trips through storage", () => {
    const store = memoryStore();
    saveMusicSettings(store, { volume: 0.6, muted: true, background: true });
    expect(loadMusicSettings(store)).toEqual({ volume: 0.6, muted: true, background: true });
  });

  it("survives a broken or out-of-range value", () => {
    expect(loadMusicSettings(memoryStore({ [MUSIC_KEY]: "{nope" }))).toEqual(MUSIC_DEFAULTS);
    expect(loadMusicSettings(memoryStore({ [MUSIC_KEY]: '{"volume": 7}' })).volume).toBe(1);
    expect(loadMusicSettings(memoryStore({ [MUSIC_KEY]: '{"volume": -1, "muted": "yes"}' }))).toEqual({ ...MUSIC_DEFAULTS, volume: 0 });
  });

  it("survives storage that throws", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(loadMusicSettings(broken)).toEqual(MUSIC_DEFAULTS);
    expect(() => saveMusicSettings(broken, MUSIC_DEFAULTS)).not.toThrow();
  });
});

describe("musicGain", () => {
  const on = { volume: 0.5, muted: false, background: false };
  it("is silent when muted or at zero volume", () => {
    expect(musicGain({ ...on, muted: true }, false)).toBe(0);
    expect(musicGain({ ...on, volume: 0 }, false)).toBe(0);
  });
  it("is silent while hidden unless background play is on", () => {
    expect(musicGain(on, true)).toBe(0);
    expect(musicGain({ ...on, background: true }, true)).toBeGreaterThan(0);
  });
  it("follows the slider on a curve, so low settings stay quiet", () => {
    expect(musicGain({ ...on, volume: 1 }, false)).toBe(1);
    expect(musicGain(on, false)).toBeCloseTo(0.25);
  });
});

describe("placeholderTrack", () => {
  it("is a quiet loop that fades in and out, for the crossfade", () => {
    const s = placeholderTrack(8000, 12);
    expect(s.length).toBe(8000 * 12);
    const peak = s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThanOrEqual(0.5);
    expect(Math.abs(s[0])).toBeLessThan(0.01);
    expect(Math.abs(s[s.length - 1])).toBeLessThan(0.01);
  });
});

/* ── A fake Web Audio graph: just enough to watch what the player schedules. ── */

interface FakeSource { buffer: unknown; started: number | null; stopped: number | null; gain: FakeGain }
interface FakeGain { value: number; ramps: { value: number; at: number }[] }

function fakeContext() {
  const sources: FakeSource[] = [];
  const gains: FakeGain[] = [];
  let pendingGain: FakeGain | null = null;
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    state: "running" as AudioContextState,
    destination: {},
    resumes: 0,
    suspends: 0,
    decoded: 0,
    createGain() {
      const g: FakeGain = { value: 1, ramps: [] };
      gains.push(g);
      pendingGain = g;
      return {
        gain: {
          get value() { return g.value; },
          set value(v: number) { g.value = v; },
          setValueAtTime(v: number) { g.value = v; },
          linearRampToValueAtTime(v: number, at: number) { g.ramps.push({ value: v, at }); g.value = v; },
          cancelScheduledValues() { /* nothing to cancel in the fake */ },
        },
        connect() { /* graph wiring isn't modelled */ },
      };
    },
    createBuffer(_ch: number, length: number, rate: number) {
      const data = new Float32Array(length);
      return { duration: length / rate, length, getChannelData: () => data };
    },
    createBufferSource() {
      const src: FakeSource = { buffer: null, started: null, stopped: null, gain: pendingGain! };
      sources.push(src);
      return {
        set buffer(b: unknown) { src.buffer = b; },
        connect(node: { gain?: unknown }) { void node; },
        start(at: number) { src.started = at; },
        stop(at: number) { src.stopped = at; },
      };
    },
    async decodeAudioData() {
      ctx.decoded++;
      return { duration: 60, length: 60 * 8000, getChannelData: () => new Float32Array(0) };
    },
    async resume() { ctx.resumes++; ctx.state = "running"; },
    async suspend() { ctx.suspends++; ctx.state = "suspended"; },
  };
  return { ctx, sources, gains };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function player(opts: { track?: ArrayBuffer | null; settings?: Partial<typeof MUSIC_DEFAULTS> } = {}) {
  const f = fakeContext();
  let fetches = 0;
  const p = new MusicPlayer({
    createContext: () => f.ctx as unknown as MusicAudioContext,
    fetchTrack: async () => { fetches++; return opts.track === undefined ? new ArrayBuffer(8) : opts.track; },
    setTimer: () => 0,
    clearTimer: () => {},
    fadeMs: 0,
  }, { ...MUSIC_DEFAULTS, ...opts.settings });
  return { p, f, fetches: () => fetches };
}

describe("MusicPlayer", () => {
  it("loads the track once, on the first start", async () => {
    const { p, f, fetches } = player();
    await p.start();
    await p.start();
    expect(fetches()).toBe(1);
    expect(f.ctx.decoded).toBe(1);
    expect(f.sources.length).toBeGreaterThan(0);
  });

  it("does nothing until started, so the page never plays before a tap", () => {
    const { f, fetches } = player();
    expect(fetches()).toBe(0);
    expect(f.sources).toHaveLength(0);
  });

  it("plays a generated drone when the track file isn't there yet", async () => {
    const { p, f } = player({ track: null });
    await p.start();
    expect(f.ctx.decoded).toBe(0);
    expect(f.sources.length).toBeGreaterThan(0);
    expect(p.usingPlaceholder).toBe(true);
  });

  it("overlaps each pass with the next by the crossfade, so the loop has no gap", async () => {
    const { p, f } = player();
    await p.start();
    const [a, b] = f.sources;
    expect(b.started! - a.started!).toBeCloseTo(60 - CROSSFADE_S);
    expect(a.stopped).toBeCloseTo(a.started! + 60);
    // Each pass fades in at its start and out at its end.
    expect(a.gain.ramps[0]).toMatchObject({ value: 1 });
    expect(a.gain.ramps.at(-1)).toMatchObject({ value: 0 });
  });

  it("muting fades to silence and suspends the audio", async () => {
    const { p, f } = player();
    await p.start();
    await p.update({ ...MUSIC_DEFAULTS, muted: true }, false);
    await flush();
    expect(f.ctx.suspends).toBe(1);
  });

  it("starting muted doesn't download the track until unmuted", async () => {
    const { p, fetches } = player({ settings: { muted: true } });
    await p.start();
    expect(fetches()).toBe(0);
    await p.update({ ...MUSIC_DEFAULTS, muted: false }, false);
    expect(fetches()).toBe(1);
  });

  it("pauses while the tab is hidden and resumes when it's back", async () => {
    const { p, f } = player();
    await p.start();
    await p.update(MUSIC_DEFAULTS, true);
    await flush();
    expect(f.ctx.state).toBe("suspended");
    await p.update(MUSIC_DEFAULTS, false);
    expect(f.ctx.state).toBe("running");
  });

  it("keeps playing while hidden when background play is on", async () => {
    const { p, f } = player({ settings: { background: true } });
    await p.start();
    await p.update({ ...MUSIC_DEFAULTS, background: true }, true);
    await flush();
    expect(f.ctx.suspends).toBe(0);
  });
});

describe("page wiring", () => {
  const html = read("../public/index.html");
  const main = read("../src/main.ts");

  it("the track lives in public/audio", () => {
    expect(MUSIC_URL).toBe("audio/theme.mp3");
  });

  it("the header has a mute button", () => {
    expect(html).toMatch(/<button id="header-music-btn"[^>]*aria-label="Mute music"[^>]*aria-pressed="false"/);
  });

  it("Settings has a volume slider and a background toggle", () => {
    expect(html).toMatch(/<input[^>]*id="music-volume"[^>]*type="range"|<input[^>]*type="range"[^>]*id="music-volume"/);
    expect(html).toMatch(/id="music-background"/);
    expect(html).toContain("Keep playing in the background");
  });

  it("starts on the first tap or key, and follows the tab's visibility", () => {
    expect(main).toMatch(/initMusic\(\)/);
    expect(main).toMatch(/"pointerdown"/);
    expect(main).toMatch(/visibilitychange/);
  });
});
