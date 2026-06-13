import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseAuthHash, isTokenExpired, clearSessionId, resetSessionId, cloudClaimSession,
  getStoredToken, storeToken, clearToken, getLoginUrl, cloudLoad, cloudSave,
  COGNITO_CLIENT_ID,
} from "../src/cloud.js";

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

describe("token storage", () => {
  const TOKEN_KEY = "toddpocalypse-token";
  const EXPIRY_KEY = "toddpocalypse-token-expiry";

  afterEach(() => {
    delete store[TOKEN_KEY];
    delete store[EXPIRY_KEY];
  });

  it("storeToken / getStoredToken round-trips an unexpired token", () => {
    storeToken("tok-abc", Date.now() + 60_000);
    expect(getStoredToken()).toBe("tok-abc");
  });

  it("getStoredToken returns null when no token is stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("getStoredToken returns null when expiry is missing", () => {
    store[TOKEN_KEY] = "tok-abc";
    expect(getStoredToken()).toBeNull();
  });

  it("getStoredToken returns null for an expired token and clears both keys", () => {
    storeToken("tok-abc", Date.now() - 1000);
    expect(getStoredToken()).toBeNull();
    expect(store[TOKEN_KEY]).toBeUndefined();
    expect(store[EXPIRY_KEY]).toBeUndefined();
  });

  it("clearToken removes token and expiry", () => {
    storeToken("tok-abc", Date.now() + 60_000);
    clearToken();
    expect(store[TOKEN_KEY]).toBeUndefined();
    expect(store[EXPIRY_KEY]).toBeUndefined();
  });
});

describe("getLoginUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("crypto", { randomUUID: () => "new-uuid-1234" });
  });

  it("uses the localhost redirect when running locally", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost" } });
    expect(getLoginUrl()).toContain(encodeURIComponent("http://localhost:8080"));
  });

  it("uses the GitHub Pages redirect on other hosts", () => {
    vi.stubGlobal("window", { location: { hostname: "nerdytoddgerdy.github.io" } });
    expect(getLoginUrl()).toContain(encodeURIComponent("https://nerdytoddgerdy.github.io/toddpocalypse"));
  });

  it("includes client_id and implicit-grant response_type", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost" } });
    const url = getLoginUrl();
    expect(url).toContain(`client_id=${COGNITO_CLIENT_ID}`);
    expect(url).toContain("response_type=token");
  });
});

describe("cloudLoad", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("crypto", { randomUUID: () => "new-uuid-1234" });
  });

  it("returns ok with the save payload on success", async () => {
    fetchSpy.mockResolvedValue({ ok: true, text: async () => '{"gold":5}' });
    expect(await cloudLoad("tok")).toEqual({ status: "ok", data: '{"gold":5}' });
  });

  it("sends the bearer token", async () => {
    fetchSpy.mockResolvedValue({ ok: true, text: async () => "x" });
    await cloudLoad("tok");
    const [, init] = fetchSpy.mock.calls[0];
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe("Bearer tok");
  });

  it("returns empty for an empty body", async () => {
    fetchSpy.mockResolvedValue({ ok: true, text: async () => "" });
    expect(await cloudLoad("tok")).toEqual({ status: "empty" });
  });

  it("returns http with the status code on HTTP failure", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });
    expect(await cloudLoad("tok")).toEqual({ status: "http", code: 500 });
  });

  it("returns network on fetch rejection", async () => {
    fetchSpy.mockRejectedValue(new Error("network"));
    expect(await cloudLoad("tok")).toEqual({ status: "network" });
  });
});

describe("cloudSave", () => {
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

  it("returns ok on success", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    expect(await cloudSave("tok", "data")).toBe("ok");
  });

  it("returns conflict on 409", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 409 });
    expect(await cloudSave("tok", "data")).toBe("conflict");
  });

  it("returns error on HTTP failure", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500 });
    expect(await cloudSave("tok", "data")).toBe("error");
  });

  it("returns error on network failure", async () => {
    fetchSpy.mockRejectedValue(new Error("network"));
    expect(await cloudSave("tok", "data")).toBe("error");
  });

  it("never forces past the session lock", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    await cloudSave("tok", "data");
    const [url] = fetchSpy.mock.calls[0];
    expect(url).not.toContain("force=true");
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

  it("does not append ?force=true to URL by default", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    await cloudClaimSession("tok", "data");
    const [url] = fetchSpy.mock.calls[0];
    expect(url).not.toContain("force=true");
  });

  it("appends ?force=true to URL when force=true", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    await cloudClaimSession("tok", "data", true);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("force=true");
  });

  it("force=true still returns ok on success", async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 });
    const result = await cloudClaimSession("tok", "data", true);
    expect(result).toBe("ok");
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