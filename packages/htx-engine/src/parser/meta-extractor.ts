import { stripTopLevelHtxTemplates } from "./htx-template-scanner";

export class MetaExtractor {
  extractFromRegion(region: string): Record<string, string | number> {
    return this.extractFromString(region);
  }

  extract(dsl: string): Record<string, string | number> {
    return this.extractFromRootDsl(stripTopLevelHtxTemplates(dsl));
  }

  extractFromRootDsl(rootDsl: string): Record<string, string | number> {
    return this.extractFromString(rootDsl);
  }

  private extractFromString(input: string): Record<string, string | number> {
    const meta: Record<string, string | number> = {};
    const pattern =
      /<htx:([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+([^>]*))?>(.*?)<\/htx:\1>|<htx:([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+([^>]*))?\s*\/>/gs;

    for (const match of input.matchAll(pattern)) {
      const tagName = match[1] || match[4];
      const attributes = this.parseAttributes(match[2] || match[5] || "");
      const content = (match[3] ?? "").trim();
      let value = content || attributes.value || attributes.name || "";

      if (!value) {
        value = attributes.condition || attributes.by || attributes.count || attributes.list || "";
      }

      switch (tagName) {
        case "action":
        case "type":
        case "recordId":
        case "order":
        case "where":
        case "slug":
        case "fields":
          meta[tagName] = value;
          break;
        case "howmany":
        case "offset":
          meta[tagName] = this.parseNumericMeta(value);
          break;
        default:
          meta[tagName] = value;
      }
    }

    return meta;
  }

  private parseNumericMeta(value: string): string | number {
    if (value.includes("{{")) {
      return value;
    }

    const parsed = Number(value || 0);
    return Number.isNaN(parsed) ? 0 : parsed;
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
