import type { ContentAdapter } from "./content-adapter";
import type { Middleware } from "./middleware";
import type { MutationActionHandler } from "./mutation-action-handler";
import type { TemplateProcessor } from "./template-processor";
import type { HtxRequest, MaybePromise } from "../runtime/types";

export interface ContextProvider {
  resolve(request: HtxRequest): MaybePromise<Record<string, unknown>>;
}

export interface ModuleRegistry {
  registerFunction(name: string, handler: (...args: unknown[]) => unknown): void;
  registerMiddleware(middleware: Middleware): void;
  registerAdapter(name: string, adapter: ContentAdapter): void;
  registerContextProvider(name: string, provider: ContextProvider): void;
  registerTemplateProcessor(processor: TemplateProcessor): void;
  registerMutationHandler(handler: MutationActionHandler): void;
}
