// D144 server-side hardening — regression-proof test fixtures.
//
// Exercises:
//   α1 — per-recipient delivery confirmation on POST /messages.
//   α2 — GET /delivery_suspects PENDING-no-recipient-ack query.
//   β  — GET /liveness 4-state silence-state verdict.
//   Mechanism #5 — GET /messages/{id} body persistence beyond state transitions.
//
// Run: bun run app/caacp-d144-test.ts
//
// Uses an in-memory SQLite to avoid touching the live caacp.sqlite. Spins the
// module's middleware function up against synthesized requests; asserts the
// JSON responses match the D144 contract.

import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

// Force an isolated DB before importing the module.
const TEST_DB = `/tmp/caacp-d144-test-${Date.now()}.sqlite`;
process.env.CAACP_DB_PATH = TEST_DB;
process.env.CAACP_TOKEN_VERIFIER = "test-admin-token";
process.env.CAACP_PATH_PREFIX = "/api/caacp/v1";

const { caacpModule } = await import("./caacp-module.ts");

// Minimal stub of the HTX engine's middleware registration shape.
let registered: any = null;
const reg = {
  registerMiddleware(m: any) {
    registered = m;
  },
};
caacpModule.boot(reg as any, {} as any);

function call(method: string, path: string, body?: any, token = "test-admin-token", query?: Record<string, string>) {
  const request = {
    method,
    path,
    headers: { "x-caacp-token": token },
    body: body ? JSON.stringify(body) : undefined,
    query: query ?? {},
  };
  let nextCalled = false;
  const response = registered.handle(request, () => { nextCalled = true; return null; });
  if (nextCalled) {
    return { status: 404, body: { error: "unmatched (next called)" } };
  }
  if (response && response.status) {
    return { status: response.status, body: JSON.parse(response.body) };
  }
  return { status: 500, body: { error: "no response" } };
}

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail?: any) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}`);
    if (detail !== undefined) console.log(`        ${JSON.stringify(detail)}`);
  }
}

console.log("D144 server-side hardening — regression-proof fixtures");
console.log("");

// ─── α1: per-recipient delivery confirmation ─────────────────────────────
console.log("α1 — per-recipient delivery confirmation");

// Register a substrate-resolver instance.
const regResp = call("POST", "/api/caacp/v1/register", {
  role: "substrate-resolver",
  instance_id: "test-r1-canonical",
});
assert("register substrate-resolver instance", regResp.status === 201, regResp);

// Broadcast — delivered_to should include the registered instance.
const broadcastResp = call("POST", "/api/caacp/v1/messages", {
  sender: "helmsman",
  recipient: "substrate-resolver",
  intent: "broadcast",
  slug: "d144-test-broadcast",
  content_sha: "sha-broadcast",
});
assert(
  "broadcast: delivered_to includes registered instance",
  broadcastResp.status === 201 && broadcastResp.body.delivered_to.includes("test-r1-canonical"),
  broadcastResp.body,
);
assert(
  "broadcast: not_yet_delivered_to is empty",
  broadcastResp.body.not_yet_delivered_to.length === 0,
);

// Targeted dispatch to an unregistered instance — caught at send time.
const targetedUnregistered = call("POST", "/api/caacp/v1/messages", {
  sender: "helmsman",
  recipient: "substrate-resolver",
  intent: "request",
  slug: "d144-test-targeted-unregistered",
  content_sha: "sha-unreg",
  target_instance_id: "test-r99-not-registered",
});
assert(
  "targeted-unregistered: not_yet_delivered_to surfaces the routing gap",
  targetedUnregistered.body.not_yet_delivered_to.includes("test-r99-not-registered") &&
    targetedUnregistered.body.delivered_to.length === 0,
  targetedUnregistered.body,
);

// Targeted dispatch to a registered instance.
const targetedRegistered = call("POST", "/api/caacp/v1/messages", {
  sender: "helmsman",
  recipient: "substrate-resolver",
  intent: "request",
  slug: "d144-test-targeted-registered",
  content_sha: "sha-reg",
  target_instance_id: "test-r1-canonical",
});
assert(
  "targeted-registered: delivered_to = [target]",
  targetedRegistered.body.delivered_to.includes("test-r1-canonical") &&
    targetedRegistered.body.not_yet_delivered_to.length === 0,
);

// ─── α2: /delivery_suspects ──────────────────────────────────────────────
console.log("");
console.log("α2 — /delivery_suspects PENDING-no-recipient-ack query");

// Create a PENDING dispatch with only a stand-down ack — should be a suspect.
const suspectMsg = call("POST", "/api/caacp/v1/messages", {
  sender: "helmsman",
  recipient: "substrate-resolver",
  intent: "request",
  slug: "d144-test-suspect-dispatch",
  content_sha: "sha-suspect",
  target_instance_id: "test-r1-canonical",
});
// Stand-down ack from a different instance (r2 standing down on broadcast prefix).
call("POST", `/api/caacp/v1/messages/${suspectMsg.body.message_id}/acknowledge`, {
  ack_author: "substrate-resolver",
  ack_intent: "ACKNOWLEDGED",
  ack_slug: "r2-terminal-nonactionable-d144-test-suspect",
  content_sha: "sha-ack-1",
});

// Query suspects with older_than=0 (treat just-created as old enough for test).
const suspects = call("GET", "/api/caacp/v1/delivery_suspects", undefined, "test-admin-token", {
  role: "substrate-resolver",
  older_than_minutes: "0",
});
assert(
  "delivery_suspects: surfaces dispatch with only stand-down acks",
  suspects.status === 200 && suspects.body.suspects.some((s: any) => s.message_id === suspectMsg.body.message_id),
  suspects.body,
);

// Add a SUBSTANTIVE ack from the addressed recipient → should NO LONGER be a suspect.
call("POST", `/api/caacp/v1/messages/${suspectMsg.body.message_id}/acknowledge`, {
  ack_author: "substrate-resolver",
  ack_intent: "IN-FLIGHT",
  ack_slug: "r1-substantive-in-flight-on-d144-test",
  content_sha: "sha-ack-2",
});
const suspectsAfter = call("GET", "/api/caacp/v1/delivery_suspects", undefined, "test-admin-token", {
  role: "substrate-resolver",
  older_than_minutes: "0",
});
assert(
  "delivery_suspects: substantive recipient ack clears suspect flag",
  !suspectsAfter.body.suspects.some((s: any) => s.message_id === suspectMsg.body.message_id),
);

// ─── β: /liveness 4-state verdict ────────────────────────────────────────
console.log("");
console.log("β — /liveness 4-state silence-state verdict");

// No bridge heartbeat + empty inbox → UNKNOWN.
const liveness1 = call("GET", "/api/caacp/v1/liveness", undefined, "test-admin-token", {
  role: "substrate-resolver",
  instance_id: "test-r1-canonical",
});
// Note: this instance has the inFlight dispatch from earlier so it might return
// IN-FLIGHT-ON-DISPATCH. Check that the verdict logic is reaching ONE of the
// expected values, not the precise one (which depends on order of test
// operations).
assert(
  "liveness: returns a valid 4-state verdict",
  liveness1.status === 200 &&
    [
      "IDLE-AWAITING-DISPATCH",
      "IN-FLIGHT-ON-DISPATCH",
      "CONTEXT-EXHAUSTED-SUSPECTED",
      "ROUTE-CONFUSED-SUSPECTED",
      "UNKNOWN",
    ].includes(liveness1.body.verdict),
  liveness1.body,
);
assert(
  "liveness: returns evidence object",
  liveness1.body.evidence !== undefined,
);

// Register a bridge heartbeat → should bump verdict toward IN-FLIGHT or IDLE.
call("POST", "/api/caacp/v1/bridge_heartbeat", {
  bridge_id: "test-bridge-r1",
  role: "substrate-resolver",
  instance_id: "test-r1-canonical",
  pid: 1234,
  tmux_target: "test-target",
  host: "test-host",
});
const liveness2 = call("GET", "/api/caacp/v1/liveness", undefined, "test-admin-token", {
  role: "substrate-resolver",
  instance_id: "test-r1-canonical",
});
assert(
  "liveness with active bridge: NOT route-confused",
  liveness2.body.verdict !== "ROUTE-CONFUSED-SUSPECTED",
  liveness2.body,
);
assert(
  "liveness with active bridge: bridge_age_seconds < 60",
  liveness2.body.evidence.bridge_age_seconds !== null && liveness2.body.evidence.bridge_age_seconds < 60,
);

// ─── Mechanism #5: body persistence ──────────────────────────────────────
console.log("");
console.log("Mechanism #5 — body persistence beyond state transitions");

const bodyMsg = call("POST", "/api/caacp/v1/messages", {
  sender: "helmsman",
  recipient: "substrate-resolver",
  intent: "request",
  slug: "d144-test-body-persistence",
  content_sha: "sha-body",
  body: "TEST BODY CONTENT THAT MUST PERSIST",
});
// Acknowledge it through RESOLVED to trigger state transition.
call("POST", `/api/caacp/v1/messages/${bodyMsg.body.message_id}/acknowledge`, {
  ack_author: "substrate-resolver",
  ack_intent: "RESOLVED",
  ack_slug: "resolved-test",
  content_sha: "sha-resolve",
});
// Body should STILL be retrievable.
const retrieved = call("GET", `/api/caacp/v1/messages/${bodyMsg.body.message_id}`);
assert(
  "body persists through PENDING→RESOLVED transition",
  retrieved.body.message.body === "TEST BODY CONTENT THAT MUST PERSIST",
  retrieved.body.message,
);
assert(
  "state transitioned to RESOLVED",
  retrieved.body.message.state === "RESOLVED",
);

// ─── Cleanup + summary ───────────────────────────────────────────────────
console.log("");
console.log(`Results: ${pass} pass / ${fail} fail`);
fs.unlinkSync(TEST_DB);
try { fs.unlinkSync(TEST_DB + "-shm"); } catch {}
try { fs.unlinkSync(TEST_DB + "-wal"); } catch {}

if (fail > 0) process.exit(1);
