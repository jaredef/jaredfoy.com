import { readFileSync } from "node:fs";

import type { ParsedBlock, ParsedResponseBlock } from "../parser/types";
import { ComponentResolver } from "./component-resolver";
import { GetContentExecutor } from "../executors/get-content-executor";
import { DeleteContentExecutor } from "../executors/delete-content-executor";
import { DSLParser } from "../parser/dsl-parser";
import { ExpressionEngine } from "../expressions/expression-engine";
import { Hydrator } from "../services/hydrator";
import { finalizeLiteralOutput } from "../services/literal-syntax";
import { IncludeResolver } from "./include-resolver";
import { LayoutResolver } from "./layout-resolver";
import { LetResolver } from "./let-resolver";
import { Response } from "./response";
import { Router } from "./router";
import { SetContentExecutor } from "../executors/set-content-executor";
import type {
  HtxBody,
  HtxHeaders,
  HtxQuery,
  HtxRequest,
  HtxResponse,
  RouteMatch,
  TemplateRoot,
} from "./types";
import { AdapterRegistry } from "./adapter-registry";
import { escapeHtml, formatDiagnosticLog, renderDiagnosticPage, toDiagnosticError } from "./diagnostics";
import type { Module } from "../contracts/module";
import type { Middleware } from "../contracts/middleware";
import type { ContextProvider } from "../contracts/module-registry";
import type { MutationActionHandler } from "../contracts/mutation-action-handler";
import type { TemplateProcessor } from "../contracts/template-processor";
import { EngineModuleRegistry } from "./engine-module-registry";

export interface RequestHandlerOptions {
  dev?: boolean;
  modules?: Module[];
}

export class RequestHandler {
  private readonly router: Router;
  private readonly parser: DSLParser;
  private readonly expressionEngine: ExpressionEngine;
  private readonly hydrator: Hydrator;
  private readonly registry: AdapterRegistry;
  private readonly layoutResolver: LayoutResolver;
  private readonly includeResolver: IncludeResolver;
  private readonly letResolver: LetResolver;
  private readonly componentResolver: ComponentResolver;
  private readonly getExecutor: GetContentExecutor;
  private readonly setExecutor: SetContentExecutor | null;
  private readonly deleteExecutor: DeleteContentExecutor | null;
  private readonly templateRoot: TemplateRoot;
  private readonly dev: boolean;
  private readonly moduleMiddleware: Middleware[];
  private readonly contextProviders: Map<string, ContextProvider>;
  private readonly templateProcessors: TemplateProcessor[];
  private readonly mutationHandlers: MutationActionHandler[];
  private pendingCookies: string[] = [];

  constructor(
    router: Router,
    parser: DSLParser,
    expressionEngine: ExpressionEngine,
    hydrator: Hydrator,
    registry: AdapterRegistry,
    layoutResolver: LayoutResolver,
    includeResolver: IncludeResolver,
    letResolver: LetResolver,
    componentResolver: ComponentResolver,
    getExecutor: GetContentExecutor,
    templateRoot: TemplateRoot,
    setExecutor: SetContentExecutor | null = null,
    deleteExecutor: DeleteContentExecutor | null = null,
    options: RequestHandlerOptions = {},
  ) {
    this.router = router;
    this.parser = parser;
    this.expressionEngine = expressionEngine;
    this.hydrator = hydrator;
    this.registry = registry;
    this.layoutResolver = layoutResolver;
    this.includeResolver = includeResolver;
    this.letResolver = letResolver;
    this.componentResolver = componentResolver;
    this.getExecutor = getExecutor;
    this.setExecutor = setExecutor;
    this.deleteExecutor = deleteExecutor;
    this.templateRoot = templateRoot;
    this.dev = options.dev ?? false;

    const moduleRegistry = new EngineModuleRegistry();
    moduleRegistry.bootAll(options.modules ?? []);
    this.moduleMiddleware = moduleRegistry.middleware;
    this.contextProviders = moduleRegistry.contextProviders;
    this.templateProcessors = moduleRegistry.templateProcessors;
    this.mutationHandlers = moduleRegistry.mutationHandlers;

    for (const [name, fn] of moduleRegistry.functions) {
      expressionEngine.getFunctionRegistry().register(name, fn);
    }
    for (const [name, adapter] of moduleRegistry.adapters) {
      registry.register(name, adapter);
    }
  }

  async handle(request: Partial<HtxRequest>): Promise<Response> {
    const method = String(request.method ?? "GET").toUpperCase();
    const requestPath = String(request.path ?? "/");
    const headers = request.headers ?? {};
    const body = this.mergePayloadBody(request.body ?? {});
    const query = request.query ?? {};
    const cookies = request.cookies ?? {};

    if (this.moduleMiddleware.length > 0) {
      const fullRequest: HtxRequest = {
        method,
        path: requestPath,
        headers,
        body,
        query,
        cookies,
        raw: request.raw,
      };
      const middlewareResponse = await this.runMiddlewareChain(fullRequest);
      if (middlewareResponse) {
        return new Response(
          middlewareResponse.status,
          middlewareResponse.body,
          middlewareResponse.headers,
          middlewareResponse.cookies ?? [],
        );
      }
    }

    const match = this.router.resolve(requestPath, this.templateRoot);
    if (!match) {
      return Response.notFound();
    }

    try {
      let content = this.runStage(
        () => readFileSync(match.filePath, "utf8"),
        {
          code: "TEMPLATE_READ_ERROR",
          stage: "template-read",
          requestPath,
          templatePath: match.filePath,
        },
      );
      const isHtmx = this.isHtmxRequest(headers);

      content = this.runStage(
        () => this.includeResolver.expand(content, match.filePath, this.templateRoot),
        {
          code: "INCLUDE_RESOLUTION_ERROR",
          stage: "include-expand",
          requestPath,
          templatePath: match.filePath,
        },
      );

      const moduleContext: Record<string, unknown> = {};
      for (const [name, provider] of this.contextProviders) {
        try {
          moduleContext[name] = await Promise.resolve(
            provider.resolve({
              method,
              path: requestPath,
              headers,
              body,
              query,
              cookies,
              raw: request.raw,
            } as HtxRequest),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[HTX] Context provider "${name}" failed: ${message}`);
          moduleContext[name] = {};
        }
      }

      const preLayoutResult = this.runTemplateProcessors(content, moduleContext, "pre-layout");
      if (preLayoutResult.redirect) {
        return Response.redirect(preLayoutResult.redirect);
      }
      content = preLayoutResult.content;

      const data: Record<string, unknown> = {
        ...query,
        ...match.params,
        route: match.params,
        $route: match.params,
        query,
        $query: query,
        ...moduleContext,
      };

      content = this.runStage(
        () => this.componentResolver.resolve(content, data),
        {
          code: "COMPONENT_RESOLUTION_ERROR",
          stage: "component-resolve",
          requestPath,
          templatePath: match.filePath,
        },
      );
      content = this.runStage(
        () => this.letResolver.resolve(content, data),
        {
          code: "LET_RESOLUTION_ERROR",
          stage: "let-resolve",
          requestPath,
          templatePath: match.filePath,
        },
      );

      const initialBlockPass = await this.renderBlockPass(
        content,
        method,
        match,
        query,
        body,
        requestPath,
        "BLOCK_PARSE_ERROR",
        "block-parse",
        "BLOCK_RENDER_ERROR",
        "block-render",
      );
      content = initialBlockPass.content;

      if (method === "POST" && body["htx-token"] && initialBlockPass.blockCount === 0) {
        return this.handleMutationExecute(body);
      }

      if (this.expressionEngine.hasExpressions(content)) {
        content = this.runStage(
          () => this.expressionEngine.evaluate(content, data),
          {
            code: "EXPRESSION_EVALUATION_ERROR",
            stage: "expression-evaluate",
            requestPath,
            templatePath: match.filePath,
          },
        );
      }

      content = this.runStage(
        () => this.hydrator.hydrate(content, data),
        {
          code: "HYDRATION_ERROR",
          stage: "hydrate",
          requestPath,
          templatePath: match.filePath,
        },
      );
      content = this.stripMetaDirectives(content);
      content = this.runStage(
        () => this.layoutResolver.wrap(content, match.filePath, this.templateRoot, isHtmx),
        {
          code: "LAYOUT_RESOLUTION_ERROR",
          stage: "layout-wrap",
          requestPath,
          templatePath: match.filePath,
        },
      );

      const postLayoutResult = this.runTemplateProcessors(content, moduleContext, "post-layout");
      if (postLayoutResult.redirect) {
        return Response.redirect(postLayoutResult.redirect);
      }
      content = postLayoutResult.content;

      if (content.includes("<htx:include")) {
        content = this.runStage(
          () => this.includeResolver.expand(content, match.filePath, this.templateRoot),
          {
            code: "POST_LAYOUT_INCLUDE_ERROR",
            stage: "post-layout-include-expand",
            requestPath,
            templatePath: match.filePath,
          },
        );
      }

      const postLayoutBlockPass = await this.renderBlockPass(
        content,
        method,
        match,
        query,
        body,
        requestPath,
        "POST_LAYOUT_BLOCK_PARSE_ERROR",
        "post-layout-block-parse",
        "POST_LAYOUT_BLOCK_RENDER_ERROR",
        "post-layout-block-render",
      );
      content = this.stripMetaDirectives(postLayoutBlockPass.content);

      if (this.expressionEngine.hasExpressions(content)) {
        content = this.runStage(
          () => this.expressionEngine.evaluate(content, data),
          {
            code: "FINAL_EXPRESSION_EVALUATION_ERROR",
            stage: "final-expression-evaluate",
            requestPath,
            templatePath: match.filePath,
          },
        );
      }

      content = finalizeLiteralOutput(content);

      if (content.includes("%%HTX_REDIRECT%%")) {
        const redirectMatch = content.match(/%%HTX_REDIRECT%%([^\s<]+)/);
        if (redirectMatch) {
          return new Response(302, "", { Location: redirectMatch[1] }, [...this.pendingCookies]);
        }
      }

      const responseCookies = [...this.pendingCookies];
      this.pendingCookies = [];
      return new Response(200, content, { "Content-Type": "text/html; charset=UTF-8" }, responseCookies);
    } catch (error) {
      const diagnostic = toDiagnosticError(error, {
        code: "REQUEST_HANDLER_ERROR",
        stage: "request-handle",
        requestPath,
        templatePath: match.filePath,
      });
      console.error(formatDiagnosticLog(diagnostic));
      return Response.error(
        this.dev
          ? renderDiagnosticPage(diagnostic)
          : "<h1>500 Internal Server Error</h1><p>An HTX runtime error occurred.</p>",
      );
    }
  }

  private async processBlocks(
    content: string,
    blocks: ParsedBlock[],
    method: string,
    match: RouteMatch,
    query: HtxQuery,
    body: HtxBody,
    requestPath: string,
  ): Promise<string> {
    let output = content;

    for (const block of [...blocks].reverse()) {
      const action = typeof block.meta.action === "string" ? block.meta.action : null;
      let rendered = "";

      if (action && method === "POST" && body["htx-token"]) {
        rendered = await this.runStageAsync(
          () => this.executeMutationBlock(action, body, block.meta, block.responses),
          {
            code: "MUTATION_BLOCK_EXECUTE_ERROR",
            stage: "mutation-block-execute",
            requestPath,
            templatePath: match.filePath,
            blockAction: action,
            contentType: typeof block.meta.type === "string" ? block.meta.type : undefined,
          },
        );
      } else if (action && method === "GET") {
        rendered = await this.runStageAsync(
          () => this.prepareMutationBlock(action, block.meta, block.template, match),
          {
            code: "MUTATION_BLOCK_PREPARE_ERROR",
            stage: "mutation-block-prepare",
            requestPath,
            templatePath: match.filePath,
            blockAction: action,
            contentType: typeof block.meta.type === "string" ? block.meta.type : undefined,
          },
        );
      } else if (block.meta.type) {
        rendered = await this.runStageAsync(
          () =>
            this.getExecutor.executeFromParsed(
              block.meta,
              block.template,
              block.responses,
              block.nests,
              {
                diagnosticContext: {
                  requestPath,
                  templatePath: match.filePath,
                },
                queryParams: query,
                routeParams: match.params,
              },
            ),
          {
            code: "CONTENT_BLOCK_RENDER_ERROR",
            stage: "content-block-render",
            requestPath,
            templatePath: match.filePath,
            contentType: typeof block.meta.type === "string" ? block.meta.type : undefined,
          },
        );
      } else {
        rendered = block.template;
      }

      const regionStart = block.regionStart ?? block.startPos;
      output =
        output.slice(0, regionStart) +
        rendered +
        output.slice(block.endPos);
    }

    return output;
  }

  private async prepareMutationBlock(
    action: string,
    meta: Record<string, string | number>,
    template: string,
    match: RouteMatch,
  ): Promise<string> {
    const type = typeof meta.type === "string" ? meta.type : "content";
    const resolvedRecordId = this.resolveMetaValue(meta.recordId, {
      route: match.params,
      $route: match.params,
      query: {},
      $query: {},
    });
    const recordId = resolvedRecordId ?? match.params.id ?? null;
    const resolvedMeta = recordId === null ? meta : { ...meta, recordId };
    const dsl = this.buildDslFromParsed(resolvedMeta, template);

    if (action === "save" || action === "update") {
      if (!this.setExecutor) {
        return '<div class="error">Mutation support not configured.</div>';
      }

      const existingData =
        action === "update" && recordId !== null
          ? (await Promise.resolve(this.registry.adapterForType(type).find(type, String(recordId)))) ?? {}
          : {};
      const result = await this.setExecutor.prepare(dsl, "site:1", 1, existingData, false);
      return result.html;
    }

    if (action === "delete") {
      if (!this.deleteExecutor) {
        return '<div class="error">Delete support not configured.</div>';
      }

      const recordData =
        recordId !== null
          ? (await Promise.resolve(this.registry.adapterForType(type).find(type, String(recordId)))) ?? {}
          : {};
      const result = await this.deleteExecutor.prepare(dsl, "site:1", 1, recordData, false);
      return result.html;
    }

    for (const handler of this.mutationHandlers) {
      if (handler.actions().includes(action)) {
        const result = await Promise.resolve(handler.prepare(action, meta, template, "site:1"));
        return result.html;
      }
    }

    return `<div class="error">Unknown action: ${escapeHtml(action)}</div>`;
  }

  private async executeMutationBlock(
    action: string,
    body: HtxBody,
    meta: Record<string, string | number>,
    responses: ParsedResponseBlock[],
  ): Promise<string> {
    const responseTemplates = this.normalizeResponses(responses);
    const token = String(body["htx-token"] ?? "");
    const type = String(body.type ?? meta.type ?? "content");
    const recordId = body["htx-recordId"] ?? meta.recordId ?? null;
    const formData = { ...body };

    delete formData["htx-token"];
    delete formData["htx-context"];
    delete formData["htx-recordId"];
    delete formData["htx-payload"];

    if (!formData.type) {
      formData.type = type;
    }

    for (const handler of this.mutationHandlers) {
      if (handler.actions().includes(action)) {
        const result = await Promise.resolve(handler.execute(action, formData, responseTemplates));
        if (result.cookies) {
          this.pendingCookies.push(...result.cookies);
        }
        if (result.redirect) {
          return `%%HTX_REDIRECT%%${result.redirect}`;
        }
        return result.html;
      }
    }

    if (action === "delete" && this.deleteExecutor) {
      const result = await this.deleteExecutor.execute(
        token,
        1,
        String(recordId ?? ""),
        type,
        responseTemplates,
      );
      return result.html;
    }

    if (this.setExecutor) {
      const context = action === "update" || recordId ? "update" : "save";
      const result = await this.setExecutor.execute(
        token,
        1,
        context,
        recordId === null ? null : String(recordId),
        formData,
        responseTemplates,
      );
      return result.html;
    }

    return '<div class="error">Mutation support not configured.</div>';
  }

  private async handleMutationExecute(body: HtxBody): Promise<Response> {
    const workingBody = this.mergePayloadBody(body);

    const context = String(workingBody["htx-context"] ?? "save");
    const token = String(workingBody["htx-token"] ?? "");
    const type = String(workingBody.type ?? "content");
    const recordId = workingBody["htx-recordId"];
    const formData = { ...workingBody };

    delete formData["htx-token"];
    delete formData["htx-context"];
    delete formData["htx-recordId"];
    delete formData["htx-payload"];

    for (const handler of this.mutationHandlers) {
      if (handler.actions().includes(context)) {
        const result = await Promise.resolve(handler.execute(context, formData, {}));
        const cookies = result.cookies ?? [];
        if (result.redirect) {
          return new Response(302, "", { Location: result.redirect }, cookies);
        }
        return new Response(200, result.html, { "Content-Type": "text/html; charset=UTF-8" }, cookies);
      }
    }

    try {
      const result =
        context === "delete" && this.deleteExecutor
          ? await this.deleteExecutor.execute(token, 1, String(recordId ?? ""), type)
          : this.setExecutor
            ? await this.setExecutor.execute(
                token,
                1,
                context,
                recordId === null || recordId === undefined ? null : String(recordId),
                formData,
              )
            : null;

      if (!result) {
        return Response.error('<div class="error">Mutation support not configured.</div>');
      }

      if (result.mode === "redirect") {
        return Response.redirect(result.html);
      }

      return new Response(200, result.html, { "Content-Type": "text/html; charset=UTF-8" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[HTX] Mutation error: ${message}`);
      return new Response(422, `<div class="error">${escapeHtml(message)}</div>`, {
        "Content-Type": "text/html; charset=UTF-8",
      });
    }
  }

  private buildDslFromParsed(meta: Record<string, string | number>, template: string): string {
    const directives = Object.entries(meta)
      .filter(([, value]) => value !== null && value !== "")
      .map(([key, value]) => `<htx:${key}>${value}</htx:${key}>`)
      .join("\n");

    return `${directives}${directives ? "\n" : ""}<htx>\n${template}\n</htx>`;
  }

  private async runMiddlewareChain(request: HtxRequest): Promise<HtxResponse | null> {
    let passedThrough = false;

    type MiddlewareHandler = (req: HtxRequest) => Promise<HtxResponse>;

    const templatePipeline: MiddlewareHandler = async () => {
      passedThrough = true;
      return { status: 200, body: "", headers: {} };
    };

    let handler: MiddlewareHandler = templatePipeline;
    for (const middleware of [...this.moduleMiddleware].reverse()) {
      const next: MiddlewareHandler = handler;
      handler = async (req: HtxRequest) => {
        try {
          return await Promise.resolve(middleware.handle(req, next));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[HTX] Middleware error: ${message}`);
          return next(req);
        }
      };
    }

    const response = await handler(request);
    return passedThrough ? null : response;
  }

  private runTemplateProcessors(
    content: string,
    data: Record<string, unknown>,
    phase: "pre-layout" | "post-layout",
  ): { content: string; redirect?: string } {
    let processed = content;
    for (const processor of this.templateProcessors) {
      try {
        const result = processor.process(processed, data, phase);
        if (result.redirect) {
          return result;
        }
        processed = result.content;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[HTX] Template processor error (${phase}): ${message}`);
      }
    }

    return { content: processed };
  }

  private stripMetaDirectives(content: string): string {
    let stripped = content;
    const directives = ["type", "where", "order", "howmany", "offset", "slug", "fields", "action", "recordId", "rel"];

    for (const directive of directives) {
      stripped = stripped.replace(
        new RegExp(`<htx:${directive}[^>]*>.*?<\\/htx:${directive}>`, "gs"),
        "",
      );
    }

    stripped = stripped.replace(/<htx:response[^>]*>.*?<\/htx:response[^>]*>/gs, "");
    stripped = stripped.replace(
      /<htx:(?:type|where|order|howmany|offset|slug|fields|action|recordId|rel|response)\b[^>]*\/>/gs,
      "",
    );
    return stripped.replace(/\n{3,}/g, "\n\n");
  }

  private isHtmxRequest(headers: HtxHeaders): boolean {
    return Boolean(headers["HX-Request"] || headers["hx-request"]);
  }

  private mergePayloadBody(body: HtxBody): HtxBody {
    const workingBody = { ...body };

    if (typeof workingBody["htx-payload"] === "string") {
      try {
        const payload = JSON.parse(workingBody["htx-payload"]);
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          Object.assign(workingBody, payload);
        }
      } catch {
        // Preserve PHP-style best effort payload decoding.
      }
    }

    return workingBody;
  }

  private normalizeResponses(responses: ParsedResponseBlock[]): Record<string, string> {
    return Object.fromEntries(responses.map((response) => [response.name, response.template]));
  }

  private resolveMetaValue(
    value: string | number | undefined,
    data: Record<string, unknown>,
  ): string | number | null {
    if (value === undefined) {
      return null;
    }

    if (typeof value === "string" && this.expressionEngine.hasExpressions(value)) {
      return this.expressionEngine.evaluate(value, data);
    }

    return value;
  }

  private runStage<T>(
    callback: () => T,
    details: Parameters<typeof toDiagnosticError>[1],
  ): T {
    try {
      return callback();
    } catch (error) {
      throw toDiagnosticError(error, details);
    }
  }

  private async runStageAsync<T>(
    callback: () => Promise<T>,
    details: Parameters<typeof toDiagnosticError>[1],
  ): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      throw toDiagnosticError(error, details);
    }
  }

  private async renderBlockPass(
    content: string,
    method: string,
    match: RouteMatch,
    query: HtxQuery,
    body: HtxBody,
    requestPath: string,
    parseCode: string,
    parseStage: string,
    renderCode: string,
    renderStage: string,
  ): Promise<{ blockCount: number; content: string }> {
    const blocks = this.runStage(
      () => this.parser.parseBlocks(content),
      {
        code: parseCode,
        stage: parseStage,
        requestPath,
        templatePath: match.filePath,
      },
    );

    if (blocks.length === 0) {
      return { blockCount: 0, content };
    }

    const rendered = await this.runStageAsync(
      () => this.processBlocks(content, blocks, method, match, query, body, requestPath),
      {
        code: renderCode,
        stage: renderStage,
        requestPath,
        templatePath: match.filePath,
      },
    );

    return {
      blockCount: blocks.length,
      content: rendered,
    };
  }
}
