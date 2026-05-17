import { ExpressionEngine } from "../expressions/expression-engine";

export class LetResolver {
  private readonly expressionEngine: ExpressionEngine;

  constructor(expressionEngine: ExpressionEngine) {
    this.expressionEngine = expressionEngine;
  }

  resolve(content: string, data: Record<string, unknown>): string {
    let output = content;
    let iterations = 0;

    while (output.includes("<htx:let") && iterations < 100) {
      output = this.resolveFirstLet(output, data);
      iterations += 1;
    }

    return output;
  }

  private resolveFirstLet(content: string, data: Record<string, unknown>): string {
    const tagStart = content.indexOf("<htx:let");
    if (tagStart === -1) {
      return content;
    }

    let tagEnd = content.indexOf("/>", tagStart);
    if (tagEnd === -1) {
      tagEnd = content.indexOf(">", tagStart);
      if (tagEnd === -1) {
        throw new Error("Unclosed <htx:let> tag");
      }
      tagEnd += 1;
    } else {
      tagEnd += 2;
    }

    const fullTag = content.slice(tagStart, tagEnd);
    const tagContent = fullTag
      .replace(/^<htx:let/, "")
      .replace(/\/?>$/, "")
      .trim();

    const parsed = this.parseAttributeStyle(tagContent) ?? this.parseShorthand(tagContent);
    if (!parsed) {
      throw new Error(`Invalid <htx:let> syntax: could not parse "${tagContent}"`);
    }

    const [name, expression] = parsed;
    data[name] = this.expressionEngine.evaluateRaw(`{{ ${expression} }}`, data);

    const before = content.slice(0, tagStart);
    let after = content.slice(tagEnd);
    if (after.startsWith("\n")) {
      after = after.slice(1);
    }

    return before + after;
  }

  private parseAttributeStyle(tagContent: string): [string, string] | null {
    const attrs: Record<string, string> = {};
    const pattern = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

    for (const match of tagContent.matchAll(pattern)) {
      attrs[match[1]] = match[2] !== "" ? match[2] : (match[3] ?? "");
    }

    if (attrs.name && attrs.value) {
      return [attrs.name, attrs.value];
    }

    return null;
  }

  private parseShorthand(tagContent: string): [string, string] | null {
    const trimmed = tagContent.replace(/\/$/, "").trim();
    const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/s);
    return match ? [match[1].trim(), match[2].trim()] : null;
  }
}
