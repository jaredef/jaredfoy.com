import type { HtxRequest, HtxResponse, MaybePromise } from "../runtime/types";

export type NextMiddleware = (request: HtxRequest) => MaybePromise<HtxResponse>;

export interface Middleware {
  handle(request: HtxRequest, next: NextMiddleware): MaybePromise<HtxResponse>;
}
