import type { MaybePromise } from "../runtime/types";

export type ContentId = string | number;

export type ContentRow = Record<string, unknown>;

export interface QueryMeta {
  type: string;
  slug?: string;
  where?: string;
  order?: string;
  howmany?: number;
  offset?: number;
  fields?: string;
}

export interface QueryResult {
  rows: ContentRow[];
  total: number;
}

export interface ContentSchemaField {
  type: string;
  required?: boolean;
  default?: unknown;
  options?: unknown[];
}

export type ContentSchema = Record<string, ContentSchemaField>;

export interface ContentAdapter {
  query(meta: QueryMeta): MaybePromise<QueryResult>;
  find(type: string, id: ContentId): MaybePromise<ContentRow | null>;
  findBySlug(type: string, slug: string): MaybePromise<ContentRow | null>;
  create(type: string, data: Record<string, unknown>): MaybePromise<ContentRow>;
  update(type: string, id: ContentId, data: Record<string, unknown>): MaybePromise<ContentRow>;
  delete(type: string, id: ContentId): MaybePromise<void>;
  schema(type: string): MaybePromise<ContentSchema | null>;
}
