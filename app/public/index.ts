import path from "node:path";

import {
  AdapterRegistry,
  ComponentResolver,
  DSLParser,
  ExpressionEngine,
  GetContentExecutor,
  HttpHost,
  Hydrator,
  IncludeResolver,
  LayoutResolver,
  LetResolver,
  RequestHandler,
  Router,
} from "@htx/engine";
import { SQLiteAdapter } from "@htx/adapter-sqlite";

const templatesDir = path.resolve(import.meta.dir, "../templates");
const publicDir = path.resolve(import.meta.dir, "./");
const databasePath = path.resolve(import.meta.dir, "../data/corpus.sqlite");

const adapter = new SQLiteAdapter(databasePath);
const expressionEngine = new ExpressionEngine();
const hydrator = new Hydrator();
const parser = new DSLParser();
const router = new Router();
const layoutResolver = new LayoutResolver();
const includeResolver = new IncludeResolver();
const letResolver = new LetResolver(expressionEngine);
const componentResolver = new ComponentResolver(templatesDir, expressionEngine, includeResolver);
const registry = new AdapterRegistry({ default: adapter });

const getExecutor = new GetContentExecutor(parser, registry, hydrator, expressionEngine, { dev: false });

const handler = new RequestHandler(
  router,
  parser,
  expressionEngine,
  hydrator,
  registry,
  layoutResolver,
  includeResolver,
  letResolver,
  componentResolver,
  getExecutor,
  templatesDir,
  undefined, // no set executor (read-only site)
  undefined, // no delete executor
  { dev: false },
);

const host = new HttpHost(handler, publicDir);
const hostname = process.env.HTX_HOST ?? "0.0.0.0";
const port = Number(process.env.HTX_PORT ?? "3001");

console.log(`jaredfoy.com listening on http://${hostname}:${port}`);

Bun.serve({
  hostname,
  port,
  fetch(request) {
    return host.handle(request);
  },
});
