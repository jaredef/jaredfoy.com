export interface NestSpec {
  id: number;
  source: "name" | "type" | "rel" | null;
  field: string | null;
  type: string | null;
  where: string | null;
  order: string | null;
  limit: number | null;
  status: string | null;
  depth: number | null;
  onError: string;
  paginate: string | null;
  innerTemplate: string;
  noneTemplate: string | null;
  errorTemplate: string | null;
  children: NestSpec[];
}

export class NestTreeBuilder {
  private nextId = 0;

  build(template: string): { template: string; nests: NestSpec[] } {
    this.nextId = 0;
    const nests: NestSpec[] = [];
    const updatedTemplate = this.extractNests(template, nests);
    return { template: updatedTemplate, nests };
  }

  private extractNests(template: string, nests: NestSpec[]): string {
    let output = template;

    while (true) {
      const blockInfo = this.findOutermostAttributedEach(output);
      if (!blockInfo) {
        return output;
      }

      const spec = this.buildSpec(blockInfo.attributes, blockInfo.innerContent);
      const children: NestSpec[] = [];
      spec.innerTemplate = this.extractNests(spec.innerTemplate, children);
      spec.children = children;

      const placeholder = `{{__nest_${spec.id}__}}`;
      output =
        output.slice(0, blockInfo.startPos) +
        placeholder +
        output.slice(blockInfo.startPos + blockInfo.length);

      nests.push(spec);
    }
  }

  private findOutermostAttributedEach(template: string) {
    const openTagPattern = /<htx:each\s+([^>]*(?:name|type|rel)\s*=\s*[^>]*)>/;
    const openMatch = template.match(openTagPattern);
    if (!openMatch || openMatch.index === undefined) {
      return null;
    }

    const startPos = openMatch.index;
    const attributeString = openMatch[1];
    const openTagEnd = startPos + openMatch[0].length;
    let depth = 1;
    let position = openTagEnd;

    while (position < template.length && depth > 0) {
      const nextOpen = template.indexOf("<htx:each", position);
      const nextClose = template.indexOf("</htx:each>", position);

      if (nextClose === -1) {
        return null;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        position = nextOpen + "<htx:each".length;
      } else {
        depth -= 1;
        if (depth === 0) {
          const closeTagEnd = nextClose + "</htx:each>".length;
          return {
            startPos,
            length: closeTagEnd - startPos,
            attributes: this.parseAttributes(attributeString),
            innerContent: template.slice(openTagEnd, nextClose),
          };
        }
        position = nextClose + "</htx:each>".length;
      }
    }

    return null;
  }

  private buildSpec(attributes: Record<string, string>, innerContent: string): NestSpec {
    let source: NestSpec["source"] = null;
    let field: string | null = null;
    let type: string | null = null;

    if (attributes.name) {
      source = "name";
      field = attributes.name;
    } else if (attributes.type) {
      source = "type";
      type = attributes.type;
    } else if (attributes.rel) {
      source = "rel";
      field = attributes.rel;
    }

    const noneTemplate = this.extractSiblingBlock(innerContent, "none");
    const errorTemplate = this.extractSiblingBlock(innerContent, "error");
    let contentForTemplate = innerContent;
    const paginate = this.extractPaginateDirective(contentForTemplate);
    contentForTemplate = this.stripDirectives(contentForTemplate);
    contentForTemplate = this.stripSiblingBlock(contentForTemplate, "none");
    contentForTemplate = this.stripSiblingBlock(contentForTemplate, "error");

    return {
      id: this.nextId++,
      source,
      field,
      type,
      where: this.extractDirective(innerContent, "where"),
      order: this.extractDirective(innerContent, "order"),
      limit: this.numberOrNull(this.extractDirective(innerContent, "limit")),
      status: this.extractDirective(innerContent, "status"),
      depth: this.numberOrNull(this.extractDirective(innerContent, "depth")),
      onError: this.extractDirective(innerContent, "on-error") ?? "graceful",
      paginate,
      innerTemplate: contentForTemplate.trim(),
      noneTemplate,
      errorTemplate,
      children: [],
    };
  }

  private extractDirective(content: string, name: string): string | null {
    const match = content.match(
      new RegExp(`<htx:${name}>(.*?)</htx:${name}>`, "s"),
    );
    return match ? match[1].trim() : null;
  }

  private extractPaginateDirective(content: string): string | null {
    const match = content.match(/<htx:paginate\s+as="([^"]+)"\s*\/?>(?:<\/htx:paginate>)?/);
    return match ? match[1] : null;
  }

  private extractSiblingBlock(content: string, name: string): string | null {
    const match = content.match(new RegExp(`<htx:${name}>(.*?)</htx:${name}>`, "s"));
    return match ? match[1].trim() : null;
  }

  private stripDirectives(content: string): string {
    let output = content;
    for (const name of ["where", "order", "limit", "depth", "status", "on-error"]) {
      output = output.replace(new RegExp(`<htx:${name}>.*?</htx:${name}>`, "gs"), "");
    }
    output = output.replace(/<htx:paginate\s+[^>]*\/?>(?:<\/htx:paginate>)?/g, "");
    return output;
  }

  private stripSiblingBlock(content: string, name: string): string {
    return content.replace(new RegExp(`<htx:${name}>.*?</htx:${name}>`, "gs"), "");
  }

  private parseAttributes(input: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const pattern = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*"([^"]*)"|([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*'([^']*)'/g;

    for (const match of input.matchAll(pattern)) {
      if (match[1]) {
        attributes[match[1]] = match[2];
      } else if (match[3]) {
        attributes[match[3]] = match[4];
      }
    }

    return attributes;
  }

  private numberOrNull(value: string | null): number | null {
    return value === null ? null : Number(value);
  }
}
