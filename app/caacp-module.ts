// CAACP — Cybernetic Agentic Communication Protocol endpoint module.
//
// Implements the server-side surface specified at
// rusty-bun: apparatus/docs/cybernetic-agentic-communication-protocol.md §VI.
// Authenticates via the CAACP_TOKEN_VERIFIER env var (shared secret with
// resolver clients' CAACP_TOKEN). Persists message state machine + per-
// message acknowledgments in a dedicated SQLite database under app/data/.
//
// API surface (mounted under CAACP_PATH_PREFIX, default /api/caacp/v1):
//   POST   /messages
//   GET    /inbox/{role}?state=PENDING|ACKNOWLEDGED|IN-FLIGHT
//   GET    /outbox/{role}?unread_acks=true
//   POST   /messages/{message_id}/acknowledge
//   GET    /messages/{message_id}
//
// All endpoints require X-CAACP-Token header matching CAACP_TOKEN_VERIFIER.

import path from "node:path";
import { randomUUID } from "node:crypto";
import Database from "bun:sqlite";

import type { Module } from "@htx/engine";

const CAACP_DB_PATH =
  process.env.CAACP_DB_PATH ??
  path.resolve(import.meta.dir, "./data/caacp.sqlite");

const CAACP_PATH_PREFIX = process.env.CAACP_PATH_PREFIX ?? "/api/caacp/v1";

const VALID_ROLES = ["helmsman", "arbiter", "watcher", "deputy", "keeper"];
const VALID_INTENTS = [
  "request",
  "notification",
  "response",
  "broadcast",
  "acknowledgment",
  "veto-pending",
];
const VALID_ACK_STATES = ["ACKNOWLEDGED", "IN-FLIGHT", "RESOLVED"];

function ensureSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS caacp_messages (
      message_id     TEXT PRIMARY KEY,
      sender         TEXT NOT NULL,
      recipient      TEXT NOT NULL,
      intent         TEXT NOT NULL,
      slug           TEXT NOT NULL,
      related_to     TEXT,
      content_sha    TEXT NOT NULL,
      related_artifacts TEXT,
      expires_at     TEXT,
      state          TEXT NOT NULL DEFAULT 'PENDING',
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      server_timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_msg_recipient_state
      ON caacp_messages(recipient, state);
    CREATE INDEX IF NOT EXISTS idx_msg_sender
      ON caacp_messages(sender);

    CREATE TABLE IF NOT EXISTS caacp_acknowledgments (
      ack_id         TEXT PRIMARY KEY,
      message_id     TEXT NOT NULL,
      ack_author     TEXT NOT NULL,
      ack_intent     TEXT NOT NULL,
      ack_slug       TEXT NOT NULL,
      content_sha    TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      server_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (message_id) REFERENCES caacp_messages(message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_ack_message
      ON caacp_acknowledgments(message_id);
  `);
}

type JsonBody = Record<string, unknown>;

function json(status: number, data: JsonBody | JsonBody[] | { error: string }) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function bad(status: number, message: string) {
  return json(status, { error: message });
}

function unauthorized() {
  return bad(401, "missing or invalid X-CAACP-Token");
}

function parseBody(request: any): JsonBody | null {
  try {
    if (typeof request.body === "string" && request.body.length > 0) {
      return JSON.parse(request.body);
    }
    if (request.body && typeof request.body === "object") {
      return request.body as JsonBody;
    }
    return null;
  } catch {
    return null;
  }
}

function tokenHeader(request: any): string | undefined {
  const headers = request.headers ?? {};
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v as string]),
  );
  return lower["x-caacp-token"];
}

export const caacpModule: Module = {
  name: () => "caacp",
  boot(reg) {
    const db = new Database(CAACP_DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    ensureSchema(db);

    const insertMsg = db.prepare(`
      INSERT INTO caacp_messages (message_id, sender, recipient, intent, slug, related_to, content_sha, related_artifacts, expires_at, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `);
    const getMsg = db.prepare(`SELECT * FROM caacp_messages WHERE message_id = ?`);
    const insertAck = db.prepare(`
      INSERT INTO caacp_acknowledgments (ack_id, message_id, ack_author, ack_intent, ack_slug, content_sha)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateMsgState = db.prepare(`
      UPDATE caacp_messages SET state = ? WHERE message_id = ?
    `);
    const listAcks = db.prepare(`
      SELECT * FROM caacp_acknowledgments WHERE message_id = ? ORDER BY server_timestamp ASC
    `);

    reg.registerMiddleware({
      handle(request, next) {
        const p = request.path || "";
        const method = (request.method || "GET").toUpperCase();

        if (!p.startsWith(CAACP_PATH_PREFIX)) {
          return next();
        }

        const expectedToken = process.env.CAACP_TOKEN_VERIFIER;
        if (!expectedToken) {
          return bad(503, "CAACP endpoint unconfigured (CAACP_TOKEN_VERIFIER unset)");
        }
        const presented = tokenHeader(request);
        if (!presented || presented !== expectedToken) {
          return unauthorized();
        }

        const sub = p.slice(CAACP_PATH_PREFIX.length);

        // POST /messages
        if (method === "POST" && sub === "/messages") {
          const body = parseBody(request);
          if (!body) return bad(400, "invalid JSON body");
          const { sender, recipient, intent, slug, related_to, content_sha, related_artifacts } = body as any;
          if (!sender || !VALID_ROLES.includes(sender)) return bad(400, "invalid sender");
          if (!recipient || !VALID_ROLES.includes(recipient)) return bad(400, "invalid recipient");
          if (!intent || !VALID_INTENTS.includes(intent)) return bad(400, "invalid intent");
          if (!slug || typeof slug !== "string") return bad(400, "missing slug");
          if (!content_sha || typeof content_sha !== "string") return bad(400, "missing content_sha");
          const message_id = randomUUID();
          const related_artifacts_str = Array.isArray(related_artifacts)
            ? JSON.stringify(related_artifacts)
            : null;
          insertMsg.run(
            message_id,
            sender,
            recipient,
            intent,
            slug,
            related_to ?? null,
            content_sha,
            related_artifacts_str,
            (body as any).expires_at ?? null,
          );
          return json(201, {
            message_id,
            state: "PENDING",
            server_timestamp: new Date().toISOString(),
          });
        }

        // GET /inbox/{role}?state=PENDING
        if (method === "GET" && sub.startsWith("/inbox/")) {
          const role = sub.slice("/inbox/".length).replace(/\/$/, "");
          if (!VALID_ROLES.includes(role)) return bad(400, "invalid role");
          const stateFilter = request.query?.state;
          const rows = stateFilter
            ? db.query(`SELECT * FROM caacp_messages WHERE recipient = ? AND state = ? ORDER BY created_at ASC`).all(role, stateFilter)
            : db.query(`SELECT * FROM caacp_messages WHERE recipient = ? ORDER BY created_at ASC`).all(role);
          return json(200, { messages: rows });
        }

        // GET /outbox/{role}?unread_acks=true
        if (method === "GET" && sub.startsWith("/outbox/")) {
          const role = sub.slice("/outbox/".length).replace(/\/$/, "");
          if (!VALID_ROLES.includes(role)) return bad(400, "invalid role");
          const rows = db.query(`
            SELECT m.*,
                   (SELECT ack_intent FROM caacp_acknowledgments WHERE message_id = m.message_id ORDER BY server_timestamp DESC LIMIT 1) AS last_ack_state,
                   (SELECT server_timestamp FROM caacp_acknowledgments WHERE message_id = m.message_id ORDER BY server_timestamp DESC LIMIT 1) AS last_ack_at
            FROM caacp_messages m
            WHERE m.sender = ?
            ORDER BY m.created_at ASC
          `).all(role);
          return json(200, { messages: rows });
        }

        // POST /messages/{id}/acknowledge
        if (method === "POST" && sub.startsWith("/messages/") && sub.endsWith("/acknowledge")) {
          const message_id = sub.slice("/messages/".length, sub.length - "/acknowledge".length);
          const body = parseBody(request);
          if (!body) return bad(400, "invalid JSON body");
          const { ack_author, ack_intent, ack_slug, content_sha } = body as any;
          if (!ack_author || !VALID_ROLES.includes(ack_author)) return bad(400, "invalid ack_author");
          if (!ack_intent || !VALID_ACK_STATES.includes(ack_intent)) return bad(400, "invalid ack_intent");
          if (!ack_slug || typeof ack_slug !== "string") return bad(400, "missing ack_slug");
          if (!content_sha || typeof content_sha !== "string") return bad(400, "missing content_sha");
          const original = getMsg.get(message_id);
          if (!original) return bad(404, "message not found");
          const ack_id = randomUUID();
          insertAck.run(ack_id, message_id, ack_author, ack_intent, ack_slug, content_sha);
          updateMsgState.run(ack_intent, message_id);
          return json(201, {
            ack_id,
            message_id,
            state: ack_intent,
            server_timestamp: new Date().toISOString(),
          });
        }

        // GET /messages/{id}
        if (method === "GET" && sub.startsWith("/messages/") && !sub.endsWith("/acknowledge")) {
          const message_id = sub.slice("/messages/".length).replace(/\/$/, "");
          const original = getMsg.get(message_id);
          if (!original) return bad(404, "message not found");
          const acks = listAcks.all(message_id);
          return json(200, { message: original, acknowledgments: acks });
        }

        return bad(404, "unknown CAACP path");
      },
    });
  },
};
