/**
 * The randomness seam.
 *
 * Franchise bible §6: pure logic takes an injectable `RNG = () => number` so tests
 * seed deterministically, and the UI never re-implements a roll. Every roll in the
 * game flows through this type; `Math.random` is called in exactly one place, at
 * the bottom of this file.
 *
 * Threading it: `pick`/`randInt`/`weightedPick` (utils), `generateEnemy` (dungeon)
 * and `getItem` (gear) all take an optional trailing `rng`. `GameState` holds one
 * and passes it down, so seeding the constructor makes an entire playthrough
 * reproducible.
 */

/** A source of uniform randomness in [0, 1) — the same contract as `Math.random`. */
export type RNG = () => number;

/**
 * Deterministic PRNG for tests and any future seeded/daily run.
 *
 * Mulberry32: 32-bit state, one multiply-xorshift round. Fast, well-distributed
 * for gameplay purposes, and short enough to audit. Not cryptographic — never use
 * it for anything security-bearing.
 *
 * @param seed - Any 32-bit integer. The same seed always yields the same sequence.
 */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The production source of randomness — the one place `Math.random` is called.
 *
 * Everything else takes an {@link RNG}, so this is the composition root: swap it
 * here (or pass a seeded RNG in) and the whole game becomes reproducible.
 */
export const defaultRng: RNG = () => Math.random();
