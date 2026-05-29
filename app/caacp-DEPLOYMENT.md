# CAACP Endpoint — Deployment Notes

The Cybernetic Agentic Communication Protocol (CAACP) endpoint lives at `app/caacp-module.ts` and is wired into the HTTP host via `app/public/index.ts`. The protocol's canonical articulation is in the cruftless repo at `apparatus/docs/cybernetic-agentic-communication-protocol.md`; this doc covers only the jaredfoy.com server-side deployment requirements.

## Required environment

Add to the systemd unit (`/home/jaredef/jaredfoy/jaredfoy.service`) under `[Service]`:

```
Environment=CAACP_TOKEN_VERIFIER=<shared-secret-from-keeper>
```

Optional overrides (defaults shown):

```
Environment=CAACP_DB_PATH=/home/jaredef/jaredfoy/app/data/caacp.sqlite
Environment=CAACP_PATH_PREFIX=/api/caacp/v1
```

Then reload + restart:

```
sudo systemctl daemon-reload
sudo systemctl restart jaredfoy
```

Without `CAACP_TOKEN_VERIFIER`, every CAACP endpoint returns HTTP 503 (`CAACP endpoint unconfigured`). This is the explicit unconfigured-state behavior; the server keeps responding to the rest of the site normally.

## Token discipline

The token is a shared secret with the resolver-side clients (cruftless repo) which read it as `CAACP_TOKEN` in their `env.local`. The same string goes in both places. Rotation is a coordinated keeper move: update `env.local` on each resolver clone, update the systemd unit + restart, and the cybernetic loop resumes against the new credential.

The token is intentionally a single shared secret in the v1 protocol; per-role distinct tokens are deferred to a future revision per the CAACP doc §X carve-outs.

## Database

CAACP persists message state machine + acknowledgments in a dedicated SQLite database at `app/data/caacp.sqlite` (configurable via `CAACP_DB_PATH`). Schema is auto-created on first request via `CREATE TABLE IF NOT EXISTS`.

Two tables: `caacp_messages` + `caacp_acknowledgments`. Indexes on `(recipient, state)` for inbox queries and `(sender)` for outbox queries. WAL journal mode for concurrent read while the server is writing.

## Endpoint surface

Per CAACP §VI.1 (cruftless repo):

```
POST   /api/caacp/v1/messages
GET    /api/caacp/v1/inbox/{role}?state=PENDING|ACKNOWLEDGED|IN-FLIGHT
GET    /api/caacp/v1/outbox/{role}
POST   /api/caacp/v1/messages/{message_id}/acknowledge
GET    /api/caacp/v1/messages/{message_id}
```

All require `X-CAACP-Token: <verifier-value>` header. Missing or mismatched token → 401.

## Smoke test (post-deploy)

```sh
# Replace TOKEN with the value provisioned in the systemd unit.
TOKEN="..."

# Should return 200 with empty messages list initially.
curl -H "X-CAACP-Token: $TOKEN" \
  https://jaredfoy.com/api/caacp/v1/inbox/helmsman?state=PENDING

# Should return 201 with a new message_id.
curl -X POST -H "X-CAACP-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sender":"helmsman","recipient":"arbiter","intent":"request","slug":"smoke","content_sha":"deadbeef"}' \
  https://jaredfoy.com/api/caacp/v1/messages
```

If both return as expected, the endpoint is live and resolver-side `apparatus/scripts/caacp.sh send|inbox|outbox|ack` invocations will sync against it once `CAACP_TOKEN` is set in the cruftless `env.local`.

## Coexistence with corpus

The CAACP module shares the HTTP host process with the existing search / sitemap / page-meta / resolve modules. It uses a distinct SQLite database; the corpus database at `app/data/corpus.sqlite` is untouched.

Performance: CAACP message volume is expected to be very low (single-digit messages per hour at peak resolver activity). No special handling for load; SQLite handles this comfortably.
