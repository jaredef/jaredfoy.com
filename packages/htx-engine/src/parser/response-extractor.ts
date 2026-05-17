import { stripTopLevelHtxTemplates } from "./htx-template-scanner";

export class ResponseExtractor {
  extract(dsl: string): Record<string, string> {
    return this.extractFromRootDsl(stripTopLevelHtxTemplates(dsl));
  }

  extractFromRootDsl(rootDsl: string): Record<string, string> {
    const responses: Record<string, string> = {};
    const pattern = /<htx:response([a-zA-Z]*)(?:\s+([^>]*))?>(.*?)<\/htx:response\1>/gs;

    for (const match of rootDsl.matchAll(pattern)) {
      const attributes = this.parseAttributes(match[2] ?? "");
      const responseType = (attributes.name || match[1] || "default").toLowerCase();
      responses[responseType] = match[3].trim();
    }

    return responses;
  }

  extractResponse(dsl: string, type: string): string | null {
    return this.extract(dsl)[type] ?? null;
  }

  hasResponse(dsl: string, type: string): boolean {
    return this.extract(dsl)[type] !== undefined;
  }

  private parseAttributes(attributeString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const pattern = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(["']?)([^"'>\s]+)\2/g;

    for (const match of attributeString.matchAll(pattern)) {
      attributes[match[1]] = match[3].trim().replace(/^['"]|['"]$/g, "");
    }

    return attributes;
  }
}
