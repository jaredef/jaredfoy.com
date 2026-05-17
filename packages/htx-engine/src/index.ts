export const enginePackageName = "@htx/engine";

export { Evaluator } from "./expressions/evaluator";
export { ExpressionEngine } from "./expressions/expression-engine";
export { ExpressionLimitError, ExpressionParseError } from "./expressions/errors";
export { FunctionRegistry } from "./expressions/function-registry";
export { registerArrayFunctions } from "./expressions/functions/array-functions";
export { registerDateFunctions } from "./expressions/functions/date-functions";
export { registerNumberFunctions } from "./expressions/functions/number-functions";
export { registerStringFunctions } from "./expressions/functions/string-functions";
export { Lexer } from "./expressions/lexer";
export { Parser } from "./expressions/parser";
export { DSLParser } from "./parser/dsl-parser";
export { MetaExtractor } from "./parser/meta-extractor";
export { NestTreeBuilder } from "./parser/nest-tree-builder";
export { ResponseExtractor } from "./parser/response-extractor";
export { TemplateExtractor } from "./parser/template-extractor";
export { DeleteContentExecutor } from "./executors/delete-content-executor";
export { GetContentExecutor } from "./executors/get-content-executor";
export { SetContentExecutor } from "./executors/set-content-executor";
export { HttpHost } from "./runtime/http-host";
export type { RegisteredAdapter, ResolvedAdapter } from "./runtime/adapter-registry";
export { AdapterRegistry } from "./runtime/adapter-registry";
export {
  HtxDiagnosticError,
  escapeHtml,
  formatDiagnosticLog,
  renderDiagnosticPage,
  renderInlineDiagnostic,
  toDiagnosticError,
} from "./runtime/diagnostics";
export { RequestHandler } from "./runtime/request-handler";
export { Router } from "./runtime/router";
export { TemplateResolver } from "./runtime/template-resolver";
export { BaseContextProvider } from "./runtime/base-context-provider";
export { ComponentResolver } from "./runtime/component-resolver";
export { IncludeResolver } from "./runtime/include-resolver";
export { LayoutResolver } from "./runtime/layout-resolver";
export { LetResolver } from "./runtime/let-resolver";
export { EngineModuleRegistry } from "./runtime/engine-module-registry";
export type { PropDeclaration } from "./runtime/props-parser";
export { PropsParser } from "./runtime/props-parser";
export { Response } from "./runtime/response";
export { Hydrator } from "./services/hydrator";
export { ActionTokenService } from "./security/action-token-service";
export { InMemoryReplayGuard } from "./security/in-memory-replay-guard";
export type {
  AstNode,
  BinaryOpNode,
  BooleanLiteralNode,
  DotAccessNode,
  EachNode,
  ExpressionNode,
  FieldRefNode,
  FunctionCallNode,
  IfNode,
  NullLiteralNode,
  NumberLiteralNode,
  OutputNode,
  RawOutputNode,
  StringLiteralNode,
  TemplateChildNode,
  TemplateNode,
  TernaryOpNode,
  TextNode,
  UnaryOpNode,
} from "./expressions/ast";
export type { Segment, Token } from "./expressions/token";
export type {
  ContentAdapter,
  ContentId,
  ContentRow,
  ContentSchema,
  ContentSchemaField,
  QueryMeta,
  QueryResult,
} from "./contracts/content-adapter";
export type { AuthProvider } from "./contracts/auth-provider";
export type { Middleware, NextMiddleware } from "./contracts/middleware";
export type { Module } from "./contracts/module";
export type { ContextProvider, ModuleRegistry } from "./contracts/module-registry";
export type { MutationActionHandler, MutationResult } from "./contracts/mutation-action-handler";
export type { ProcessResult, TemplateProcessor } from "./contracts/template-processor";
export type {
  ParsedBlock,
  ParsedNestBlock,
  ParsedResponseBlock,
  ParsedTemplate,
} from "./parser/types";
export type { IssuedActionToken } from "./security/action-token-service";
export type { ReplayGuard } from "./security/replay-guard";
export type { ActionTokenClaims } from "./security/types";
export type { ModuleBootError } from "./runtime/engine-module-registry";
export type {
  ExecutionContext,
  HtxBody,
  HtxHeaders,
  HtxParams,
  HtxQuery,
  HtxRequest,
  HtxResponse,
  MaybePromise,
  RouteMatch,
  TemplateDirectoryResolver,
  TemplateRoot,
} from "./runtime/types";
