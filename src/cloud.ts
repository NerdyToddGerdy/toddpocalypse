import { newId } from "./rng.js";
/** Base URL of the save API (AWS API Gateway stage). */
export const API_URL = "https://r4nh7p0l56.execute-api.us-east-1.amazonaws.com";

/** Cognito hosted-UI domain for the OAuth2 login redirect. */
export const COGNITO_DOMAIN = "https://toddpocalypse-auth.auth.us-east-1.amazoncognito.com";

/** Cognito app client ID — public, not a secret. */
export const COGNITO_CLIENT_ID = "66c8cjj6dtu1s9ud8qb47ls9ma";

/** localStorage key for the stored access token. */
const TOKEN_KEY = "toddpocalypse-token";

/** localStorage key for the token expiry timestamp (ms since epoch). */
const TOKEN_EXPIRY_KEY = "toddpocalypse-token-expiry";

/** localStorage key for the active session ID (stable per browser, unique per device). */
const SESSION_KEY = "toddpocalypse-session";

/** localStorage key for the cloud slot this browser plays (1–5). */
const SLOT_KEY = "toddpocalypse-cloud-slot";

/** Cloud save slots per player. */
export const SLOT_COUNT = 5;

/** What the slot list says about a filled slot, read by the server from the save. */
export interface SlotSummary { hero: string; cls: string; level: number; best: number }

/** One row of the slot list: empty, or named with what's in it. */
export type SlotInfo =
    | { slot: number; empty: true }
    | { slot: number; empty?: false; name: string; updatedAt: string | null; summary: SlotSummary | null };

/** The cloud slot this browser plays; 1 until another is picked. */
export function getActiveSlot(): number {
    const n = Number(localStorage.getItem(SLOT_KEY));
    return Number.isInteger(n) && n >= 1 && n <= SLOT_COUNT ? n : 1;
}

/** Picks the cloud slot this browser plays. */
export function setActiveSlot(slot: number): void {
    localStorage.setItem(SLOT_KEY, String(slot));
}

function saveUrl(slot: number, force = false): string {
    return `${API_URL}/save?slot=${slot}${force ? "&force=true" : ""}`;
}

/**
 * Parses the Cognito implicit-grant redirect hash and extracts the access token.
 * Returns null if the hash is absent or malformed.
 */
export function parseAuthHash(hash: string): { token: string; expiry: number } | null {
    if (!hash.startsWith("#")) return null;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get("access_token");
    if (!token) return null;
    const expiresIn = parseInt(params.get("expires_in") ?? "3600", 10);
    return { token, expiry: Date.now() + expiresIn * 1000 };
}

/** Returns true if the given expiry timestamp (ms since epoch) is in the past. */
export function isTokenExpired(expiry: number): boolean {
    return Date.now() > expiry;
}

/** Returns the stored access token if present and unexpired, otherwise null and clears stale keys. */
export function getStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return null;
    if (isTokenExpired(parseInt(expiry, 10))) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        return null;
    }
    return token;
}

/** Persists an access token and its expiry timestamp to localStorage. */
export function storeToken(token: string, expiry: number): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

/** Removes the stored token and expiry from localStorage (sign-out). */
export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/** Returns the stored session ID, creating and persisting a new UUID if none exists. */
export function getOrCreateSessionId(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = newId();
        localStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

/** Removes the stored session ID from localStorage. */
export function clearSessionId(): void {
    localStorage.removeItem(SESSION_KEY);
}

/** Clears the existing session ID and generates a fresh one, returning the new ID. */
export function resetSessionId(): string {
    clearSessionId();
    return getOrCreateSessionId();
}

async function putSave(token: string, data: string, force: boolean, slot = getActiveSlot()): Promise<"ok" | "conflict" | "error"> {
    try {
        const url = saveUrl(slot, force);
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "X-Session-Id": getOrCreateSessionId(),
            },
            body: data,
        });
        if (res.status === 409) return "conflict";
        if (!res.ok) return "error";
        return "ok";
    } catch {
        return "error";
    }
}

/**
 * Attempts to claim this device as the active save device.
 * The caller should call resetSessionId() first so a fresh session is sent.
 * Pass force=true to bypass the 409 session lock via ?force=true query param (no CORS header needed).
 * Returns "ok", "conflict" (other device's session still live), or "error".
 */
export function cloudClaimSession(token: string, data: string, force = false): Promise<"ok" | "conflict" | "error"> {
    return putSave(token, data, force);
}

/** The live game: where sign-in returns to on GitHub Pages. */
const LIVE_REDIRECT = "https://nerdytoddgerdy.github.io/toddpocalypse";

/**
 * Local addresses sign-in can return to. Each must be registered in
 * infra/index.ts; Cognito allows plain http only for localhost.
 */
export const LOCAL_REDIRECTS = ["http://localhost:8000", "http://localhost:8080"];

/**
 * The Cognito hosted-UI login URL, returning to this address; null where
 * sign-in can't return (a LAN address, 127.0.0.1, an unregistered port).
 */
export function getLoginUrl(): string | null {
    const { hostname, origin } = window.location;
    const redirect = hostname === "nerdytoddgerdy.github.io" ? LIVE_REDIRECT
        : LOCAL_REDIRECTS.includes(origin) ? origin
        : null;
    if (!redirect) return null;
    // identity_provider=Google skips Cognito's own (unstyled) chooser page.
    return `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirect)}`;
}

/** Outcome of a cloudLoad call, distinguishing a missing save from server/network failures. */
export type CloudLoadResult =
    | { status: "ok"; data: string }
    | { status: "empty" }
    | { status: "http"; code: number }
    | { status: "network" };

/** Fetches a slot's save data (the active slot unless told otherwise). */
export async function cloudLoad(token: string, slot = getActiveSlot()): Promise<CloudLoadResult> {
    try {
        const res = await fetch(saveUrl(slot), {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return { status: "http", code: res.status };
        const text = await res.text();
        return text ? { status: "ok", data: text } : { status: "empty" };
    } catch {
        return { status: "network" };
    }
}

/** Writes save data to DynamoDB. Returns "ok", "conflict" (another session active), or "error". */
export function cloudSave(token: string, data: string): Promise<"ok" | "conflict" | "error"> {
    return putSave(token, data, false);
}

/** Outcome of listing the slots. */
export type SlotListResult =
    | { status: "ok"; slots: SlotInfo[] }
    | { status: "http"; code: number }
    | { status: "network" };

/** Lists all five slots: names and what's in them, never the saves themselves. */
export async function cloudListSlots(token: string): Promise<SlotListResult> {
    try {
        const res = await fetch(`${API_URL}/saves`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return { status: "http", code: res.status };
        return { status: "ok", slots: await res.json() as SlotInfo[] };
    } catch {
        return { status: "network" };
    }
}

async function slotRequest(token: string, slot: number, method: "PATCH" | "DELETE", body?: string): Promise<"ok" | "error"> {
    try {
        const res = await fetch(saveUrl(slot), {
            method,
            headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
            ...(body ? { body } : {}),
        });
        return res.ok ? "ok" : "error";
    } catch {
        return "error";
    }
}

/** Renames a filled slot. */
export function cloudRenameSlot(token: string, slot: number, name: string): Promise<"ok" | "error"> {
    return slotRequest(token, slot, "PATCH", JSON.stringify({ name }));
}

/** Empties a slot. */
export function cloudDeleteSlot(token: string, slot: number): Promise<"ok" | "error"> {
    return slotRequest(token, slot, "DELETE");
}

/** Saves this game into another slot as well; the active slot doesn't change. */
export function cloudCopyToSlot(token: string, slot: number, data: string): Promise<"ok" | "conflict" | "error"> {
    return putSave(token, data, false, slot);
}
