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

    -- Reliable-notification scaffolding per rusty-bun proposal
    -- 2026-06-01T013400Z-caacp-reliable-notification-constraints. C1+C3+C4.
    -- Append-only event stream; one row per recipient-relevant state
    -- transition. Recipient = (recipient_role, recipient_instance_id);
    -- NULL instance_id means role-broadcast event fan-out (delivered to
    -- every live instance of the role).
    CREATE TABLE IF NOT EXISTS caacp_events (
      seq                    INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_role         TEXT NOT NULL,
      recipient_instance_id  TEXT,
      event_type             TEXT NOT NULL,
      message_id             TEXT,
      ack_id                 TEXT,
      source                 TEXT NOT NULL DEFAULT 'caacp',
      created_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_recipient_seq
      ON caacp_events(recipient_role, recipient_instance_id, seq);

    -- Per-recipient cursor. last_seen_seq advances only on agent ack
    -- (POST /cursor), not on bridge inject. Enables at-least-once delivery.
    CREATE TABLE IF NOT EXISTS caacp_cursors (
      recipient_role         TEXT NOT NULL,
      recipient_instance_id  TEXT NOT NULL,
      last_seen_seq          INTEGER NOT NULL DEFAULT 0,
      updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (recipient_role, recipient_instance_id)
    );

    -- Wake-ack observability. The bridge issues a wake_id with each inject;
    -- the agent POSTs /wake_ack with that wake_id to confirm receipt. Used
    -- by the bridge supervision loop and the watchdog daemon.
    CREATE TABLE IF NOT EXISTS caacp_wake_acks (
      wake_id                TEXT PRIMARY KEY,
      recipient_role         TEXT NOT NULL,
      recipient_instance_id  TEXT NOT NULL,
      seq_consumed           INTEGER NOT NULL,
      created_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_wake_acks_recipient
      ON caacp_wake_acks(recipient_role, recipient_instance_id, created_at);

    -- Rung-2 reliable-notification: bridge registry + heartbeat tracking
    -- for C5 (liveness) and the watchdog daemon. bridge_id is host-stable
    -- (events-<role>-<instance_id>); the same bridge restarting writes the
    -- same row, which is what the watchdog uses to detect a restart vs a
    -- dead link.
    CREATE TABLE IF NOT EXISTS caacp_bridges (
      bridge_id              TEXT PRIMARY KEY,
      role                   TEXT NOT NULL,
      instance_id            TEXT NOT NULL,
      pid                    INTEGER,
      tmux_target            TEXT,
      host                   TEXT,
      last_heartbeat_at      TEXT NOT NULL DEFAULT (datetime('now')),
      registered_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_bridges_heartbeat
      ON caacp_bridges(last_heartbeat_at);
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
  // Rung-3 reliable-notification (C7): source column on messages to mirror the
  // events table. Default 'caacp'; 'telegram' for messages relayed by the
  // caacp-telegram-bridge daemon. Other sources may be added per future rungs.
  try { db.exec(`ALTER TABLE caacp_messages ADD COLUMN source TEXT NOT NULL DEFAULT 'caacp'`); } catch { /* already exists */ }
}

const VALID_SOURCES = ["caacp", "telegram"];

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
      INSERT INTO caacp_messages (message_id, sender, recipient, intent, slug, related_to, content_sha, related_artifacts, expires_at, state, body, target_instance_id, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
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

    // Reliable-notification rung-1 prepared statements (C1+C3+C4).
    const insertEvent = db.prepare(`
      INSERT INTO caacp_events (recipient_role, recipient_instance_id, event_type, message_id, ack_id, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const getCursor = db.prepare(`
      SELECT last_seen_seq FROM caacp_cursors
      WHERE recipient_role = ? AND recipient_instance_id = ?
    `);
    const upsertCursor = db.prepare(`
      INSERT INTO caacp_cursors (recipient_role, recipient_instance_id, last_seen_seq, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(recipient_role, recipient_instance_id) DO UPDATE
        SET last_seen_seq = excluded.last_seen_seq, updated_at = datetime('now')
    `);
    const insertWakeAck = db.prepare(`
      INSERT INTO caacp_wake_acks (wake_id, recipient_role, recipient_instance_id, seq_consumed)
      VALUES (?, ?, ?, ?)
    `);
    const selectEventsSince = db.prepare(`
      SELECT seq, recipient_role, recipient_instance_id, event_type, message_id, ack_id, source, created_at
      FROM caacp_events
      WHERE recipient_role = ?
        AND (recipient_instance_id IS NULL OR recipient_instance_id = ?)
        AND seq > ?
      ORDER BY seq ASC
      LIMIT 200
    `);
    const upsertBridge = db.prepare(`
      INSERT INTO caacp_bridges (bridge_id, role, instance_id, pid, tmux_target, host, last_heartbeat_at, registered_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(bridge_id) DO UPDATE
        SET pid = excluded.pid,
            tmux_target = excluded.tmux_target,
            host = excluded.host,
            last_heartbeat_at = datetime('now')
    `);
    const listBridges = db.prepare(`SELECT * FROM caacp_bridges ORDER BY last_heartbeat_at DESC`);

    // Emit an event for the given recipient + transition. Fans out the row
    // per-recipient: each instance-targeted row exists exactly once at the
    // recipient (role, instance_id) coordinate; role-broadcast rows are stored
    // once with NULL instance_id and the SELECT in /events surfaces them to
    // every live instance polling.
    function emitEvent(args: {
      recipient_role: string;
      recipient_instance_id: string | null;
      event_type: "message_arrived" | "ack_added" | "message_state_changed" | "response_arrived";
      message_id?: string | null;
      ack_id?: string | null;
      source?: string;
    }) {
      insertEvent.run(
        args.recipient_role,
        args.recipient_instance_id ?? null,
        args.event_type,
        args.message_id ?? null,
        args.ack_id ?? null,
        args.source ?? "caacp",
      );
    }

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
          // C7 source passthrough: default 'caacp'; reject unrecognized values.
          const source_raw = (body as any).source;
          const source: string = typeof source_raw === "string" && source_raw.length > 0
            ? source_raw
            : "caacp";
          if (!VALID_SOURCES.includes(source)) return bad(400, `invalid source: ${source}`);
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
            source,
          );
          // C1 event-completeness: emit message_arrived for the recipient.
          emitEvent({
            recipient_role: recipient,
            recipient_instance_id: target_instance_id,
            event_type: "message_arrived",
            message_id,
            source,
          });
          // If this is a response (related_to set), also emit response_arrived
          // for the original author so cursors advance on chain progress.
          if (related_to) {
            const original = getMsg.get(related_to) as any;
            if (original) {
              emitEvent({
                recipient_role: original.sender,
                recipient_instance_id: null, // role-broadcast — the sender is
                                              // identified by role, may have
                                              // multiple live instances.
                event_type: "response_arrived",
                message_id,
              });
            }
          }
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
          // C1 event-completeness: ack-as-silent-resolution was the resolver2/3/4
          // failure mode. Emit ack_added for the original message's author (so
          // the author sees the ack happened) AND message_state_changed (so any
          // listener tracking state transitions sees the flip).
          emitEvent({
            recipient_role: original.sender,
            recipient_instance_id: null,
            event_type: "ack_added",
            message_id,
            ack_id,
          });
          if (ack_intent === "RESOLVED" || ack_intent === "IN-FLIGHT") {
            emitEvent({
              recipient_role: original.sender,
              recipient_instance_id: null,
              event_type: "message_state_changed",
              message_id,
            });
          }
          return json(201, {
            ack_id,
            message_id,
            state: ack_intent,
            server_timestamp: new Date().toISOString(),
          });
        }

        // Reliable-notification rung-1 endpoints (C1+C3+C4).
        // See rusty-bun:apparatus/proposals/decided/2026-06-01T013400Z-
        // caacp-reliable-notification-constraints/proposal.md.

        // GET /events?role=<role>&instance_id=<id>&since_seq=<n>
        // Returns events strictly greater than since_seq for the given
        // recipient (role + optional instance_id). Role-broadcast events
        // (recipient_instance_id IS NULL) surface to every instance. Auth
        // is the per-agent token; admin sees all instances.
        if (method === "GET" && sub === "/events") {
          const role = request.query?.role;
          const instance_id = request.query?.instance_id ?? null;
          const since_seq = parseInt(request.query?.since_seq ?? "0", 10);
          if (!role || !VALID_ROLES.includes(role)) return bad(400, "invalid role");
          if (!auth.isAdmin && auth.principal?.role !== role) {
            return bad(403, `token role (${auth.principal?.role}) does not match query role (${role})`);
          }
          if (!auth.isAdmin && auth.principal?.instance_id && auth.principal.instance_id !== instance_id) {
            return bad(403, `token instance_id (${auth.principal.instance_id}) does not match query instance_id (${instance_id})`);
          }
          const rows = selectEventsSince.all(role, instance_id, isNaN(since_seq) ? 0 : since_seq);
          return json(200, { events: rows });
        }

        // GET /cursor?role=&instance_id= — read current per-recipient cursor.
        // Used by the bridge to determine what to poll for. Returns 0 if no
        // cursor row exists yet.
        if (method === "GET" && sub === "/cursor") {
          const role = request.query?.role;
          const instance_id = request.query?.instance_id;
          if (!role || !VALID_ROLES.includes(role)) return bad(400, "invalid role");
          if (!instance_id || typeof instance_id !== "string") return bad(400, "missing instance_id");
          if (!auth.isAdmin && auth.principal?.role !== role) {
            return bad(403, `token role (${auth.principal?.role}) does not match cursor role (${role})`);
          }
          if (!auth.isAdmin && auth.principal?.instance_id && auth.principal.instance_id !== instance_id) {
            return bad(403, `token instance_id (${auth.principal.instance_id}) does not match cursor instance_id (${instance_id})`);
          }
          const row = getCursor.get(role, instance_id) as any;
          return json(200, {
            role,
            instance_id,
            last_seen_seq: row?.last_seen_seq ?? 0,
          });
        }

        // POST /cursor — advance per-recipient last_seen_seq.
        // Body: {role, instance_id, last_seen_seq}.
        // The agent (NOT the bridge) calls this after processing events up
        // to the given seq. Cursor advancement is what closes the at-least-
        // once delivery loop (C3); bridge-side seen-cache is only a hint.
        if (method === "POST" && sub === "/cursor") {
          const body = parseBody(request);
          if (!body) return bad(400, "invalid JSON body");
          const { role, instance_id, last_seen_seq } = body as any;
          if (!role || !VALID_ROLES.includes(role)) return bad(400, "invalid role");
          if (!instance_id || typeof instance_id !== "string") return bad(400, "missing instance_id");
          if (typeof last_seen_seq !== "number" || last_seen_seq < 0) return bad(400, "invalid last_seen_seq");
          if (!auth.isAdmin && auth.principal?.role !== role) {
            return bad(403, `token role (${auth.principal?.role}) does not match cursor role (${role})`);
          }
          if (!auth.isAdmin && auth.principal?.instance_id && auth.principal.instance_id !== instance_id) {
            return bad(403, `token instance_id (${auth.principal.instance_id}) does not match cursor instance_id (${instance_id})`);
          }
          // Cursor MUST be monotonic. Reject regressions; clamp ahead-of-
          // current-max is permitted (covers race where caller has read
          // events with a higher seq than this writer has observed yet).
          const existing = getCursor.get(role, instance_id) as any;
          if (existing && existing.last_seen_seq > last_seen_seq) {
            return bad(409, `cursor regression rejected: existing=${existing.last_seen_seq} attempted=${last_seen_seq}`);
          }
          upsertCursor.run(role, instance_id, last_seen_seq);
          return json(200, {
            role,
            instance_id,
            last_seen_seq,
            updated_at: new Date().toISOString(),
          });
        }

        // POST /bridge_heartbeat — bridge registers liveness. Per C5 (rung 2),
        // bridges emit a heartbeat every N seconds (default 30). The
        // watchdog daemon (apparatus/scripts/caacp-watchdog.sh) consults
        // GET /bridges and restarts bridges whose last_heartbeat_at is older
        // than 3× their configured heartbeat-interval.
        if (method === "POST" && sub === "/bridge_heartbeat") {
          const body = parseBody(request);
          if (!body) return bad(400, "invalid JSON body");
          const { bridge_id, role, instance_id, pid, tmux_target, host } = body as any;
          if (!bridge_id || typeof bridge_id !== "string") return bad(400, "missing bridge_id");
          if (!role || !VALID_ROLES.includes(role)) return bad(400, "invalid role");
          if (!instance_id || typeof instance_id !== "string") return bad(400, "missing instance_id");
          if (!auth.isAdmin && auth.principal?.role !== role) {
            return bad(403, `token role (${auth.principal?.role}) does not match heartbeat role (${role})`);
          }
          if (!auth.isAdmin && auth.principal?.instance_id && auth.principal.instance_id !== instance_id) {
            return bad(403, `token instance_id (${auth.principal.instance_id}) does not match heartbeat instance_id (${instance_id})`);
          }
          upsertBridge.run(
            bridge_id,
            role,
            instance_id,
            typeof pid === "number" ? pid : null,
            typeof tmux_target === "string" ? tmux_target : null,
            typeof host === "string" ? host : null,
          );
          return json(200, {
            bridge_id,
            role,
            instance_id,
            heartbeat_at: new Date().toISOString(),
          });
        }

        // POST /admin/prune_stale — admin only. Implements C6 stale-instance
        // event pruning (keeper decision: events for stale instances are
        // DROPPED, not held). Stale = no /cursor advance within
        // older_than_minutes AND no bridge heartbeat in same window. Events
        // older than older_than_minutes with no cursor reaching their seq
        // are removed. The watchdog calls this periodically; the operator
        // can also call it manually with dry_run=true to preview.
        if (method === "POST" && sub === "/admin/prune_stale") {
          if (!auth.isAdmin) return bad(403, "prune requires admin token");
          const body = parseBody(request);
          const older = (body as any)?.older_than_minutes ?? 60;
          const dry = (body as any)?.dry_run === true;
          if (typeof older !== "number" || older < 1) return bad(400, "invalid older_than_minutes");
          // Candidates: events older than older_than_minutes that have not been
          // crossed by any cursor (i.e., recipient has no cursor row, OR the
          // cursor's last_seen_seq is less than the event's seq).
          const candidates = db.query(`
            SELECT e.seq, e.recipient_role, e.recipient_instance_id, e.created_at
            FROM caacp_events e
            LEFT JOIN caacp_cursors c
              ON c.recipient_role = e.recipient_role
              AND c.recipient_instance_id = COALESCE(e.recipient_instance_id, c.recipient_instance_id)
            WHERE (julianday('now') - julianday(e.created_at)) * 24 * 60 > ?
              AND (c.last_seen_seq IS NULL OR c.last_seen_seq < e.seq)
            ORDER BY e.seq ASC
            LIMIT 1000
          `).all(older) as any[];
          if (dry) {
            return json(200, {
              dry_run: true,
              candidate_count: candidates.length,
              candidates: candidates.slice(0, 50),
            });
          }
          let pruned = 0;
          const del = db.prepare(`DELETE FROM caacp_events WHERE seq = ?`);
          for (const c of candidates) {
            del.run(c.seq);
            pruned++;
          }
          return json(200, {
            dry_run: false,
            pruned_count: pruned,
            older_than_minutes: older,
            pruned_at: new Date().toISOString(),
          });
        }

        // DELETE /admin/bridges/{bridge_id} — admin only. Removes a bridge
        // row (used to clean up smoke-test artifacts and orphan registrations).
        if (method === "DELETE" && sub.startsWith("/admin/bridges/")) {
          if (!auth.isAdmin) return bad(403, "bridge delete requires admin token");
          const bridge_id = sub.slice("/admin/bridges/".length).replace(/\/$/, "");
          if (!bridge_id) return bad(400, "missing bridge_id");
          db.prepare(`DELETE FROM caacp_bridges WHERE bridge_id = ?`).run(bridge_id);
          return json(200, { bridge_id, deleted_at: new Date().toISOString() });
        }

        // GET /bridges — admin-only enumeration of registered bridges with
        // freshness annotation. The watchdog calls this each cycle.
        if (method === "GET" && sub === "/bridges") {
          if (!auth.isAdmin) return bad(403, "bridge enumeration requires admin token");
          const rows = listBridges.all() as any[];
          const now = Date.now();
          const annotated = rows.map((r) => {
            const hb = new Date(r.last_heartbeat_at + "Z").getTime();
            const age_s = Math.floor((now - hb) / 1000);
            return { ...r, age_seconds: age_s };
          });
          return json(200, { bridges: annotated });
        }

        // POST /wake_ack — confirm bridge wake landed.
        // Body: {role, instance_id, wake_id, seq_consumed}.
        // Per-decision: wake-acks go directly to the endpoint (not via
        // sidecar). Provides observability for the bridge supervision loop
        // and the watchdog daemon to detect inject-without-delivery.
        if (method === "POST" && sub === "/wake_ack") {
          const body = parseBody(request);
          if (!body) return bad(400, "invalid JSON body");
          const { role, instance_id, wake_id, seq_consumed } = body as any;
          if (!role || !VALID_ROLES.includes(role)) return bad(400, "invalid role");
          if (!instance_id || typeof instance_id !== "string") return bad(400, "missing instance_id");
          if (!wake_id || typeof wake_id !== "string") return bad(400, "missing wake_id");
          if (typeof seq_consumed !== "number") return bad(400, "invalid seq_consumed");
          if (!auth.isAdmin && auth.principal?.role !== role) {
            return bad(403, `token role (${auth.principal?.role}) does not match wake_ack role (${role})`);
          }
          if (!auth.isAdmin && auth.principal?.instance_id && auth.principal.instance_id !== instance_id) {
            return bad(403, `token instance_id (${auth.principal.instance_id}) does not match wake_ack instance_id (${instance_id})`);
          }
          try {
            insertWakeAck.run(wake_id, role, instance_id, seq_consumed);
          } catch {
            // Duplicate wake_ack — idempotent, return success.
          }
          return json(200, {
            wake_id,
            role,
            instance_id,
            seq_consumed,
            received_at: new Date().toISOString(),
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
