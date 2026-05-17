import type { ContentAdapter } from "../contracts/content-adapter";
import { HtxDiagnosticError } from "./diagnostics";

export interface RegisteredAdapter {
  key: string;
  adapter: ContentAdapter;
  driver?: string;
}

export interface ResolvedAdapter extends RegisteredAdapter {
  requestedType: string;
}

export class AdapterRegistry {
  private readonly adapters = new Map<string, RegisteredAdapter>();

  constructor(adapters: Record<string, ContentAdapter | RegisteredAdapter>) {
    for (const [key, value] of Object.entries(adapters)) {
      this.adapters.set(
        key,
        "adapter" in value
          ? { key, adapter: value.adapter, driver: value.driver }
          : { key, adapter: value },
      );
    }
  }

  resolve(type: string): ResolvedAdapter {
    const match = this.adapters.get(type) ?? this.adapters.get("default");
    if (!match) {
      throw new HtxDiagnosticError(`No adapter configured for content type "${type}".`, {
        code: "ADAPTER_NOT_FOUND",
        stage: "adapter-resolve",
        contentType: type,
      });
    }

    return {
      ...match,
      requestedType: type,
    };
  }

  adapterForType(type: string): ContentAdapter {
    return this.resolve(type).adapter;
  }

  register(name: string, adapter: ContentAdapter | RegisteredAdapter): void {
    this.adapters.set(
      name,
      "adapter" in adapter
        ? { key: name, adapter: adapter.adapter, driver: adapter.driver }
        : { key: name, adapter },
    );
  }

  entries(): RegisteredAdapter[] {
    return [...this.adapters.values()];
  }
}
