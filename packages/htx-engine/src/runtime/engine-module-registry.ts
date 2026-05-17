import type { ContentAdapter } from "../contracts/content-adapter";
import type { Middleware } from "../contracts/middleware";
import type { Module } from "../contracts/module";
import type { ContextProvider, ModuleRegistry } from "../contracts/module-registry";
import type { MutationActionHandler } from "../contracts/mutation-action-handler";
import type { TemplateProcessor } from "../contracts/template-processor";

export interface ModuleBootError {
  module: string;
  error: Error;
}

export class EngineModuleRegistry implements ModuleRegistry {
  readonly functions = new Map<string, (...args: unknown[]) => unknown>();
  readonly middleware: Middleware[] = [];
  readonly adapters = new Map<string, ContentAdapter>();
  readonly contextProviders = new Map<string, ContextProvider>();
  readonly templateProcessors: TemplateProcessor[] = [];
  readonly mutationHandlers: MutationActionHandler[] = [];
  readonly bootErrors: ModuleBootError[] = [];

  registerFunction(name: string, handler: (...args: unknown[]) => unknown): void {
    if (this.functions.has(name)) {
      console.warn(`[HTX] Module warning: function "${name}" is being overwritten by another module`);
    }
    this.functions.set(name, handler);
  }

  registerMiddleware(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  registerAdapter(name: string, adapter: ContentAdapter): void {
    if (this.adapters.has(name)) {
      console.warn(`[HTX] Module warning: adapter "${name}" is being overwritten by another module`);
    }
    this.adapters.set(name, adapter);
  }

  registerContextProvider(name: string, provider: ContextProvider): void {
    if (this.contextProviders.has(name)) {
      console.warn(`[HTX] Module warning: context provider "${name}" is being overwritten by another module`);
    }
    this.contextProviders.set(name, provider);
  }

  registerTemplateProcessor(processor: TemplateProcessor): void {
    this.templateProcessors.push(processor);
  }

  registerMutationHandler(handler: MutationActionHandler): void {
    this.mutationHandlers.push(handler);
  }

  bootAll(modules: Module[]): void {
    for (const mod of modules) {
      try {
        mod.boot(this);
        console.log(`[HTX] Module booted: ${mod.name()}`);
      } catch (error) {
        const resolved = error instanceof Error ? error : new Error(String(error));
        this.bootErrors.push({ module: mod.name(), error: resolved });
        console.error(`[HTX] Module boot failed: ${mod.name()} - ${resolved.message}`);
      }
    }

    if (this.bootErrors.length > 0) {
      console.warn(`[HTX] ${this.bootErrors.length} module(s) failed to boot. App may be degraded.`);
    }
  }
}
