import type { MaybePromise } from "../runtime/types";

export interface ReplayGuard {
  isReplayed(jti: string): MaybePromise<boolean>;
  markUsed(jti: string, tenantId: number, expiresAt: string): MaybePromise<void>;
  cleanup(): MaybePromise<number>;
}

export interface ActionTokenClaims {
  sub: string;
  jti: string;
  tenant_id: number;
  "htx-context": string;
  "htx-recordId": string | null;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}
