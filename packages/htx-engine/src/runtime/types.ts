export type HtxHeaders = Record<string, string>;

export type HtxParams = Record<string, string>;

export type HtxBody = Record<string, unknown>;

export type HtxQuery = Record<string, string>;

export type MaybePromise<T> = T | Promise<T>;

export interface HtxRequest {
  method: string;
  path: string;
  headers: HtxHeaders;
  body: HtxBody;
  query: HtxQuery;
  cookies?: Record<string, string>;
  params?: HtxParams;
  raw?: Request;
}

export interface HtxResponse {
  status: number;
  body: string;
  headers: HtxHeaders;
  cookies?: string[];
}

export interface TemplateDirectoryResolver {
  getDirs(): string[];
}

export type TemplateRoot = string | TemplateDirectoryResolver;

export interface RouteMatch {
  filePath: string;
  params: HtxParams;
  siteRoot: string;
}

export interface ExecutionContext {
  method: string;
  path: string;
  headers: HtxHeaders;
  body: HtxBody;
  query: HtxQuery;
  routeParams: HtxParams;
  currentPath: string;
  tenantId?: number;
}
