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
        id = crypto.randomUUID();
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

async function putSave(token: string, data: string, force: boolean): Promise<"ok" | "conflict" | "error"> {
    try {
        const url = `${API_URL}/save${force ? "?force=true" : ""}`;
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

/** Builds the Cognito hosted-UI login URL with the correct redirect_uri for the current host. */
export function getLoginUrl(): string {
    const redirectUri = encodeURIComponent(
        window.location.hostname === "localhost"
            ? "http://localhost:8080"
            : "https://nerdytoddgerdy.github.io/toddpocalypse"
    );
    return `${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${redirectUri}`;
}

/** Outcome of a cloudLoad call, distinguishing a missing save from server/network failures. */
export type CloudLoadResult =
    | { status: "ok"; data: string }
    | { status: "empty" }
    | { status: "http"; code: number }
    | { status: "network" };

/** Fetches the player's save data from DynamoDB. */
export async function cloudLoad(token: string): Promise<CloudLoadResult> {
    try {
        const res = await fetch(`${API_URL}/save`, {
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
