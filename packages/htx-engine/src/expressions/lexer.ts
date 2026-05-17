import { ExpressionParseError } from "./errors";
import type { Segment } from "./token";

const MAX_EXPRESSION_LENGTH = 2000;

export class Lexer {
  tokenize(template: string): Segment[] {
    if (template === "") {
      return [];
    }

    const segments: Segment[] = [];
    let position = 0;

    while (position < template.length) {
      const start = template.indexOf("{{", position);

      if (start === -1) {
        const text = template.slice(position);
        if (text !== "") {
          segments.push({ type: "text", content: text });
        }
        break;
      }

      if (start > position) {
        segments.push({ type: "text", content: template.slice(position, start) });
      }

      let expressionStart = start + 2;
      let isRaw = false;
      if (expressionStart < template.length && template[expressionStart] === "!") {
        isRaw = true;
        expressionStart += 1;
      }

      const end = this.findClosingBraces(template, expressionStart);
      if (end === -1) {
        throw new ExpressionParseError("Unclosed expression — missing }}");
      }

      let body = template.slice(expressionStart, end).trim();
      if (body.length > MAX_EXPRESSION_LENGTH) {
        throw new ExpressionParseError(
          `Expression exceeds maximum length of ${MAX_EXPRESSION_LENGTH} characters`,
        );
      }

      if (!isRaw && body.startsWith("html ")) {
        isRaw = true;
        body = body.slice(5).trim();
      }

      segments.push(this.classifyExpression(body, isRaw));
      position = end + 2;
    }

    return segments;
  }

  private findClosingBraces(template: string, from: number): number {
    let position = from;

    while (position < template.length - 1) {
      const char = template[position];
      if (char === '"' || char === "'") {
        position = this.skipString(template, position, char);
        continue;
      }

      if (template[position] === "}" && template[position + 1] === "}") {
        return position;
      }

      position += 1;
    }

    return -1;
  }

  private skipString(template: string, position: number, quote: '"' | "'"): number {
    let cursor = position + 1;

    while (cursor < template.length) {
      if (template[cursor] === "\\") {
        cursor += 2;
        continue;
      }

      if (template[cursor] === quote) {
        return cursor + 1;
      }

      cursor += 1;
    }

    return cursor;
  }

  private classifyExpression(body: string, isRaw: boolean): Segment {
    const ifMatch = body.match(/^if\s+(.+)$/s);
    if (ifMatch) {
      return { type: "block_open", keyword: "if", content: ifMatch[1].trim() };
    }

    const elifMatch = body.match(/^elif\s+(.+)$/s);
    if (elifMatch) {
      return { type: "block_open", keyword: "elif", content: elifMatch[1].trim() };
    }

    if (body === "else") {
      return { type: "block_open", keyword: "else", content: "" };
    }

    if (body === "endif") {
      return { type: "block_close", keyword: "endif" };
    }

    const eachMatch = body.match(/^each\s+(.+)$/s);
    if (eachMatch) {
      return { type: "block_open", keyword: "each", content: eachMatch[1].trim() };
    }

    if (body === "endeach") {
      return { type: "block_close", keyword: "endeach" };
    }

    if (isRaw) {
      return { type: "raw_expression", content: body };
    }

    return { type: "expression", content: body };
  }
}
