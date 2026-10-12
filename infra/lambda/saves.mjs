// Lambda entry point for the save API: saves-core.mjs's routes on DynamoDB.
// The AWS SDK v3 ships with the Node.js 20 runtime, so nothing is bundled.

import {
    BatchGetItemCommand, DeleteItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { route } from "./saves-core.mjs";

const client = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME;
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

const k = (key) => ({ userId: { S: key } });

/** A stored item as the routes see it. */
function fromItem(item) {
    if (!item) return null;
    let summary = null;
    try { summary = item.summary?.S ? JSON.parse(item.summary.S) : null; } catch { /* old record */ }
    return { data: item.data?.S, name: item.name?.S, updatedAt: item.updatedAt?.S, summary };
}

const db = {
    async getItem(key) {
        const r = await client.send(new GetItemCommand({ TableName: TABLE, Key: k(key) }));
        return fromItem(r.Item);
    },

    // Names and summaries only: the list never carries the saves themselves.
    async listItems(keys) {
        const r = await client.send(new BatchGetItemCommand({
            RequestItems: {
                [TABLE]: {
                    Keys: keys.map(k),
                    ProjectionExpression: "userId, #n, #u, #s",
                    ExpressionAttributeNames: { "#n": "name", "#u": "updatedAt", "#s": "summary" },
                },
            },
        }));
        const byKey = new Map((r.Responses?.[TABLE] ?? []).map((it) => [it.userId.S, it]));
        return keys.map((key) => fromItem(byKey.get(key)));
    },

    async writeSave(w) {
        const params = {
            TableName: TABLE,
            Key: k(w.key),
            UpdateExpression: "SET #d = :d, #u = :u, #sid = :sid, #exp = :exp, #s = :sum, #n = if_not_exists(#n, :defname)",
            ExpressionAttributeNames: { "#d": "data", "#n": "name", "#u": "updatedAt", "#s": "summary", "#sid": "sessionId", "#exp": "sessionExpiry" },
            ExpressionAttributeValues: {
                ":d": { S: w.data },
                ":u": { S: new Date(w.now).toISOString() },
                ":sid": { S: w.sessionId },
                ":exp": { N: String(w.now + w.ttlMs) },
                ":sum": { S: JSON.stringify(w.summary) },
                ":defname": { S: w.defaultName },
            },
        };
        if (!w.force) {
            params.ConditionExpression = "attribute_not_exists(#sid) OR #sid = :sid OR #exp < :now";
            params.ExpressionAttributeValues[":now"] = { N: String(w.now) };
        }
        try {
            await client.send(new UpdateItemCommand(params));
            return "ok";
        } catch (e) {
            if (e.name === "ConditionalCheckFailedException") return "conflict";
            throw e;
        }
    },

    async rename(key, name) {
        try {
            await client.send(new UpdateItemCommand({
                TableName: TABLE,
                Key: k(key),
                UpdateExpression: "SET #n = :n",
                ConditionExpression: "attribute_exists(userId)",
                ExpressionAttributeNames: { "#n": "name" },
                ExpressionAttributeValues: { ":n": { S: name } },
            }));
            return "ok";
        } catch (e) {
            if (e.name === "ConditionalCheckFailedException") return "missing";
            throw e;
        }
    },

    async remove(key) {
        await client.send(new DeleteItemCommand({ TableName: TABLE, Key: k(key) }));
    },
};

export const handler = async (event) => {
    try {
        return await route(event, db, { allowedOrigins: ALLOWED, now: () => Date.now() });
    } catch (e) {
        console.error(e);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": ALLOWED[0] ?? "*" }, body: "Internal error" };
    }
};
