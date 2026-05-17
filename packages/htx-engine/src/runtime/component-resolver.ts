import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { ExpressionEngine } from "../expressions/expression-engine";
import { IncludeResolver } from "./include-resolver";
import { PropsParser } from "./props-parser";
import { TemplateResolver } from "./template-resolver";

const MAX_DEPTH = 10;

export class ComponentResolver {
  private readonly templatesDir: string;
  private readonly templateResolver: TemplateResolver | null;
  private readonly expressionEngine: ExpressionEngine;
  private readonly includeResolver: IncludeResolver;
  private readonly propsParser: PropsParser;

  constructor(
    templatesDir: string | TemplateResolver,
    expressionEngine: ExpressionEngine,
    includeResolver: IncludeResolver,
  ) {
    if (templatesDir instanceof TemplateResolver) {
      this.templateResolver = templatesDir;
      this.templatesDir = templatesDir.getPrimary();
    } else {
      this.templateResolver = null;
      this.templatesDir = templatesDir;
    }

    this.expressionEngine = expressionEngine;
    this.includeResolver = includeResolver;
    this.propsParser = new PropsParser();
  }

  resolve(content: string, data: Record<string, unknown>, depth = 0): string {
    if (depth >= MAX_DEPTH) {
      throw new Error(`Component nesting depth exceeded (max ${MAX_DEPTH})`);
    }

    let output = content;
    let iteration = 0;
    while (output.includes("<htx:component") && iteration < 100) {
      output = this.resolveOnePass(output, data, depth);
      iteration += 1;
    }

    return output;
  }

  private resolveOnePass(content: string, data: Record<string, unknown>, depth: number): string {
    let result = "";
    let position = 0;

    while (position < content.length) {
      const tagStart = content.indexOf("<htx:component", position);
      if (tagStart === -1) {
        result += content.slice(position);
        break;
      }

      result += content.slice(position, tagStart);
      const parsed = this.parseComponentTag(content, tagStart);

      if (!parsed) {
        result += "<htx:component";
        position = tagStart + "<htx:component".length;
        continue;
      }

      result += this.renderComponent(
        parsed.src,
        parsed.props,
        parsed.children,
        parsed.fills,
        data,
        depth,
      );

      position = parsed.endPos;
    }

    return result;
  }

  private parseComponentTag(
    content: string,
    start: number,
  ): {
    src: string;
    props: Record<string, string>;
    children: string;
    fills: Record<string, string>;
    endPos: number;
  } | null {
    let position = start + "<htx:component".length;
    let inQuote: '"' | "'" | null = null;
    let tagEnd: number | null = null;
    let selfClosing = false;

    while (position < content.length) {
      const char = content[position];
      if (inQuote) {
        if (char === inQuote) {
          inQuote = null;
        }
        position += 1;
        continue;
      }

      if (char === '"' || char === "'") {
        inQuote = char;
        position += 1;
        continue;
      }

      if (char === "/" && content[position + 1] === ">") {
        selfClosing = true;
        tagEnd = position + 2;
        break;
      }

      if (char === ">") {
        tagEnd = position + 1;
        break;
      }

      position += 1;
    }

    if (tagEnd === null) {
      return null;
    }

    const attrString = content.slice(
      start + "<htx:component".length,
      selfClosing ? tagEnd - 2 : tagEnd - 1,
    );
    const attrs = this.parseAttributes(attrString);
    const src = attrs.src;
    if (!src) {
      throw new Error('<htx:component> requires a "src" attribute');
    }
    delete attrs.src;

    if (selfClosing) {
      return { src, props: attrs, children: "", fills: {}, endPos: tagEnd };
    }

    const closePos = this.findClosingTag(content, tagEnd, "<htx:component", "</htx:component>");
    if (closePos === null) {
      throw new Error("Unclosed <htx:component> tag");
    }

    const body = content.slice(tagEnd, closePos);
    const fills = this.extractFills(body);
    const children = fills.__default__ ?? "";
    delete fills.__default__;

    return {
      src,
      props: attrs,
      children,
      fills,
      endPos: closePos + "</htx:component>".length,
    };
  }

  private findClosingTag(
    content: string,
    from: number,
    openTag: string,
    closeTag: string,
  ): number | null {
    let depth = 1;
    let position = from;

    while (position < content.length && depth > 0) {
      const nextOpen = content.indexOf(openTag, position);
      const nextClose = content.indexOf(closeTag, position);

      if (nextClose === -1) {
        return null;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        const nestedEnd = content.indexOf(">", nextOpen);
        if (nestedEnd !== -1 && content[nestedEnd - 1] !== "/") {
          depth += 1;
        }
        position = nestedEnd + 1;
      } else {
        depth -= 1;
        if (depth === 0) {
          return nextClose;
        }
        position = nextClose + closeTag.length;
      }
    }

    return null;
  }

  private extractFills(body: string): Record<string, string> {
    const fills: Record<string, string> = {};
    let defaultContent = "";
    let position = 0;

    while (position < body.length) {
      const fillStart = body.indexOf("<htx:fill", position);
      if (fillStart === -1) {
        defaultContent += body.slice(position);
        break;
      }

      defaultContent += body.slice(position, fillStart);
      const tagEnd = body.indexOf(">", fillStart);
      if (tagEnd === -1) {
        defaultContent += body.slice(fillStart);
        break;
      }

      const attrs = this.parseAttributes(body.slice(fillStart + "<htx:fill".length, tagEnd));
      const name = attrs.name ?? "default";
      const closePos = body.indexOf("</htx:fill>", tagEnd + 1);
      if (closePos === -1) {
        throw new Error("Unclosed <htx:fill> tag");
      }

      fills[name] = body.slice(tagEnd + 1, closePos);
      position = closePos + "</htx:fill>".length;
    }

    fills.__default__ = defaultContent.trim();
    return fills;
  }

  private renderComponent(
    src: string,
    props: Record<string, string>,
    defaultChildren: string,
    namedFills: Record<string, string>,
    parentData: Record<string, unknown>,
    depth: number,
  ): string {
    const filePath = this.resolveSrc(src);
    if (!existsSync(filePath)) {
      throw new Error(`Component not found: ${src} (looked in ${filePath})`);
    }

    let template = readFileSync(filePath, "utf8");
    const extracted = this.propsParser.extract(template);
    template = extracted.template;

    let mergedProps: Record<string, unknown> = props;
    if (Object.keys(extracted.props).length > 0) {
      mergedProps = this.propsParser.validate(props, extracted.props, src);
    }

    template = this.includeResolver.expand(
      template,
      filePath,
      this.templateResolver ?? this.templatesDir,
    );

    let evaluatedDefaultChildren = defaultChildren;
    if (this.expressionEngine.hasExpressions(evaluatedDefaultChildren)) {
      evaluatedDefaultChildren = this.expressionEngine.evaluate(evaluatedDefaultChildren, parentData);
    }

    const evaluatedFills: Record<string, string> = {};
    for (const [name, fillContent] of Object.entries(namedFills)) {
      evaluatedFills[name] = this.expressionEngine.hasExpressions(fillContent)
        ? this.expressionEngine.evaluate(fillContent, parentData)
        : fillContent;
    }

    template = this.resolveSlots(template, evaluatedDefaultChildren, evaluatedFills);
    template = this.resolve(template, { ...parentData, ...mergedProps }, depth + 1);

    const scopedData = { ...parentData, ...mergedProps };
    if (this.expressionEngine.hasExpressions(template)) {
      template = this.expressionEngine.evaluate(template, scopedData);
    }

    return template;
  }

  private resolveSlots(
    template: string,
    defaultChildren: string,
    namedFills: Record<string, string>,
  ): string {
    let output = template.replace(
      /<htx:slot\s+name=["']([^"']+)["']\s*>(.*?)<\/htx:slot>/gs,
      (_match, name, fallback) => namedFills[name] ?? fallback,
    );

    output = output.replace(
      /<htx:slot\s+name=["']([^"']+)["']\s*\/?>/g,
      (_match, name) => namedFills[name] ?? "",
    );

    output = output.replace(
      /<htx:slot\s*>(.*?)<\/htx:slot>/gs,
      (_match, fallback) => (defaultChildren !== "" ? defaultChildren : fallback),
    );

    output = output.replaceAll("<htx:slot />", defaultChildren);
    output = output.replaceAll("<htx:slot/>", defaultChildren);
    return output;
  }

  private parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const pattern = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

    for (const match of attrString.matchAll(pattern)) {
      attrs[match[1]] = match[2] !== "" ? match[2] : (match[3] ?? "");
    }

    return attrs;
  }

  private resolveSrc(src: string): string {
    const relativePath = src.replace(/^\/+/, "");
    if (this.templateResolver) {
      const resolved = this.templateResolver.resolve(relativePath);
      if (resolved) {
        return resolved;
      }
    }

    return src.startsWith("/")
      ? path.join(this.templatesDir, src)
      : path.join(this.templatesDir, src);
  }
}
