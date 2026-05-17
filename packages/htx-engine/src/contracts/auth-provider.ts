import type { MaybePromise } from "../runtime/types";

export interface AuthProvider {
  issueToken(claims: Record<string, unknown>, ttl?: number): MaybePromise<string>;
  validateToken(token: string): MaybePromise<Record<string, unknown> | null>;
  currentUser(
    headers?: Record<string, string>,
    cookies?: Record<string, string>,
  ): MaybePromise<Record<string, unknown> | null>;
}
