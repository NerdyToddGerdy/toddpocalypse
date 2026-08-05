import { defaultRng, type RNG } from "./rng.js";

/**
 * Returns a uniformly random element from an array.
 * @param rng - Randomness source; defaults to {@link defaultRng}. Pass a seeded
 *              {@link RNG} to make the choice reproducible.
 */
export function pick<T>(arr: readonly T[], rng: RNG = defaultRng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Returns a random integer in [min, max] inclusive.
 * @param rng - Randomness source; defaults to {@link defaultRng}.
 */
export function randInt(min: number, max: number, rng: RNG = defaultRng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Returns a random element sampled proportionally to the provided weights.
 * @param rng - Randomness source; defaults to {@link defaultRng}.
 */
export function weightedPick<T>(arr: readonly T[], weights: number[], rng: RNG = defaultRng): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}
