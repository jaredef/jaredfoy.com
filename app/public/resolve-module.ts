// Seed-derived governed conversational assistant — Module for jaredfoy.com
// Implements C1 (bilateral boundary), C2 (stateful conversation),
// C3 (tool governance — read-only mode for MVP), C4 (hierarchical config),
// C6 (project context via system prompt), C7 (session isolation).
//
// Derived from the constraint seed in Doc 282.

import { randomUUID } from "node:crypto";
import type { Module } from "@htx/engine";
import path from "node:path";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

// --- HARDENING CONSTANTS ---
const MAX_MESSAGE_LENGTH = 32_768;       // 32KB max per message
// MAX_SESSION_AGE_DAYS removed — sessions are in-memory with TTL now
const RATE_LIMIT_WINDOW_MS = 60_000;     // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10;      // 10 chat requests per minute per IP
const ALLOWED_ORIGIN = process.env.RESOLVE_ORIGIN || "https://jaredfoy.com";
const ACTION_TOKEN_TTL_MS = 3_600_000;   // 1 hour TTL for action tokens
const SESSION_TTL_MS = 3_600_000;        // 1 hour TTL for chat sessions

// --- IN-MEMORY CHAT STORAGE ---
// Messages live in process memory only. Never disk. Never SQLite.
// Server restart = all conversations gone. This is a privacy feature.
interface ChatMessage { role: string; content: string; }
interface ChatSession { messages: ChatMessage[]; createdAt: number; }
const chatSessions = new Map<string, ChatSession>();

// Periodic cleanup of expired sessions (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of chatSessions) {
    if (now - session.createdAt > SESSION_TTL_MS) chatSessions.delete(id);
  }
}, SESSION_TTL_MS / 4);

// --- PRESTO PREPARE/EXECUTE: Action Token Store ---
// Tokens are generated at page render (PREPARE) and filled with the user's
// API key via a single POST (EXECUTE). The key transits exactly once.
// Storage is IN-MEMORY ONLY — never disk, never SQLite. Server restart = all gone.
interface ActionTokenSlot {
  key: string | null;      // null = empty slot (prepared but not yet filled)
  createdAt: number;
  filledAt: number | null;
}
const actionTokenStore = new Map<string, ActionTokenSlot>();

function generateActionToken(): string {
  return "resolve_" + randomUUID().replace(/-/g, "");
}

// Periodic cleanup of expired tokens
setInterval(() => {
  const now = Date.now();
  for (const [token, slot] of actionTokenStore) {
    if (now - slot.createdAt > ACTION_TOKEN_TTL_MS) actionTokenStore.delete(token);
  }
}, ACTION_TOKEN_TTL_MS / 4);

// Simple in-memory rate limiter (per IP). Shared across /api/resolve/bind
// and /api/resolve/chat so a single client cannot evade the limit by
// switching endpoints during an attack.
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

function getClientIp(request: any): string {
  return request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim()
    || request.headers?.["cf-connecting-ip"]
    || "unknown";
}

// Origin validation for state-changing endpoints. Browsers set the Origin
// header on POST/PUT/DELETE and cross-origin GET; if present, it must match
// ALLOWED_ORIGIN. If the header is missing entirely (rare for modern browsers
// on POST), we reject — a missing Origin on a state-changing request in 2026
// is more likely a CSRF attempt than a legitimate client.
function isAllowedOrigin(request: any): boolean {
  const origin = request.headers?.["origin"];
  if (!origin) return false;
  return origin === ALLOWED_ORIGIN;
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

// No database. All chat state is in-memory. See chatSessions Map above.

// PRESTO PREPARE/EXECUTE MODEL FOR API KEY HANDLING
//
// 1. PREPARE: When /resolve page is rendered, server generates an action token
//    and embeds it in the HTML. The token has an EMPTY SLOT in memory.
// 2. BIND: User enters their API key. Client sends POST /api/resolve/bind
//    with { token, key }. Server fills the slot. Key transits exactly ONCE.
// 3. EXECUTE: Chat requests send only the opaque token. Server looks up the
//    key from the filled slot. The raw key NEVER appears in a header again.
//
// The server operator's API key is NOT used. Keys live in process memory
// only — never disk, never SQLite, never logged. Server restart = all gone.

function extractKeyFromToken(request: any): string | null {
  const header = request.headers?.["x-action-token"] || request.headers?.["X-Action-Token"] || "";
  if (!header) return null;
  const slot = actionTokenStore.get(header);
  if (!slot || !slot.key) return null;
  if (Date.now() - slot.createdAt > ACTION_TOKEN_TTL_MS) {
    actionTokenStore.delete(header);
    return null;
  }
  return slot.key;
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

          // GET /api/resolve/token — PREPARE phase: issue a fresh action token
          if (method === "GET" && p === "/api/resolve/token") {
            const token = generateActionToken();
            actionTokenStore.set(token, { key: null, createdAt: Date.now(), filledAt: null });
            return {
              status: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
              body: JSON.stringify({ token }),
            };
          }

          // POST /api/resolve/bind — EXECUTE phase: fill the action token slot with user's key
          if (method === "POST" && p === "/api/resolve/bind") {
            // CSRF defense: the bind endpoint is the single point at which a
            // raw API key transits. Reject any request whose Origin header is
            // missing or does not match ALLOWED_ORIGIN.
            if (!isAllowedOrigin(request)) {
              return { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Cross-origin request rejected." }) };
            }
            // Rate limit: 10 bind attempts per minute per IP prevents
            // distributed token enumeration / brute force.
            const bindIp = getClientIp(request);
            if (!checkRateLimit(bindIp)) {
              return { status: 429, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before retrying." }) };
            }
            let body: any;
            try {
              body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
            } catch {
              return { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Invalid JSON" }) };
            }
            const { token, key } = body as { token: string; key: string };
            if (!token || !key) {
              return { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Missing token or key" }) };
            }
            if (!key.startsWith("sk-ant-")) {
              return { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Invalid API key format" }) };
            }
            const slot = actionTokenStore.get(token);
            if (!slot) {
              return { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Invalid or expired action token. Please refresh the page." }) };
            }
            if (slot.key) {
              return { status: 409, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Token already bound. Please refresh for a new token." }) };
            }
            if (Date.now() - slot.createdAt > ACTION_TOKEN_TTL_MS) {
              actionTokenStore.delete(token);
              return { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Action token expired. Please refresh the page." }) };
            }
            // FILL THE SLOT — key transits exactly once, stored in memory only
            slot.key = key;
            slot.filledAt = Date.now();
            return { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
              body: JSON.stringify({ ok: true }) };
          }

          // POST /api/resolve/sessions — create new session (C7)
          if (method === "POST" && p === "/api/resolve/sessions") {
            const id = randomUUID();
            chatSessions.set(id, { messages: [], createdAt: Date.now() });
            return {
              status: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            };
          }

          // POST /api/resolve/chat — send message, get response (C1, C2, C3)
          if (method === "POST" && p === "/api/resolve/chat") {
            // CSRF defense: reject cross-origin POSTs on the chat endpoint too,
            // so a malicious site can't use a guessed token to run a user's key.
            if (!isAllowedOrigin(request)) {
              return { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
                body: JSON.stringify({ error: "Cross-origin request rejected." }) };
            }
            // Rate limiting
            const clientIp = getClientIp(request);
            if (!checkRateLimit(clientIp)) {
              return { status: 429, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before sending another message." }) };
            }

            const userApiKey = extractKeyFromToken(request);
            if (!userApiKey) {
              return { status: 401, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Session expired or no API key bound. Please refresh the page and re-enter your key." }) };
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

            // C2: In-memory conversation history
            const session = chatSessions.get(sessionId);
            if (!session) {
              return { status: 404, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Session not found or expired. Please refresh.", nextToken: newToken }) };
            }
            session.messages.push({ role: "user", content: message });
            const history = session.messages;

            // C1: Bilateral boundary — the API call is the boundary crossing.
            // C3: Tool governance — MVP is read-only (no tool use). The model
            //     can reason and respond but cannot execute tools.
            // This is the simplest conformant implementation of C1+C3.

            // Call Claude (async — need to handle promise)
            // DEFENSE IN DEPTH: rotate the action token after each use.
            // Generate a new token, move the key to it, delete the old one.
            // The client receives the new token in the response and uses it next time.
            // Each token is single-use — intercepted tokens are already consumed.
            const oldToken = request.headers?.["x-action-token"] || request.headers?.["X-Action-Token"] || "";
            const newToken = generateActionToken();
            actionTokenStore.set(newToken, { key: userApiKey, createdAt: Date.now(), filledAt: Date.now() });
            actionTokenStore.delete(oldToken);

            return callClaude(userApiKey, history).then((assistantContent) => {
              // C2: Store assistant response in memory
              session.messages.push({ role: "assistant", content: assistantContent });

              return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: assistantContent, nextToken: newToken }),
              };
            }).catch((err: Error) => {
              return {
                status: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: err.message, nextToken: newToken }),
              };
            });
          }

          return next(request);
        },
      });
    },
  };
}
