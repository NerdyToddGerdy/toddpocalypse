import { afterEach, describe, expect, it, vi } from "vitest";
import { pick, randInt, weightedPick } from "../src/utils.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pick", () => {
  it("returns the first element when Math.random is 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pick(["a", "b", "c"])).toBe("a");
  });

  it("returns the middle element when Math.random is 0.5", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(pick(["a", "b", "c"])).toBe("b");
  });

  it("returns the last element when Math.random is just under 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(pick(["a", "b", "c"])).toBe("c");
  });

  it("works on a single-element array regardless of roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    expect(pick([42])).toBe(42);
  });
});

describe("randInt", () => {
  it("returns min when Math.random is 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(randInt(3, 7)).toBe(3);
  });

  it("returns max when Math.random is just under 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(randInt(3, 7)).toBe(7);
  });

  it("is inclusive of both bounds across the range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(randInt(0, 9)).toBe(5);
  });

  it("returns min when min equals max", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    expect(randInt(5, 5)).toBe(5);
  });
});

describe("weightedPick", () => {
  it("returns the heavily weighted element on a low roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(weightedPick(["a", "b"], [99, 1])).toBe("a");
  });

  it("returns the later element when the roll exceeds earlier weights", () => {
    // total = 10, r = 0.95 * 10 = 9.5 > weight 9 of "a"
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    expect(weightedPick(["a", "b"], [9, 1])).toBe("b");
  });

  it("falls back to the last element if rounding leaves r positive", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(weightedPick(["a", "b", "c"], [1, 1, 1])).toBe("c");
  });

  it("never returns a zero-weight element", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(weightedPick(["a", "b", "c"], [0, 1, 0])).toBe("b");
  });
});
