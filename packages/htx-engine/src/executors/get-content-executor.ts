import type { ParsedResponseBlock } from "../parser/types";
import { DSLParser } from "../parser/dsl-parser";
import { ExpressionEngine } from "../expressions/expression-engine";
import { Hydrator } from "../services/hydrator";
import { finalizeLiteralOutput } from "../services/literal-syntax";
import type { ContentRow, QueryMeta } from "../contracts/content-adapter";
import { AdapterRegistry } from "../runtime/adapter-registry";
import { formatDiagnosticLog, renderInlineDiagnostic, toDiagnosticError } from "../runtime/diagnostics";

type ResponseMap = Record<string, string> | ParsedResponseBlock[];

interface GetContentExecutorOptions {
  dev?: boolean;
}

interface GetContentExecutorContext {
  diagnosticContext?: Record<string, string>;
  queryParams?: Record<string, string>;
  routeParams?: Record<string, string>;
}

export class GetContentExecutor {
  private readonly parser: DSLParser;
  private readonly registry: AdapterRegistry;
  private readonly hydrator: Hydrator;
  private readonly expressionEngine: ExpressionEngine;
  private readonly dev: boolean;

  constructor(
    parser: DSLParser,
    registry: AdapterRegistry,
    hydrator: Hydrator,
    expressionEngine: ExpressionEngine,
    options: GetContentExecutorOptions = {},
  ) {
    this.parser = parser;
    this.registry = registry;
    this.hydrator = hydrator;
    this.expressionEngine = expressionEngine;
    this.dev = options.dev ?? false;
  }

  async execute(dsl: string, context: GetContentExecutorContext = {}): Promise<string> {
    const parsed = this.parser.parse(dsl);
    if (!parsed.template) {
      throw new Error("No template found in DSL");
    }

    return finalizeLiteralOutput(
      await this.executeFromParsed(
        parsed.meta,
        parsed.template,
        parsed.responses,
        parsed.nests,
        context,
      ),
    );
  }

  async executeFromParsed(
    meta: QueryMeta | Record<string, unknown>,
    template: string,
    responses: ResponseMap = {},
    nests: unknown[] = [],
    context: GetContentExecutorContext = {},
  ): Promise<string> {
    void nests;
    const resolvedTemplate = await this.renderNestedBlocks(template, context);
    const evaluatedMeta = this.evaluateMetaExpressions(meta, context);
    const resolved = this.registry.resolve(evaluatedMeta.type);
    const result = await this.wrapDiagnosticAsync(
      () => Promise.resolve(resolved.adapter.query(evaluatedMeta)),
      {
        code: "CONTENT_QUERY_ERROR",
        stage: "content-query",
        requestPath: context.diagnosticContext?.requestPath,
        templatePath: context.diagnosticContext?.templatePath,
        contentType: evaluatedMeta.type,
      },
    );
    const rows = result.rows ?? [];
    const total = result.total ?? rows.length;

    if (rows.length === 0) {
      return this.handleEmptyResult(resolvedTemplate, responses, { total, count: 0 }, context);
    }

    return this.hydrateWithData(resolvedTemplate, rows, responses, total, context);
  }

  private handleEmptyResult(
    template: string,
    responses: ResponseMap,
    resultMeta: Record<string, number>,
    context: GetContentExecutorContext,
  ): string {
    const noneMatch = template.match(/<htx:none>(.*?)<\/htx:none>/s);
    if (noneMatch) {
      const noneContent = noneMatch[1].trim();
      if (this.expressionEngine.hasExpressions(noneContent)) {
        return this.expressionEngine.evaluate(noneContent, this.injectRequestContext({}, resultMeta, context));
      }
      return noneContent;
    }

    const responseMap = this.normalizeResponses(responses);
    if (responseMap.none) {
      return responseMap.none;
    }

    return '<div class="no-content">No content found.</div>';
  }

  private async hydrateWithData(
    template: string,
    rows: ContentRow[],
    _responses: ResponseMap,
    total: number,
    context: GetContentExecutorContext,
  ): Promise<string> {
    const resultMeta = { total, count: rows.length };
    const eachMatches = this.findEachBlocks(template);

    if (eachMatches.length > 0) {
      let output = template;

      for (const match of [...eachMatches].reverse()) {
        const offset = match.start;
        const whereCondition = match.whereAttr;
        const itemTemplate = match.content;
        const filteredRows = whereCondition
          ? rows.filter((row) => {
              const rowContext = this.injectRequestContext(row, resultMeta, context);
              return this.expressionEngine.evaluateCondition(whereCondition, rowContext);
            })
          : rows;

        const itemsHtml: string[] = [];
        for (let index = 0; index < filteredRows.length; index += 1) {
          const row = filteredRows[index];
          try {
            const rowContext = this.injectRequestContext(row, resultMeta, context);
            rowContext.loop = {
              index,
              count: index + 1,
              first: index === 0,
              last: index === filteredRows.length - 1,
              length: filteredRows.length,
            };

            const resolvedTemplate = await this.resolveRelationalBlocks(itemTemplate, row, context);
            const evaluated = this.expressionEngine.hasExpressions(resolvedTemplate)
              ? this.expressionEngine.evaluate(resolvedTemplate, rowContext)
              : resolvedTemplate;
            itemsHtml.push(this.hydrator.hydrate(evaluated, rowContext, new Set(Object.keys(row))));
          } catch (error) {
            const diagnostic = toDiagnosticError(error, {
              code: "ROW_RENDER_ERROR",
              stage: "row-render",
              requestPath: context.diagnosticContext?.requestPath,
              templatePath: context.diagnosticContext?.templatePath,
              contentType: String(row.type ?? ""),
              itemIndex: index,
            });
            console.error(formatDiagnosticLog(diagnostic));
            itemsHtml.push(this.dev ? renderInlineDiagnostic(diagnostic) : "");
          }
        }

        output = output.slice(0, offset) + itemsHtml.join("") + output.slice(match.end);
      }

      output = output.replace(/<htx:none>.*?<\/htx:none>/gs, "");
      if (this.expressionEngine.hasExpressions(output)) {
        output = this.expressionEngine.evaluate(output, this.injectRequestContext({}, resultMeta, context));
      }
      return output;
    }

    const data = this.injectRequestContext(rows[0] ?? {}, resultMeta, context);
    const evaluated = this.expressionEngine.hasExpressions(template)
      ? this.expressionEngine.evaluate(template, data)
      : template;
    return this.hydrator.hydrate(evaluated, data, new Set(Object.keys(rows[0] ?? {})));
  }

  private findEachBlocks(
    template: string,
  ): Array<{ start: number; end: number; content: string; whereAttr: string }> {
    const blocks: Array<{ start: number; end: number; content: string; whereAttr: string }> = [];
    const openPattern = /<htx:each(?:\s+where="([^"]*)")?\s*>/g;
    let openMatch: RegExpExecArray | null;

    while ((openMatch = openPattern.exec(template)) !== null) {
      const contentStart = openMatch.index + openMatch[0].length;
      let depth = 1;
      let position = contentStart;

      while (depth > 0 && position < template.length) {
        const nextOpen = template.indexOf("<htx:each", position);
        const nextClose = template.indexOf("</htx:each>", position);
        if (nextClose === -1) {
          break;
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth += 1;
          position = template.indexOf(">", nextOpen) + 1;
        } else {
          depth -= 1;
          if (depth === 0) {
            const blockEnd = nextClose + "</htx:each>".length;
            blocks.push({
              start: openMatch.index,
              end: blockEnd,
              content: template.slice(contentStart, nextClose),
              whereAttr: openMatch[1] ?? "",
            });
            openPattern.lastIndex = blockEnd;
          }
          position = nextClose + "</htx:each>".length;
        }
      }
    }

    return blocks;
  }

  private evaluateMetaExpressions(
    meta: QueryMeta | Record<string, unknown>,
    context: GetContentExecutorContext,
  ): QueryMeta {
    const evaluatedMeta: Record<string, unknown> = { ...meta };
    const evaluationContext = this.injectRequestContext({}, {}, context);

    for (const [key, value] of Object.entries(evaluatedMeta)) {
      if (typeof value === "string" && this.expressionEngine.hasExpressions(value)) {
        const evaluated = this.expressionEngine.evaluate(value, evaluationContext);
        if (["offset", "howmany", "recordId"].includes(key)) {
          const numericValue = this.parseNumericMetaValue(evaluated);
          evaluatedMeta[key] = numericValue ?? evaluated;
        } else {
          evaluatedMeta[key] = evaluated;
        }
      }
    }

    return this.queryMetaFromParsedMeta(evaluatedMeta);
  }

  private injectRequestContext(
    data: Record<string, unknown>,
    resultMeta: Record<string, number> = {},
    requestContext: GetContentExecutorContext = {},
  ): Record<string, unknown> {
    const scopedData = { ...data };
    if (Object.keys(requestContext.queryParams ?? {}).length > 0) {
      scopedData.query = requestContext.queryParams;
      scopedData.$query = requestContext.queryParams;
    }
    if (Object.keys(requestContext.routeParams ?? {}).length > 0) {
      scopedData.route = requestContext.routeParams;
      scopedData.$route = requestContext.routeParams;
    }
    if (Object.keys(resultMeta).length > 0) {
      scopedData.result = resultMeta;
      scopedData.$result = resultMeta;
    }
    return scopedData;
  }

  private async renderNestedBlocks(template: string, context: GetContentExecutorContext): Promise<string> {
    const blocks = this.parser.parseBlocks(template);
    if (blocks.length === 0) {
      return template;
    }

    let output = template;
    for (const block of [...blocks].reverse()) {
      if (block.meta.rel) {
        continue;
      }

      const rendered = block.meta.type
        ? await this.executeFromParsed(
            this.queryMetaFromParsedMeta(block.meta),
            block.template,
            block.responses,
            block.nests,
            context,
          )
        : await this.renderNestedBlocks(block.template, context);
      const regionStart = block.regionStart ?? block.startPos;
      output = output.slice(0, regionStart) + rendered + output.slice(block.endPos);
    }

    return output;
  }

  private async resolveRelationalBlocks(
    template: string,
    parentRow: ContentRow,
    context: GetContentExecutorContext,
  ): Promise<string> {
    const blocks = this.parser.parseBlocks(template);
    if (blocks.length === 0) {
      return template;
    }

    let output = template;
    for (const block of [...blocks].reverse()) {
      if (!block.meta.rel) {
        continue;
      }

      const resolvedMeta = this.resolveRelDirective(block.meta, parentRow);
      const rendered = await this.executeFromParsed(
        this.queryMetaFromParsedMeta(resolvedMeta),
        block.template,
        block.responses,
        block.nests,
        context,
      );

      const regionStart = block.regionStart ?? block.startPos;
      output = output.slice(0, regionStart) + rendered + output.slice(block.endPos);
    }

    return output;
  }

  private resolveRelDirective(
    meta: Record<string, unknown>,
    parentRow: ContentRow,
  ): Record<string, unknown> {
    const rel = String(meta.rel ?? "");
    if (!rel) {
      return meta;
    }

    const conditions = rel.split(",").map((condition) => condition.trim());
    const resolvedConditions: string[] = [];

    for (const condition of conditions) {
      const separator = condition.indexOf("=");
      if (separator === -1) {
        continue;
      }

      const childField = condition.slice(0, separator).trim();
      const parentRef = condition.slice(separator + 1).trim();

      if (parentRef.startsWith("parent.")) {
        const parentField = parentRef.slice("parent.".length);
        resolvedConditions.push(`${childField}=${String(parentRow[parentField] ?? "")}`);
      } else {
        resolvedConditions.push(condition);
      }
    }

    const existingWhere = typeof meta.where === "string" ? meta.where : "";
    const where = [existingWhere, ...resolvedConditions].filter(Boolean).join(",");
    const { rel: _rel, ...rest } = meta;
    return { ...rest, where };
  }

  private normalizeResponses(responses: ResponseMap): Record<string, string> {
    if (Array.isArray(responses)) {
      return Object.fromEntries(responses.map((response) => [response.name, response.template]));
    }

    return responses;
  }

  private queryMetaFromParsedMeta(meta: Record<string, unknown>): QueryMeta {
    return {
      type: String(meta.type ?? ""),
      slug: typeof meta.slug === "string" ? meta.slug : undefined,
      where: typeof meta.where === "string" ? meta.where : undefined,
      order: typeof meta.order === "string" ? meta.order : undefined,
      howmany: this.parseNumericMetaValue(meta.howmany),
      offset: this.parseNumericMetaValue(meta.offset),
      fields: typeof meta.fields === "string" ? meta.fields : undefined,
    };
  }

  private parseNumericMetaValue(value: unknown): number | undefined {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value !== "string" || value === "" || value.includes("{{")) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private async wrapDiagnosticAsync<T>(
    callback: () => Promise<T>,
    details: Parameters<typeof toDiagnosticError>[1],
  ): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      throw toDiagnosticError(error, details);
    }
  }
}
