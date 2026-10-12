// The save API's rules, free of AWS so they can be tested: five named slots per
// player, a per-slot session lock, and the routes the game calls. saves.mjs
// wires these to DynamoDB.

export const SLOT_COUNT = 5;
export const NAME_MAX = 32;
export const SESSION_TTL_MS = 90_000;
/** Well under DynamoDB's 400 KB item limit; a late-game save is ~40 KB. */
export const MAX_SAVE_BYTES = 350_000;

/** Slot 1 is the record every player already has; slots 2–5 get their own. */
export function slotKey(sub, slot) {
    return slot === 1 ? sub : `${sub}#${slot}`;
}

/** The slot a request names: absent means 1 (older clients), else 1..SLOT_COUNT, else null. */
export function parseSlot(raw) {
    if (raw === undefined || raw === null) return 1;
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return n >= 1 && n <= SLOT_COUNT ? n : null;
}

/** A slot name as the player typed it, tidied; null if there's nothing usable. */
export function cleanName(raw) {
    if (typeof raw !== "string") return null;
    // eslint-disable-next-line no-control-regex
    const name = raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
    return name || null;
}

/** What the slot list shows about a save, read from the save itself. */
export function summarize(data) {
    try {
        const d = JSON.parse(data);
        const lead = d.party?.[0];
        if (!lead) return null;
        return {
            hero: String(lead.name ?? ""),
            cls: String(lead.character_class ?? ""),
            level: Number(lead.level ?? 1),
            best: Number(d.lifetime_best_level ?? d.highest_level ?? 1),
        };
    } catch {
        return null;
    }
}

function corsOrigin(event, allowed) {
    const o = event.headers?.origin ?? event.headers?.Origin ?? "";
    return allowed.includes(o) ? o : allowed[0];
}

/**
 * Handles one API Gateway (HTTP API, payload v2) request.
 * @param {object} event
 * @param {import("./saves-core.mjs").SavesDb} db
 * @param {{ allowedOrigins: string[], now: () => number }} env
 */
export async function route(event, db, env) {
    const headers = { "Access-Control-Allow-Origin": corsOrigin(event, env.allowedOrigins) };
    const reply = (statusCode, body = "", type = "text/plain") =>
        ({ statusCode, headers: { ...headers, "Content-Type": type }, body });

    const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!sub) return reply(401, "Unauthorized");

    if (event.routeKey === "GET /saves") {
        const keys = Array.from({ length: SLOT_COUNT }, (_, i) => slotKey(sub, i + 1));
        const items = await db.listItems(keys);
        const list = items.map((it, i) => it
            ? { slot: i + 1, name: it.name ?? `Slot ${i + 1}`, updatedAt: it.updatedAt ?? null, summary: it.summary ?? null }
            : { slot: i + 1, empty: true });
        return reply(200, JSON.stringify(list), "application/json");
    }

    const slot = parseSlot(event.queryStringParameters?.slot);
    if (slot === null) return reply(400, "Bad slot");
    const key = slotKey(sub, slot);

    switch (event.routeKey) {
        case "GET /save": {
            const it = await db.getItem(key);
            return reply(200, it?.data ?? "", "application/json");
        }
        case "PUT /save": {
            const body = event.body;
            if (!body) return reply(400, "Missing body");
            if (body.length > MAX_SAVE_BYTES) return reply(413, "Save too large");
            const summary = summarize(body);
            const result = await db.writeSave({
                key,
                data: body,
                summary,
                defaultName: summary?.hero || `Slot ${slot}`,
                sessionId: event.headers?.["x-session-id"] ?? "unknown",
                now: env.now(),
                force: event.queryStringParameters?.force === "true",
                ttlMs: SESSION_TTL_MS,
            });
            return result === "conflict" ? reply(409, "Session conflict") : reply(200, "OK");
        }
        case "PATCH /save": {
            let name = null;
            try { name = cleanName(JSON.parse(event.body ?? "").name); } catch { /* bad JSON */ }
            if (!name) return reply(400, "Bad name");
            return (await db.rename(key, name)) === "missing" ? reply(404, "Empty slot") : reply(200, "OK");
        }
        case "DELETE /save": {
            await db.remove(key);
            return reply(200, "OK");
        }
        default:
            return reply(404, "Not found");
    }
}
