import { decodeJwt, jwtVerify, SignJWT } from "jose";

import type { ActionTokenClaims } from "./types";

export interface IssuedActionToken {
  token: string;
  jti: string;
  expires_at: string;
}

export class ActionTokenService {
  private readonly key: Uint8Array;
  private readonly ttl: number;

  constructor(key: string, ttl = 300) {
    this.key = new TextEncoder().encode(key);
    this.ttl = ttl;
  }

  async issue(
    sub: string,
    tenantId: number,
    context: string,
    recordId: string | null = null,
  ): Promise<IssuedActionToken> {
    const jti = crypto.randomUUID();
    const issuedAt = Math.floor(Date.now() / 1000);
    const exp = issuedAt + this.ttl;

    const claims: ActionTokenClaims = {
      sub,
      tenant_id: tenantId,
      "htx-context": context,
      "htx-recordId": recordId,
      jti,
      iat: issuedAt,
      exp,
    };

    const token = await new SignJWT(claims)
      .setProtectedHeader({ alg: "HS256" })
      .sign(this.key);

    return {
      token,
      jti,
      expires_at: this.formatTimestamp(exp),
    };
  }

  async validate(
    token: string,
    tenantId: number,
    expectedContext: string,
    expectedRecordId: string | null = null,
  ): Promise<ActionTokenClaims> {
    let payload: ActionTokenClaims;

    try {
      const verified = await jwtVerify(token, this.key, {
        algorithms: ["HS256"],
      });
      payload = verified.payload as ActionTokenClaims;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid action token: ${message}`);
    }

    if ((payload.tenant_id ?? null) !== tenantId) {
      throw new Error("Tenant mismatch.");
    }

    if ((payload["htx-context"] ?? null) !== expectedContext) {
      throw new Error("Context mismatch.");
    }

    if (
      expectedRecordId !== null &&
      String(payload["htx-recordId"] ?? "") !== String(expectedRecordId)
    ) {
      throw new Error("Record ID mismatch.");
    }

    return payload;
  }

  decode(token: string): ActionTokenClaims {
    return decodeJwt(token) as ActionTokenClaims;
  }

  private formatTimestamp(unixSeconds: number): string {
    return new Date(unixSeconds * 1000).toISOString().slice(0, 19).replace("T", " ");
  }
}
