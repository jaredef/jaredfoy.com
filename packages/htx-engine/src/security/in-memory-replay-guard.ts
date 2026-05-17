import type { ReplayGuard } from "./types";

export class InMemoryReplayGuard implements ReplayGuard {
  private readonly used = new Map<string, { tenant_id: number; expires_at: string }>();

  isReplayed(jti: string): boolean {
    return this.used.has(jti);
  }

  markUsed(jti: string, tenantId: number, expiresAt: string): void {
    this.used.set(jti, {
      tenant_id: tenantId,
      expires_at: expiresAt,
    });
  }

  cleanup(): number {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    let count = 0;

    for (const [jti, record] of this.used.entries()) {
      if (record.expires_at < now) {
        this.used.delete(jti);
        count += 1;
      }
    }

    return count;
  }

  count(): number {
    return this.used.size;
  }

  reset(): void {
    this.used.clear();
  }
}
