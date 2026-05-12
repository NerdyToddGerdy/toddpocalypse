import { describe, it, expect } from "vitest";
import { parseAuthHash, isTokenExpired } from "../src/cloud.js";

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