import { DSLParser } from "../parser/dsl-parser";
import type { ContentRow } from "../contracts/content-adapter";
import { Hydrator } from "../services/hydrator";
import { ExpressionEngine } from "../expressions/expression-engine";
import { finalizeLiteralOutput } from "../services/literal-syntax";
import { ActionTokenService } from "../security/action-token-service";
import type { ReplayGuard } from "../security/types";
import { AdapterRegistry } from "../runtime/adapter-registry";

interface PrepareResult {
  html: string;
  token: string;
  jti: string;
  meta: Record<string, string | number>;
  endpoint: string;
  payload: string;
}

interface ExecuteResult {
  html: string;
  mode: string;
  record: Record<string, unknown>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function replacePercentPlaceholders(
  template: string,
  values: Record<string, unknown>,
): string {
  let html = template;

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      html = html.replaceAll(`%%${key}%%`, escapeHtml(String(value)));
    }
  }

  return html;
}

export class SetContentExecutor {
  private readonly parser: DSLParser;
  private readonly registry: AdapterRegistry;
  private readonly hydrator: Hydrator;
  private readonly expressionEngine: ExpressionEngine;
  private readonly tokenService: ActionTokenService;
  private readonly replayGuard: ReplayGuard;

  constructor(
    parser: DSLParser,
    registry: AdapterRegistry,
    hydrator: Hydrator,
    expressionEngine: ExpressionEngine,
    tokenService: ActionTokenService,
    replayGuard: ReplayGuard,
  ) {
    this.parser = parser;
    this.registry = registry;
    this.hydrator = hydrator;
    this.expressionEngine = expressionEngine;
    this.tokenService = tokenService;
    this.replayGuard = replayGuard;
  }

  async prepare(
    dsl: string,
    sub: string,
    tenantId: number,
    existingData: Record<string, unknown> = {},
    finalizeOutput = true,
  ): Promise<PrepareResult> {
    const parsed = this.parser.parse(dsl);
    const meta = parsed.meta;
    const template = parsed.template;

    if (!template) {
      throw new Error("No template found in DSL");
    }

    const action = String(meta.action ?? "save");
    const recordId = String(meta.recordId ?? existingData.id ?? "") || null;
    const tokenResult = await this.tokenService.issue(sub, tenantId, action, recordId);
    const payload = JSON.stringify({
      "htx-token": tokenResult.token,
      "htx-context": action,
      "htx-recordId": recordId,
      type: String(meta.type ?? ""),
    });
    const endpoint = `/api/content/${action}`;

    let html = template.replaceAll("__endpoint__", endpoint);

    if (html.includes("<form") && !html.includes('name="htx-payload"')) {
      html = html.replace(
        /<form([^>]*)>/i,
        `<form$1>\n    <input type="hidden" name="htx-payload" value="__payload__" />`,
      );
    }

    html = html.replaceAll("__payload__", escapeHtml(payload));

    if (Object.keys(existingData).length > 0) {
      html = this.hydrator.hydrate(html, existingData);
    }

    if (this.expressionEngine.hasExpressions(html)) {
      html = this.expressionEngine.evaluate(html, {
        ...existingData,
        __endpoint__: endpoint,
        __payload__: payload,
      });
    }

    return {
      html: finalizeOutput ? finalizeLiteralOutput(html) : html,
      token: tokenResult.token,
      jti: tokenResult.jti,
      meta,
      endpoint,
      payload,
    };
  }

  async execute(
    token: string,
    tenantId: number,
    context: string,
    recordId: string | null,
    formData: Record<string, unknown>,
    responseTemplates: Record<string, string> = {},
  ): Promise<ExecuteResult> {
    const claims = await this.tokenService.validate(token, tenantId, context, recordId);
    const jti = claims.jti ?? "";

    if (this.replayGuard.isReplayed(jti)) {
      throw new Error("Token has already been used (replay detected).");
    }

    const expiresAt = new Date(((claims.exp ?? Math.floor(Date.now() / 1000) + 300) as number) * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    this.replayGuard.markUsed(jti, tenantId, expiresAt);

    const type = String(formData.type ?? claims["htx-context"] ?? "content");
    const normalizedData = this.normalizeFormData(formData);
    const adapter = this.registry.adapterForType(type);

    try {
      const record =
        context === "save" && !recordId
          ? await Promise.resolve(adapter.create(type, normalizedData))
          : await Promise.resolve(
              adapter.update(type, recordId ?? String(claims["htx-recordId"] ?? ""), normalizedData),
            );

      const mode = responseTemplates.redirect ? "redirect" : "success";
      return this.buildResponse(mode, responseTemplates, record);
    } catch (error) {
      return this.buildResponse("error", responseTemplates, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private buildResponse(
    mode: string,
    templates: Record<string, string>,
    values: ContentRow,
  ): ExecuteResult {
    const template =
      templates[mode] ??
      (mode === "error"
        ? '<div class="error">__error__</div>'
        : mode === "redirect"
          ? "/"
          : '<div class="success">Operation completed.</div>');

    const hydrated = this.hydrator.hydrate(template, values);
    const html = finalizeLiteralOutput(replacePercentPlaceholders(hydrated, values));

    return {
      html,
      mode,
      record: values,
    };
  }

  private normalizeFormData(formData: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...formData };
    delete normalized.type;
    delete normalized["htx-token"];
    delete normalized["htx-context"];
    delete normalized["htx-recordId"];
    delete normalized.responseTemplates;
    return normalized;
  }
}
