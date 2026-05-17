import type { HtxBody, MaybePromise } from "../runtime/types";

export interface MutationResult {
  html: string;
  redirect?: string;
  cookies?: string[];
}

export interface MutationActionHandler {
  actions(): string[];
  prepare(
    action: string,
    meta: Record<string, unknown>,
    template: string,
    sub: string,
  ): MaybePromise<MutationResult>;
  execute(
    action: string,
    body: HtxBody,
    responseTemplates: Record<string, string>,
  ): MaybePromise<MutationResult>;
}
