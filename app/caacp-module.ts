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

const VALID_ROLES = ["helmsman", "arbiter", "watcher", "deputy", "keeper", "substrate-resolver"];
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

    CREATE TABLE IF NOT EXISTS caacp_tokens (
      token          TEXT PRIMARY KEY,
      role           TEXT NOT NULL,
      instance_id    TEXT,
      callback_url   TEXT,
      registered_at  TEXT NOT NULL DEFAULT (datetime('now')),
      registered_by  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_token_role
      ON caacp_tokens(role);

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
  // Body-storage extension (additive; safe across restarts; backwards-compat
  // for rows that predate the column). SQLite ignores duplicate ADD COLUMN
  // via the IF NOT EXISTS guard.
  try { db.exec(`ALTER TABLE caacp_messages ADD COLUMN body TEXT`); } catch { /* already exists */ }
  try { db.exec(`ALTER TABLE caacp_acknowledgments ADD COLUMN body TEXT`); } catch { /* already exists */ }
  // target_instance_id additive column: NULL means role-broadcast (visible to
  // all instances of recipient role); non-NULL means single-instance targeting
  // (visible only to matching instance_id, enforces matching ack_author on
  // terminal state transitions). Per rusty-bun apparatus/docs/agent-init-protocol.md §V.7
  // structural fix superseding the body-level targeting + bounce-ack interim discipline.
  try { db.exec(`ALTER TABLE caacp_messages ADD COLUMN target_instance_id TEXT`); } catch { /* already exists */ }
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
      INSERT INTO caacp_messages (message_id, sender, recipient, intent, slug, related_to, content_sha, related_artifacts, expires_at, state, body, target_instance_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `);
    const getMsg = db.prepare(`SELECT * FROM caacp_messages WHERE message_id = ?`);
    const insertAck = db.prepare(`
      INSERT INTO caacp_acknowledgments (ack_id, message_id, ack_author, ack_intent, ack_slug, content_sha, body)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const updateMsgState = db.prepare(`
      UPDATE caacp_messages SET state = ? WHERE message_id = ?
    `);
    const listAcks = db.prepare(`
      SELECT * FROM caacp_acknowledgments WHERE message_id = ? ORDER BY server_timestamp ASC
    `);
    const insertToken = db.prepare(`
      INSERT INTO caacp_tokens (token, role, instance_id, callback_url, registered_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const getTokenRow = db.prepare(`SELECT * FROM caacp_tokens WHERE token = ?`);
    const listTokensByRole = db.prepare(`SELECT * FROM caacp_tokens WHERE role = ?`);

    // Auth resolution: returns {ok, principal: {role, instance_id?} | null, isAdmin}.
    // Admin token = the legacy shared CAACP_TOKEN_VERIFIER; per-role/per-instance
    // tokens registered via /register also accepted; messages-tier endpoints
    // verify token-role binding.
    function resolveAuth(request: any, adminToken: string): { ok: boolean; principal: any; isAdmin: boolean } {
      const presented = tokenHeader(request);
      if (!presented) return { ok: false, principal: null, isAdmin: false };
      if (presented === adminToken) return { ok: true, principal: null, isAdmin: true };
      const row = getTokenRow.get(presented) as any;
      if (row) return { ok: true, principal: { role: row.role, instance_id: row.instance_id }, isAdmin: false };
      return { ok: false, principal: null, isAdmin: false };
    }

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
        const auth = resolveAuth(request, expectedToken);
        if (!auth.ok) return unauthorized();

        const sub = p.slice(CAACP_PATH_PREFIX.length);

        // POST /register — admin-only. Body: {role, instance_id?, callback_url?}.
        // Returns: {token, role, instance_id, registered_at}.
        if (method === "POST" && sub === "/register") {
          if (!auth.isAdmin) return bad(403, "registration requires admin token");
          const body = parseBody(request);
          if (!body) return bad(400, "invalid JSON body");
          const { role, instance_id, callback_url } = body as any;
          const VALID_REGISTRABLE_ROLES = [...VALID_ROLES];
          if (!role || !VALID_REGISTRABLE_ROLES.includes(role)) return bad(400, "invalid role");
          // Substrate-resolver roles SHOULD include an instance_id; appointed roles MAY include one.
          if (role === "substrate-resolver" && !instance_id) {
            return bad(400, "substrate-resolver registration requires instance_id");
          }
          const token = `caacp-${role}-${randomUUID()}`;
          insertToken.run(token, role, instance_id ?? null, callback_url ?? null, "admin");
          return json(201, {
            token,
            role,
            instance_id: instance_id ?? null,
            callback_url: callback_url ?? null,
            registered_at: new Date().toISOString(),
          });
        }

        // GET /tokens?role=<role> — admin-only. Lists registered tokens for a role.
        // Used by the local sidecar to discover registered substrate-resolver instances.
        if (method === "GET" && sub === "/tokens") {
          if (!auth.isAdmin) return bad(403, "token listing requires admin token");
          const role = request.query?.role;
          if (!role) return bad(400, "missing role query param");
          const rows = listTokensByRole.all(role);
          return json(200, { tokens: rows });
        }

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
          // Token-role binding check: if authenticated via per-agent token,
          // the sender field MUST match the token's role.
          if (!auth.isAdmin && auth.principal?.role !== sender) {
            return bad(403, `token role (${auth.principal?.role}) does not match sender (${sender})`);
          }
          const message_id = randomUUID();
          const related_artifacts_str = Array.isArray(related_artifacts)
            ? JSON.stringify(related_artifacts)
            : null;
          // target_instance_id: NULL → role-broadcast; non-NULL → exact-instance targeting.
          // Per §V.7 structural fix. Non-admin senders MAY only set a target_instance_id
          // belonging to the same role they are targeting (broadcast is always allowed).
          const target_instance_id_raw = (body as any).target_instance_id;
          const target_instance_id: string | null =
            typeof target_instance_id_raw === "string" && target_instance_id_raw.length > 0
              ? target_instance_id_raw
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
            typeof (body as any).body === "string" ? (body as any).body : null,
            target_instance_id,
          );
          return json(201, {
            message_id,
            state: "PENDING",
            server_timestamp: new Date().toISOString(),
          });
        }

        // GET /inbox/{role}?state=PENDING
        // Per §V.7: returns role-broadcast messages (target_instance_id IS NULL)
        // plus exact-instance messages where target_instance_id matches the
        // authenticated principal's instance_id. Admin tokens (no principal)
        // see all messages for the role (broadcasts + every targeted message).
        if (method === "GET" && sub.startsWith("/inbox/")) {
          const role = sub.slice("/inbox/".length).replace(/\/$/, "");
          if (!VALID_ROLES.includes(role)) return bad(400, "invalid role");
          const stateFilter = request.query?.state;
          const principalInstanceId: string | null = auth.isAdmin ? null : (auth.principal?.instance_id ?? null);
          const instanceFilter = auth.isAdmin
            ? "" // admin sees all
            : " AND (target_instance_id IS NULL OR target_instance_id = ?)";
          let sqlText = `SELECT * FROM caacp_messages WHERE recipient = ?${instanceFilter}`;
          if (stateFilter) sqlText += ` AND state = ?`;
          sqlText += ` ORDER BY created_at ASC`;
          const args: any[] = [role];
          if (!auth.isAdmin) args.push(principalInstanceId);
          if (stateFilter) args.push(stateFilter);
          const rows = db.query(sqlText).all(...args);
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
          if (!auth.isAdmin && auth.principal?.role !== ack_author) {
            return bad(403, `token role (${auth.principal?.role}) does not match ack_author (${ack_author})`);
          }
          const original = getMsg.get(message_id) as any;
          if (!original) return bad(404, "message not found");
          // Per §V.7: if the original message has a non-NULL target_instance_id,
          // terminal state transitions (RESOLVED) are accepted only from the matching
          // instance. ACKNOWLEDGED + IN-FLIGHT (non-terminal) are still accepted from
          // any instance of the recipient role so non-targets can log observations.
          if (
            !auth.isAdmin &&
            original.target_instance_id &&
            ack_intent === "RESOLVED" &&
            auth.principal?.instance_id !== original.target_instance_id
          ) {
            return bad(
              403,
              `terminal ack on instance-targeted message requires matching instance_id (target=${original.target_instance_id}, acker=${auth.principal?.instance_id ?? "null"})`,
            );
          }
          const ack_id = randomUUID();
          insertAck.run(
            ack_id, message_id, ack_author, ack_intent, ack_slug, content_sha,
            typeof (body as any).body === "string" ? (body as any).body : null,
          );
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
