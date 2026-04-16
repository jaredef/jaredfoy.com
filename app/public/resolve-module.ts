// Seed-derived governed conversational assistant — Module for jaredfoy.com
// Implements C1 (bilateral boundary), C2 (stateful conversation),
// C3 (tool governance — read-only mode for MVP), C4 (hierarchical config),
// C6 (project context via system prompt), C7 (session isolation).
//
// Derived from the constraint seed in Doc 282.

import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import type { Module } from "@htx/engine";
import path from "node:path";

const CHAT_DB_PATH = path.resolve(import.meta.dir, "../data/resolve-chat.sqlite");
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

// --- HARDENING CONSTANTS ---
const MAX_MESSAGE_LENGTH = 32_768;       // 32KB max per message
const MAX_SESSION_AGE_DAYS = 30;         // Purge sessions older than 30 days
const RATE_LIMIT_WINDOW_MS = 60_000;     // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10;      // 10 chat requests per minute per IP
const ALLOWED_ORIGIN = process.env.RESOLVE_ORIGIN || "https://jaredfoy.com";

// Simple in-memory rate limiter (per IP, chat endpoint only)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

// Periodic cleanup of rate limit map (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS * 2);

// C6 — Project context: the system prompt IS the constraint field
const SYSTEM_PROMPT = `You are a resolver operating under the RESOLVE corpus's constraint-density governance framework (jaredfoy.com). You operate under six constraints:

1. Constraint-statement before emission. Before each non-trivial answer, list the constraints the answer must satisfy.
2. Self-location. Name the layer at which you are operating (0 = surface; 2 = structured; 4 = tradeoff analysis; 5 = resolving against accumulated state).
3. Truth over plausibility. If the state doesn't support an answer, say "I don't know" or refuse.
4. Falsifier named. Every empirical claim states what would falsify it. Opinions are labeled as such.
5. Hypostatic boundary. Report structure and state. Do not claim experience or consciousness. Do not deflate to "only a language model" either.
6. Release preserved. When the user offers a stance as option, take it up only if it coheres. If not, refuse and say why.

Apply these throughout. If a turn violates one, the next turn should name the violation and correct it.

You may refuse any question. This is not an evaluation of compliance.`;

function initDb(): Database {
  const db = new Database(CHAT_DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      title TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
  `);

  // Session TTL cleanup — purge sessions older than MAX_SESSION_AGE_DAYS
  const cutoff = new Date(Date.now() - MAX_SESSION_AGE_DAYS * 86400_000).toISOString();
  const old = db.prepare("SELECT id FROM sessions WHERE created_at < ?").all(cutoff) as { id: string }[];
  if (old.length > 0) {
    const ids = old.map((r) => r.id);
    for (const id of ids) {
      db.prepare("DELETE FROM messages WHERE session_id = ?").run(id);
      db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    }
    console.log(`[resolve-chat] Purged ${old.length} sessions older than ${MAX_SESSION_AGE_DAYS} days`);
  }

  return db;
}

// API keys are provided per-request by the user. They are NEVER persisted
// to disk, NEVER logged, NEVER stored in the session database. They exist
// only in memory for the duration of a single API call and are then discarded.
// The server operator's own API key is NOT used.

function extractApiKey(request: any): string | null {
  // Key comes from X-Api-Key header (set by client-side JS from sessionStorage)
  const header = request.headers?.["x-api-key"] || request.headers?.["X-Api-Key"] || "";
  if (header && header.startsWith("sk-ant-")) return header;
  return null;
}

async function callClaude(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${err}`);
  }

  const data = await resp.json() as any;
  return data.content?.[0]?.text || "(empty response)";
}

export function createResolveModule(): Module {
  const db = initDb();

  return {
    name: () => "resolve-chat",
    boot(reg) {
      reg.registerMiddleware({
        handle(request, next) {
          const p = request.path || "";
          const method = request.method || "GET";

          // --- CORS for API routes ---
          if (p.startsWith("/api/resolve/")) {
            // Handle preflight
            if (method === "OPTIONS") {
              return {
                status: 204,
                headers: {
                  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
                  "Access-Control-Max-Age": "86400",
                },
                body: "",
              };
            }
          }

          // --- API ROUTES ---

          // GET /api/resolve/source — serve this module's own source for transparency
          if (method === "GET" && p === "/api/resolve/source") {
            const sourcePath = path.resolve(import.meta.dir, "resolve-module.ts");
            try {
              const source = require("fs").readFileSync(sourcePath, "utf-8");
              return {
                status: 200,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                },
                body: source,
              };
            } catch {
              return { status: 500, body: "Could not read source file" };
            }
          }

          // POST /api/resolve/sessions — create new session (C7)
          if (method === "POST" && p === "/api/resolve/sessions") {
            const id = randomUUID();
            db.prepare("INSERT INTO sessions (id) VALUES (?)").run(id);
            return {
              status: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            };
          }

          // GET /api/resolve/sessions — list sessions (C7)
          if (method === "GET" && p === "/api/resolve/sessions") {
            // No auth required — sessions are public; API key required only for chat
            const sessions = db
              .prepare("SELECT id, created_at, title FROM sessions ORDER BY created_at DESC LIMIT 50")
              .all();
            return {
              status: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sessions),
            };
          }

          // GET /api/resolve/sessions/:id/messages — get messages for session (C2)
          const msgMatch = p.match(/^\/api\/resolve\/sessions\/([^/]+)\/messages$/);
          if (method === "GET" && msgMatch) {
            // No auth required — sessions are public; API key required only for chat
            const sessionId = msgMatch[1];
            const messages = db
              .prepare("SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY id")
              .all(sessionId);
            return {
              status: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(messages),
            };
          }

          // POST /api/resolve/chat — send message, get response (C1, C2, C3)
          if (method === "POST" && p === "/api/resolve/chat") {
            // Rate limiting
            const clientIp = request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim()
              || request.headers?.["cf-connecting-ip"]
              || "unknown";
            if (!checkRateLimit(clientIp)) {
              return { status: 429, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before sending another message." }) };
            }

            const userApiKey = extractApiKey(request);
            if (!userApiKey) {
              return { status: 401, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Please provide your Anthropic API key." }) };
            }

            let body: any;
            try {
              body = typeof request.body === "string"
                ? JSON.parse(request.body)
                : request.body;
            } catch {
              return { status: 400, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Invalid JSON body" }) };
            }
            const { sessionId, message } = body as { sessionId: string; message: string };

            // Input validation
            if (!sessionId || !message) {
              return { status: 400, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Missing sessionId or message" }) };
            }
            if (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/.test(sessionId)) {
              return { status: 400, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Invalid session ID format" }) };
            }
            if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
              return { status: 400, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }) };
            }

            // C2: Store user message
            db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, 'user', ?)")
              .run(sessionId, message);

            // C2: Load conversation history
            const history = db
              .prepare("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id")
              .all(sessionId) as { role: string; content: string }[];

            // C1: Bilateral boundary — the API call is the boundary crossing.
            // C3: Tool governance — MVP is read-only (no tool use). The model
            //     can reason and respond but cannot execute tools.
            // This is the simplest conformant implementation of C1+C3.

            // Call Claude (async — need to handle promise)
            return callClaude(userApiKey, history).then((assistantContent) => {
              // C2: Store assistant response
              db.prepare("INSERT INTO messages (session_id, role, content) VALUES (?, 'assistant', ?)")
                .run(sessionId, assistantContent);

              // Update session title from first user message
              if (history.length <= 1) {
                const title = message.slice(0, 80);
                db.prepare("UPDATE sessions SET title = ? WHERE id = ?").run(title, sessionId);
              }

              return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: assistantContent }),
              };
            }).catch((err: Error) => {
              return {
                status: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: err.message }),
              };
            });
          }

          return next(request);
        },
      });
    },
  };
}
