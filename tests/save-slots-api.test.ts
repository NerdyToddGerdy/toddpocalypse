import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cleanName, NAME_MAX, parseSlot, route, SLOT_COUNT, slotKey, summarize,
  type ApiEvent, type SavesDb, type SlotItem,
} from "../infra/lambda/saves-core.mjs";

/**
 * The save API behind cloud save: five named slots per player. Slot 1 is the
 * record every player already has, so existing cloud saves become slot 1.
 * Routing is tested here against an in-memory store with the same rules as
 * the DynamoDB adapter (the session lock, keep-the-name-on-save).
 */

const SUB = "user-123";
const save = (hero = "Aldric", best = 44) => JSON.stringify({
  party: [{ name: hero, character_class: "fighter", level: 29 }],
  highest_level: 40, lifetime_best_level: best, total_prestiges: 3,
});

/** An in-memory SavesDb with the adapter's semantics. */
function memoryDb(): SavesDb & { items: Map<string, SlotItem & { sessionId?: string; sessionExpiry?: number }> } {
  const items = new Map<string, SlotItem & { sessionId?: string; sessionExpiry?: number }>();
  return {
    items,
    async getItem(key) { return items.get(key) ?? null; },
    async listItems(keys) { return keys.map((k) => items.get(k) ?? null); },
    async writeSave({ key, data, defaultName, summary, sessionId, now, force, ttlMs }) {
      const cur = items.get(key);
      if (!force && cur?.sessionId && cur.sessionId !== sessionId && (cur.sessionExpiry ?? 0) >= now) return "conflict";
      items.set(key, { data, name: cur?.name ?? defaultName, summary, updatedAt: new Date(now).toISOString(), sessionId, sessionExpiry: now + ttlMs });
      return "ok";
    },
    async rename(key, name) {
      const cur = items.get(key);
      if (!cur) return "missing";
      cur.name = name;
      return "ok";
    },
    async remove(key) { items.delete(key); },
  };
}

const ENV = { allowedOrigins: ["http://localhost:8080", "https://nerdytoddgerdy.github.io"], now: () => 1_000_000 };

function ev(routeKey: string, opts: { slot?: string; body?: string; force?: boolean; session?: string; sub?: string | null; origin?: string } = {}): ApiEvent {
  const claims: Record<string, string> = opts.sub === null ? {} : { sub: opts.sub ?? SUB };
  const qs: Record<string, string> = {};
  if (opts.slot !== undefined) qs.slot = opts.slot;
  if (opts.force) qs.force = "true";
  return {
    routeKey,
    queryStringParameters: Object.keys(qs).length ? qs : undefined,
    headers: { "x-session-id": opts.session ?? "dev-a", origin: opts.origin ?? "https://nerdytoddgerdy.github.io" },
    body: opts.body,
    requestContext: { authorizer: { jwt: { claims } } },
  };
}

describe("slot keys", () => {
  it("slot 1 is the record players already have; the rest are their own records", () => {
    expect(slotKey(SUB, 1)).toBe(SUB);
    expect(slotKey(SUB, 2)).toBe(`${SUB}#2`);
    expect(slotKey(SUB, 5)).toBe(`${SUB}#5`);
  });

  it("an absent slot means slot 1, so older clients keep working", () => {
    expect(parseSlot(undefined)).toBe(1);
  });

  it.each(["0", "6", "1.5", "abc", "-1", ""])("rejects slot %j", (s) => {
    expect(parseSlot(s)).toBeNull();
  });

  it("allows exactly five", () => {
    expect(SLOT_COUNT).toBe(5);
    for (let n = 1; n <= 5; n++) expect(parseSlot(String(n))).toBe(n);
  });
});

describe("cleanName", () => {
  it("trims and collapses spaces", () => {
    expect(cleanName("  Main   run ")).toBe("Main run");
  });
  it("strips control characters", () => {
    expect(cleanName("Back\u0000up\n")).toBe("Backup");
  });
  it("caps the length", () => {
    expect(cleanName("x".repeat(100))).toHaveLength(NAME_MAX);
  });
  it("refuses an empty or non-text name", () => {
    expect(cleanName("   ")).toBeNull();
    expect(cleanName(42)).toBeNull();
  });
});

describe("summarize", () => {
  it("reads the lead hero, their level and the best floor from the save", () => {
    expect(summarize(save())).toEqual({ hero: "Aldric", cls: "fighter", level: 29, best: 44 });
  });
  it("is null for a save it can't read", () => {
    expect(summarize("not json")).toBeNull();
  });
});

describe("routes", () => {
  it("refuses a request without a signed-in user", async () => {
    const res = await route(ev("GET /saves", { sub: null }), memoryDb(), ENV);
    expect(res.statusCode).toBe(401);
  });

  it("PUT then GET round-trips a slot's save", async () => {
    const db = memoryDb();
    expect((await route(ev("PUT /save", { slot: "3", body: save() }), db, ENV)).statusCode).toBe(200);
    const res = await route(ev("GET /save", { slot: "3" }), db, ENV);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(save());
    expect(db.items.has(`${SUB}#3`)).toBe(true);
  });

  it("GET of an empty slot returns an empty body", async () => {
    const res = await route(ev("GET /save", { slot: "2" }), memoryDb(), ENV);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("");
  });

  it("names a new slot after its lead hero, and keeps a chosen name on later saves", async () => {
    const db = memoryDb();
    await route(ev("PUT /save", { slot: "2", body: save("Vesper") }), db, ENV);
    expect(db.items.get(`${SUB}#2`)!.name).toBe("Vesper");
    await route(ev("PATCH /save", { slot: "2", body: JSON.stringify({ name: "Speed run" }) }), db, ENV);
    await route(ev("PUT /save", { slot: "2", body: save("Vesper", 50) }), db, ENV);
    expect(db.items.get(`${SUB}#2`)!.name).toBe("Speed run");
  });

  it("lists all five slots, empty ones marked, without the save data", async () => {
    const db = memoryDb();
    await route(ev("PUT /save", { slot: "1", body: save() }), db, ENV);
    await route(ev("PUT /save", { slot: "4", body: save("Lyric", 12) }), db, ENV);
    const res = await route(ev("GET /saves"), db, ENV);
    const list = JSON.parse(res.body);
    expect(list).toHaveLength(5);
    expect(list[0]).toMatchObject({ slot: 1, name: "Aldric", summary: { hero: "Aldric", best: 44 } });
    expect(list[1]).toEqual({ slot: 2, empty: true });
    expect(list[3]).toMatchObject({ slot: 4, name: "Lyric", summary: { best: 12 } });
    expect(res.body).not.toContain("party");
  });

  it("holds the session lock per slot, and force takes it over", async () => {
    const db = memoryDb();
    await route(ev("PUT /save", { slot: "2", body: save(), session: "dev-a" }), db, ENV);
    expect((await route(ev("PUT /save", { slot: "2", body: save(), session: "dev-b" }), db, ENV)).statusCode).toBe(409);
    // A different slot isn't locked by it.
    expect((await route(ev("PUT /save", { slot: "3", body: save(), session: "dev-b" }), db, ENV)).statusCode).toBe(200);
    expect((await route(ev("PUT /save", { slot: "2", body: save(), session: "dev-b", force: true }), db, ENV)).statusCode).toBe(200);
  });

  it("renames, refusing a bad name or an empty slot", async () => {
    const db = memoryDb();
    await route(ev("PUT /save", { slot: "2", body: save() }), db, ENV);
    expect((await route(ev("PATCH /save", { slot: "2", body: JSON.stringify({ name: "  " }) }), db, ENV)).statusCode).toBe(400);
    expect((await route(ev("PATCH /save", { slot: "5", body: JSON.stringify({ name: "Hi" }) }), db, ENV)).statusCode).toBe(404);
    expect((await route(ev("PATCH /save", { slot: "2", body: "nope" }), db, ENV)).statusCode).toBe(400);
  });

  it("deletes a slot", async () => {
    const db = memoryDb();
    await route(ev("PUT /save", { slot: "2", body: save() }), db, ENV);
    expect((await route(ev("DELETE /save", { slot: "2" }), db, ENV)).statusCode).toBe(200);
    expect(db.items.has(`${SUB}#2`)).toBe(false);
  });

  it("refuses an invalid slot or a missing body", async () => {
    const db = memoryDb();
    expect((await route(ev("GET /save", { slot: "9" }), db, ENV)).statusCode).toBe(400);
    expect((await route(ev("PUT /save", { slot: "2" }), db, ENV)).statusCode).toBe(400);
  });

  it("answers CORS for the live site's origin, which has no path", async () => {
    const res = await route(ev("GET /saves"), memoryDb(), ENV);
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://nerdytoddgerdy.github.io");
  });

  it("404s a route it doesn't know", async () => {
    expect((await route(ev("POST /save"), memoryDb(), ENV)).statusCode).toBe(404);
  });
});

// The bug behind "Could not reach the server": a browser's Origin never has a
// path, so an allowed origin with one never matches and every request is blocked.
describe("infra CORS origins", () => {
  const infra = readFileSync(fileURLToPath(new URL("../infra/index.ts", import.meta.url)), "utf8");
  const origins = (name: string) => JSON.parse(infra.match(new RegExp(`const ${name} = (\\[[^\\]]*\\])`))![1].replace(/,\s*\]/, "]")) as string[];

  it("lists bare origins for CORS", () => {
    const cors = origins("corsOrigins");
    expect(cors).toContain("https://nerdytoddgerdy.github.io");
    for (const o of cors) expect(new URL(o).pathname).toBe("/");
    for (const o of cors) expect(o.endsWith("/")).toBe(false);
  });

  it("CORS and the Lambda use the bare origins; sign-in redirects keep the full URLs", () => {
    expect(infra).toMatch(/allowOrigins: corsOrigins/);
    expect(infra).toMatch(/ALLOWED_ORIGINS: corsOrigins\.join\(","\)/);
    expect(infra).toMatch(/callbackUrls: gameOrigins/);
  });

  it("allows the methods the slots need", () => {
    expect(infra).toMatch(/allowMethods: \["GET", "PUT", "PATCH", "DELETE", "OPTIONS"\]/);
  });

  it("routes every slot call to the API", () => {
    const table = infra.slice(infra.indexOf("const saveRoutes"), infra.indexOf("for (const [name, routeKey] of saveRoutes)"));
    for (const r of ["GET /save", "PUT /save", "PATCH /save", "DELETE /save", "GET /saves"]) {
      expect(table).toContain(`"${r}"]`);
    }
  });
});
