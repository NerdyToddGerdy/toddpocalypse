import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseAuthHash, isTokenExpired, clearSessionId, resetSessionId, cloudClaimSession } from "../src/cloud.js";

// Minimal localStorage stub for Node test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("crypto", { randomUUID: () => "new-uuid-1234" });

describe("parseAuthHash", () => {
  it("returns null for empty string", () => {
    expect(parseAuthHash("")).toBeNull();
  });

  it("returns null for hash without access_token", () => {
    expect(parseAuthHash("#foo=bar&baz=qux")).toBeNull();
  });

  it("parses access_token from a valid Cognito redirect hash", () => {
    const hash = "#access_token=abc123&token_type=Bearer&expires_in=3600&id_token=xyz";
    const result = parseAuthHash(hash);
    expect(result?.token).toBe("abc123");
  });

  it("sets expiry approximately 1 hour from now", () => {
    const before = Date.now();
    const hash = "#access_token=tok&expires_in=3600";
    const result = parseAuthHash(hash);
    const after = Date.now();
    expect(result?.expiry).toBeGreaterThanOrEqual(before + 3600_000);
    expect(result?.expiry).toBeLessThanOrEqual(after + 3600_000);
  });

  it("defaults expires_in to 3600 if missing", () => {
    const hash = "#access_token=tok";
    const result = parseAuthHash(hash);
    expect(result?.expiry).toBeGreaterThan(Date.now());
  });
});

describe("isTokenExpired", () => {
  it("returns true for a past timestamp", () => {
    expect(isTokenExpired(Date.now() - 1000)).toBe(true);
  });

  it("returns false for a future timestamp", () => {
    expect(isTokenExpired(Date.now() + 60_000)).toBe(false);
  });
});

describe("clearSessionId", () => {
  beforeEach(() => { store["toddpocalypse-session"] = "old-session-id"; });
  afterEach(() => { delete store["toddpocalypse-session"]; });

  it("removes the stored session ID", () => {
    clearSessionId();
    expect(store["toddpocalypse-session"]).toBeUndefined();
  });
});

describe("resetSessionId", () => {
  beforeEach(() => { store["toddpocalypse-session"] = "old-session-id"; });
  afterEach(() => { delete store["toddpocalypse-session"]; });

  it("returns a new session ID", () => {
    const id = resetSessionId();
    expect(id).toBe("new-uuid-1234");
  });

  it("persists the new session ID", () => {
    resetSessionId();
    expect(store["toddpocalypse-session"]).toBe("new-uuid-1234");
  });

  it("returns an ID different from the old one", () => {
    const id = resetSessionId();
    expect(id).not.toBe("old-session-id");
  });
});

describe("cloudClaimSession", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store["toddpocalypse-session"] = "my-session";
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("crypto", { randomUUID: () => "new-uuid-1234" });
  });

  it("sends PUT with X-Session-Id header", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    await cloudClaimSession("tok", "data");
    const [, init] = fetchSpy.mock.calls[0];
    expect((init as RequestInit & { headers: Record<string, string> }).headers["X-Session-Id"]).toBeDefined();
  });

  it("returns ok on success", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    const result = await cloudClaimSession("tok", "data");
    expect(result).toBe("ok");
  });

  it("returns conflict on 409", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 409 });
    const result = await cloudClaimSession("tok", "data");
    expect(result).toBe("conflict");
  });

  it("returns error on HTTP failure", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });
    const result = await cloudClaimSession("tok", "data");
    expect(result).toBe("error");
  });

  it("returns error on network failure", async () => {
    fetchSpy.mockRejectedValue(new Error("network"));
    const result = await cloudClaimSession("tok", "data");
    expect(result).toBe("error");
  });
});