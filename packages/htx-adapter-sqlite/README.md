# @htx/adapter-sqlite

Reference SQLite adapter for HTX on Bun.

It uses `bun:sqlite`, creates its schema automatically, stores custom fields in a JSON `meta` column, and matches the HTX engine query contract.

## Usage

```ts
import { SQLiteAdapter } from "@htx/adapter-sqlite";

const adapter = new SQLiteAdapter("app/data/content.sqlite");
const memoryAdapter = new SQLiteAdapter(":memory:");
```

## Features

- automatic schema creation
- file-backed or `:memory:` databases
- unique slug per content type
- generated slugs from `title`
- `where` support for system columns and JSON `meta` fields
- ordering with `newest`, `oldest`, `alpha`, `alpha_desc`, and `updated`
- `howmany` and `offset` pagination
- flattened `meta` fields in returned rows

## Schema

```sql
CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT "",
  body TEXT NOT NULL DEFAULT "",
  status TEXT NOT NULL DEFAULT "draft",
  meta TEXT NOT NULL DEFAULT "{}",
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(type, slug)
);
```

## Query Contract

The adapter consumes the same `QueryMeta` shape used by the engine:

```ts
adapter.query({
  type: "post",
  where: "status=published,category=tech",
  order: "newest",
  howmany: 10,
  offset: 0,
});
```

Slug lookup is a shortcut:

```ts
adapter.query({
  type: "post",
  slug: "hello-world",
});
```

## Testing

```bash
bun test packages/htx-adapter-sqlite/tests/sqlite-adapter.test.ts
```

The current suite covers schema creation, CRUD, JSON meta flattening, ordering, pagination, slug constraints, and real engine execution through `GetContentExecutor`.
