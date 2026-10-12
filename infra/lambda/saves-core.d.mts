// Types for saves-core.mjs, so the game's tests can typecheck against it.

export const SLOT_COUNT: number;
export const NAME_MAX: number;
export const SESSION_TTL_MS: number;
export const MAX_SAVE_BYTES: number;

export interface SlotSummary { hero: string; cls: string; level: number; best: number }

export interface SlotItem {
    data: string;
    name?: string;
    updatedAt?: string;
    summary?: SlotSummary | null;
}

export interface WriteSave {
    key: string;
    data: string;
    summary: SlotSummary | null;
    defaultName: string;
    sessionId: string;
    now: number;
    force: boolean;
    ttlMs: number;
}

/** Storage the routes need; saves.mjs implements it on DynamoDB. */
export interface SavesDb {
    getItem(key: string): Promise<SlotItem | null>;
    listItems(keys: string[]): Promise<(SlotItem | null)[]>;
    /** Writes the save, keeping an existing name. "conflict" if another live session holds the slot. */
    writeSave(w: WriteSave): Promise<"ok" | "conflict">;
    rename(key: string, name: string): Promise<"ok" | "missing">;
    remove(key: string): Promise<void>;
}

export interface ApiEvent {
    routeKey: string;
    queryStringParameters?: Record<string, string>;
    headers?: Record<string, string>;
    body?: string;
    requestContext?: { authorizer?: { jwt?: { claims?: Record<string, string> } } };
}

export interface ApiResponse { statusCode: number; headers: Record<string, string>; body: string }

export function slotKey(sub: string, slot: number): string;
export function parseSlot(raw: string | undefined | null): number | null;
export function cleanName(raw: unknown): string | null;
export function summarize(data: string): SlotSummary | null;
export function route(event: ApiEvent, db: SavesDb, env: { allowedOrigins: string[]; now: () => number }): Promise<ApiResponse>;
