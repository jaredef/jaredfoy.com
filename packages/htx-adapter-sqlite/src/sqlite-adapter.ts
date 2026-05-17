import { Database } from "bun:sqlite";

import type { ContentAdapter, ContentId, ContentRow, ContentSchema, QueryMeta, QueryResult } from "@htx/engine";

const SYSTEM_COLUMNS = new Set([
  "id",
  "type",
  "slug",
  "title",
  "body",
  "status",
  "created_at",
  "updated_at",
]);

/**
 * Generate a UTC timestamp in "YYYY-MM-DD HH:MM:SS" format.
 *
 * Intentional deviation from PHP: PHP used server-local timezone via date('Y-m-d H:i:s').
 * TS always uses UTC for consistency across deployments and edge runtimes.
 */
function timestampNow(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `untitled-${Math.floor(Date.now() / 1000)}`;
}

export class SQLiteAdapter implements ContentAdapter {
  private readonly db: Database;

  constructor(path = ":memory:") {
    this.db = new Database(path);
    this.db.exec("PRAGMA journal_mode=WAL");
    this.db.exec("PRAGMA busy_timeout=5000");
    this.db.exec("PRAGMA foreign_keys=ON");
    this.ensureSchema();
  }

  getDatabase(): Database {
    return this.db;
  }

  query(meta: QueryMeta): QueryResult {
    const type = meta.type ?? "";

    if (meta.slug) {
      const record = this.findBySlug(type, meta.slug);
      return record ? { rows: [record], total: 1 } : { rows: [], total: 0 };
    }

    const where: string[] = ["type = ?"];
    const params: Array<string | number> = [type];

    if (meta.where) {
      this.applyWhereClause(meta.where, where, params);
    }

    const countSql = `SELECT COUNT(*) as total FROM content WHERE ${where.join(" AND ")}`;
    const countRow = this.db.query(countSql).get(...params) as { total: number } | null;
    const total = Number(countRow?.total ?? 0);

    const orderSql = this.buildOrderClause(meta.order ?? "newest");
    const limit = Number(meta.howmany ?? 20);
    const offset = Number(meta.offset ?? 0);
    const querySql = `SELECT * FROM content WHERE ${where.join(" AND ")} ${orderSql} LIMIT ? OFFSET ?`;
    const rows = this.db
      .query(querySql)
      .all(...params, limit, offset)
      .map((row) => this.decodeRow(row as Record<string, unknown>));

    return { rows, total };
  }

  find(type: string, id: ContentId): ContentRow | null {
    const row = this.db
      .query("SELECT * FROM content WHERE id = ? AND type = ?")
      .get(id, type) as Record<string, unknown> | null;

    return row ? this.decodeRow(row) : null;
  }

  findBySlug(type: string, slug: string): ContentRow | null {
    const row = this.db
      .query("SELECT * FROM content WHERE slug = ? AND type = ?")
      .get(slug, type) as Record<string, unknown> | null;

    return row ? this.decodeRow(row) : null;
  }

  create(type: string, data: Record<string, unknown>): ContentRow {
    const now = timestampNow();
    const slug = typeof data.slug === "string" ? data.slug : generateSlug(String(data.title ?? ""));
    const title = String(data.title ?? "");
    const body = String(data.body ?? "");
    const status = String(data.status ?? "draft");
    const createdAt = typeof data.created_at === "string" ? data.created_at : now;
    const updatedAt = typeof data.updated_at === "string" ? data.updated_at : now;
    const meta = this.extractMeta(data);

    this.db
      .query(
        "INSERT INTO content (type, slug, title, body, status, meta, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(type, slug, title, body, status, JSON.stringify(meta), createdAt, updatedAt);

    const lastInsertRow = this.db.query("SELECT last_insert_rowid() as id").get() as
      | { id: number }
      | null;
    const id = Number(lastInsertRow?.id ?? 0);
    return this.find(type, id)!;
  }

  update(type: string, id: ContentId, data: Record<string, unknown>): ContentRow {
    const existing = this.find(type, id);
    if (!existing) {
      throw new Error(`Record not found: ${type}/${String(id)}`);
    }

    const title = String(data.title ?? existing.title ?? "");
    const body = String(data.body ?? existing.body ?? "");
    const status = String(data.status ?? existing.status ?? "draft");
    const slug = typeof data.slug === "string" ? data.slug : String(existing.slug ?? "");
    const existingMeta = this.extractMeta(existing);
    const newMeta = this.extractMeta(data);
    const mergedMeta = { ...existingMeta, ...newMeta };

    this.db
      .query(
        "UPDATE content SET title = ?, body = ?, status = ?, slug = ?, meta = ?, updated_at = ? WHERE id = ? AND type = ?",
      )
      .run(title, body, status, slug, JSON.stringify(mergedMeta), timestampNow(), id, type);

    return this.find(type, id)!;
  }

  delete(type: string, id: ContentId): void {
    const result = this.db
      .query("DELETE FROM content WHERE id = ? AND type = ?")
      .run(id, type);

    if (result.changes === 0) {
      throw new Error(`Record not found: ${type}/${String(id)}`);
    }
  }

  schema(_type: string): ContentSchema | null {
    return null;
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS content (
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
      )
    `);

    this.db.exec("CREATE INDEX IF NOT EXISTS idx_content_type ON content(type)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_content_type_status ON content(type, status)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_content_slug ON content(type, slug)");
  }

  private decodeRow(row: Record<string, unknown>): ContentRow {
    const meta =
      typeof row.meta === "string" && row.meta !== ""
        ? (JSON.parse(row.meta) as Record<string, unknown>)
        : {};
    const decoded = { ...row };
    delete decoded.meta;
    return { ...decoded, ...meta };
  }

  private extractMeta(data: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(data).filter(([key]) => !SYSTEM_COLUMNS.has(key)),
    );
  }

  private applyWhereClause(
    whereString: string,
    where: string[],
    params: Array<string | number>,
  ): void {
    const conditions = whereString.split(",");

    for (const rawCondition of conditions) {
      const condition = rawCondition.trim();
      if (!condition) {
        continue;
      }

      for (const operator of ["!=", ">=", "<=", ">", "<", "="]) {
        const position = condition.indexOf(operator);
        if (position === -1) {
          continue;
        }

        const field = condition.slice(0, position).trim();
        const value = condition.slice(position + operator.length).trim();

        if (SYSTEM_COLUMNS.has(field)) {
          where.push(`${field} ${operator} ?`);
          params.push(value);
        } else {
          where.push(`json_extract(meta, ?) ${operator} ?`);
          params.push(`$.${field}`);
          params.push(value);
        }

        break;
      }
    }
  }

  private buildOrderClause(order: string): string {
    switch (order) {
      case "oldest":
        return "ORDER BY created_at ASC";
      case "alpha":
      case "alphabetical":
        return "ORDER BY title ASC";
      case "alpha_desc":
        return "ORDER BY title DESC";
      case "updated":
        return "ORDER BY updated_at DESC";
      case "newest":
      default:
        return "ORDER BY created_at DESC";
    }
  }
}
