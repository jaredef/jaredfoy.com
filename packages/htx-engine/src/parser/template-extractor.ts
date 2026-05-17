import type { HtxTemplateRange } from "./htx-template-scanner";
import { scanTopLevelHtxTemplates } from "./htx-template-scanner";

export class TemplateExtractor {
  extract(dsl: string): string {
    return this.extractFromRanges(scanTopLevelHtxTemplates(dsl));
  }

  extractWithAttributes(dsl: string): { content: string; attributes: Record<string, string> } {
    return this.extractWithAttributesFromRanges(scanTopLevelHtxTemplates(dsl));
  }

  hasTemplate(dsl: string): boolean {
    return scanTopLevelHtxTemplates(dsl).length > 0;
  }

  extractAll(dsl: string): Array<{ content: string; attributes: Record<string, string> }> {
    return this.extractAllFromRanges(scanTopLevelHtxTemplates(dsl));
  }

  extractFromRanges(ranges: HtxTemplateRange[]): string {
    return ranges[0]?.content ?? "";
  }

  extractWithAttributesFromRanges(
    ranges: HtxTemplateRange[],
  ): { content: string; attributes: Record<string, string> } {
    const template = ranges[0];
    if (!template) {
      return { content: "", attributes: {} };
    }

    return {
      content: template.content,
      attributes: this.parseAttributes(template.attributes),
    };
  }

  extractAllFromRanges(
    ranges: HtxTemplateRange[],
  ): Array<{ content: string; attributes: Record<string, string> }> {
    return ranges.map((template) => ({
      content: template.content,
      attributes: this.parseAttributes(template.attributes),
    }));
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
