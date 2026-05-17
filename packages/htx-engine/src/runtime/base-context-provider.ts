import type { HtxRequest, MaybePromise } from "./types";
import type { ContextProvider } from "../contracts/module-registry";

type RouteHandler = (
  params: Record<string, string>,
  request: HtxRequest,
) => MaybePromise<Record<string, unknown>>;

export type ProviderRouteMap = Record<string, RouteHandler>;

export abstract class BaseContextProvider implements ContextProvider {
  abstract routes(): ProviderRouteMap;

  async resolve(request: HtxRequest): Promise<Record<string, unknown>> {
    for (const [pattern, handler] of Object.entries(this.routes())) {
      const params = this.match(pattern, request.path);
      if (!params) {
        continue;
      }

      try {
        return await Promise.resolve(handler(params, request));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[HTX] Context provider route "${pattern}" failed: ${message}`);
        return {};
      }
    }

    return {};
  }

  private match(pattern: string, path: string): Record<string, string> | null {
    const patternSegments = this.normalize(pattern);
    const pathSegments = this.normalize(path);

    if (patternSegments.length !== pathSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};
    for (let index = 0; index < patternSegments.length; index += 1) {
      const patternSegment = patternSegments[index];
      const pathSegment = pathSegments[index];

      if (patternSegment.startsWith(":")) {
        params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
        continue;
      }

      if (patternSegment !== pathSegment) {
        return null;
      }
    }

    return params;
  }

  private normalize(value: string): string[] {
    const trimmed = value.replace(/^\/+|\/+$/g, "");
    return trimmed === "" ? [] : trimmed.split("/");
  }
}
