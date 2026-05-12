export const API_URL = "https://r4nh7p0l56.execute-api.us-east-1.amazonaws.com";
export const COGNITO_DOMAIN = "https://toddpocalypse-auth.auth.us-east-1.amazoncognito.com";
export const COGNITO_CLIENT_ID = "66c8cjj6dtu1s9ud8qb47ls9ma";

const TOKEN_KEY = "toddpocalypse-token";
const TOKEN_EXPIRY_KEY = "toddpocalypse-token-expiry";

export function parseAuthHash(hash: string): { token: string; expiry: number } | null {
    if (!hash.startsWith("#")) return null;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get("access_token");
    if (!token) return null;
    const expiresIn = parseInt(params.get("expires_in") ?? "3600", 10);
    return { token, expiry: Date.now() + expiresIn * 1000 };
}

export function isTokenExpired(expiry: number): boolean {
    return Date.now() > expiry;
}

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

export function storeToken(token: string, expiry: number): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function getLoginUrl(): string {
    const redirectUri = encodeURIComponent(
        window.location.hostname === "localhost"
            ? "http://localhost:8080"
            : "https://nerdytoddgerdy.github.io/toddpocalypse"
    );
    return `${COGNITO_DOMAIN}/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${redirectUri}`;
}

export async function cloudLoad(token: string): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/save`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const text = await res.text();
        return text || null;
    } catch {
        return null;
    }
}

export async function cloudSave(token: string, data: string): Promise<void> {
    try {
        await fetch(`${API_URL}/save`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: data,
        });
    } catch {
        // cloud save failing silently — localStorage still has the data
    }
}