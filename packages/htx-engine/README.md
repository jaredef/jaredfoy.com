# @htx/engine

Core HTX engine for Bun + TypeScript.

It provides the runtime primitives behind HTX:

- `ExpressionEngine`
- `DSLParser`
- `Router`
- `RequestHandler`
- `HttpHost`
- `LayoutResolver`
- `IncludeResolver`
- `ComponentResolver`
- `LetResolver`
- `Hydrator`
- `GetContentExecutor`
- `SetContentExecutor`
- `DeleteContentExecutor`
- `ActionTokenService`
- `InMemoryReplayGuard`

## Install

Current repo usage is workspace-based:

```bash
bun install
```

## Minimal Wiring

```ts
import {
  ActionTokenService,
  ComponentResolver,
  DeleteContentExecutor,
  DSLParser,
  ExpressionEngine,
  GetContentExecutor,
  HttpHost,
  Hydrator,
  IncludeResolver,
  InMemoryReplayGuard,
  LayoutResolver,
  LetResolver,
  RequestHandler,
  Router,
  SetContentExecutor,
} from "@htx/engine";
import { SQLiteAdapter } from "@htx/adapter-sqlite";

const templatesDir = "app/templates";
const publicDir = "app/public";

const adapter = new SQLiteAdapter("app/data/content.sqlite");
const expressionEngine = new ExpressionEngine();
const hydrator = new Hydrator();
const parser = new DSLParser();
const includeResolver = new IncludeResolver();

const getExecutor = new GetContentExecutor(parser, adapter, hydrator, expressionEngine);
const tokenService = new ActionTokenService("dev-secret-key-at-least-32-bytes-long");
const replayGuard = new InMemoryReplayGuard();
const setExecutor = new SetContentExecutor(
  parser,
  adapter,
  hydrator,
  expressionEngine,
  tokenService,
  replayGuard,
);
const deleteExecutor = new DeleteContentExecutor(
  parser,
  adapter,
  hydrator,
  tokenService,
  replayGuard,
);

const handler = new RequestHandler(
  new Router(),
  parser,
  expressionEngine,
  hydrator,
  adapter,
  new LayoutResolver(),
  includeResolver,
  new LetResolver(expressionEngine),
  new ComponentResolver(templatesDir, expressionEngine, includeResolver),
  getExecutor,
  templatesDir,
  setExecutor,
  deleteExecutor,
);

const host = new HttpHost(handler, publicDir);

Bun.serve({
  port: 3000,
  fetch(request) {
    return host.handle(request);
  },
});
```

## HTX Features

Supported runtime features:

- file-system routing with dynamic `[param]` segments
- `<htx:type>`, `<htx:where>`, `<htx:order>`, `<htx:howmany>`, `<htx:offset>`, `<htx:slug>`
- `<htx:each>` and `<htx:none>`
- expressions, filters, ternaries, loop metadata, and request/result context
- nested layouts via `_layout.htx`
- `<htx:include>`
- `<htx:component>` with props and slots
- `<htx:let>`
- mutation prepare/execute flows with signed action payloads

## Core Contracts

The engine depends on a `ContentAdapter` with seven methods:

```ts
interface ContentAdapter {
  query(meta: QueryMeta): QueryResult;
  find(type: string, id: string | number): Record<string, unknown> | null;
  findBySlug(type: string, slug: string): Record<string, unknown> | null;
  create(type: string, data: Record<string, unknown>): Record<string, unknown>;
  update(type: string, id: string | number, data: Record<string, unknown>): Record<string, unknown>;
  delete(type: string, id: string | number): void;
  schema(type: string): Record<string, unknown> | null;
}
```

## Request Lifecycle

Read path:

```text
GET -> Router -> parse HTX -> GetContentExecutor -> adapter.query() -> hydrate -> layout -> HTML
```

Mutation path:

```text
GET form page -> prepare token payload
POST form -> validate payload -> create/update/delete -> HTML or redirect target
```

## Differences from PHP HTX

This TypeScript port maintains behavioral parity with the PHP HTX engine, with these intentional deviations:

1. **UTC timestamps** — The SQLite adapter always stores timestamps in UTC. The PHP version used the server's local timezone via `date('Y-m-d H:i:s')`, which varied across deployments.
2. **Async mutation boundary** — Mutation executors (`prepare`/`execute`) are `async` because the `jose` JWT library requires it. The read path (`GetContentExecutor`) remains fully synchronous.
3. **Path traversal protection** — The Router explicitly validates that resolved paths stay within the site root via `isWithinRoot()`. The PHP version relied on filesystem behavior.
4. **Dynamic recordId expressions** — The RequestHandler evaluates `{{ }}` expressions in `meta.recordId` values, allowing dynamic record binding. PHP passes recordId values through without expression evaluation.

## Testing

```bash
bun test packages/htx-engine/tests
```
