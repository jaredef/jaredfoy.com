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
  type Module,
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

import { createResolveModule } from "./resolve-module";

const SITE_ORIGIN = process.env.JAREDFOY_ORIGIN ?? "https://jaredfoy.com";

const corpusStatsModule: Module = {
  name: () => "corpus-stats",
  boot(reg) {
    reg.registerContextProvider("corpus", {
      resolve: () => {
        const result = adapter.query({ type: "corpus", howmany: 1 });
        return { total: result.total };
      },
    });
  },
};

const PAGE_META_DEFAULTS = {
  title: "RESOLVE — Jared Foy",
  description: "Constraints induce properties. Name the constraints. The properties emerge.",
  url: SITE_ORIGIN,
  image: `${SITE_ORIGIN}/og/home.png`,
  type: "website",
};

function escapeMeta(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Strip markdown-ish syntax to derive a plaintext description from the body.
function deriveDescription(body: string, max = 200): string {
  // Skip H1, blank lines, and the typical "**subtitle**" line; take the first paragraph.
  const lines = body.split("\n");
  const skipPrefixes = ["#", "---", "**document", "**jared", "*jared", "<!--"];
  const paragraphs: string[] = [];
  let current = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (current) { paragraphs.push(current); current = ""; }
      continue;
    }
    const lower = line.toLowerCase();
    if (skipPrefixes.some((p) => lower.startsWith(p))) continue;
    current = current ? current + " " + line : line;
    if (current.length > max + 100 && paragraphs.length === 0) break;
  }
  if (current && paragraphs.length === 0) paragraphs.push(current);
  let text = paragraphs[0] ?? "";
  // Remove markdown formatting marks.
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > max) text = text.slice(0, max - 1).trimEnd() + "…";
  return text;
}

function metaTagsHtml(meta: typeof PAGE_META_DEFAULTS): string {
  const { title, description, url, image, type } = meta;
  return [
    `<meta property="og:type" content="${escapeMeta(type)}">`,
    `<meta property="og:site_name" content="RESOLVE">`,
    `<meta property="og:title" content="${escapeMeta(title)}">`,
    `<meta property="og:description" content="${escapeMeta(description)}">`,
    `<meta property="og:url" content="${escapeMeta(url)}">`,
    `<meta property="og:image" content="${escapeMeta(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeMeta(title)}">`,
    `<meta name="twitter:description" content="${escapeMeta(description)}">`,
    `<meta name="twitter:image" content="${escapeMeta(image)}">`,
    `<meta name="description" content="${escapeMeta(description)}">`,
  ].join("\n  ");
}

const pageMetaModule: Module = {
  name: () => "page-meta",
  boot(reg) {
    reg.registerContextProvider("pageMeta", {
      resolve: (request) => {
        const path = request.path || "/";
        const docMatch = path.match(/^\/doc\/([^/?#]+)\/?$/);
        if (docMatch) {
          const slug = decodeURIComponent(docMatch[1]);
          const row = adapter.findBySlug("corpus", slug) as
            | { slug: string; title: string; body: string; meta: string }
            | null;
          if (row) {
            let m: any = {};
            try { m = JSON.parse(row.meta); } catch {}
            const subtitle = typeof m?.subtitle === "string" ? m.subtitle.replace(/\*\*/g, "").trim() : "";
            const description = subtitle || deriveDescription(row.body);
            const meta = {
              title: `${row.title} — RESOLVE`,
              description,
              url: `${SITE_ORIGIN}/doc/${row.slug}`,
              image: `${SITE_ORIGIN}/og/${row.slug}.png`,
              type: "article",
            };
            return { ...meta, tags: metaTagsHtml(meta) };
          }
        }
        // /resolve page meta
        if (path.startsWith("/resolve")) {
          const meta = {
            title: "Governed Conversational Assistant — RESOLVE",
            description: "Bring your own API key. ENTRACE Stack active. Prepare/execute security. In-memory only. The architecture makes insecurity structurally impossible.",
            url: `${SITE_ORIGIN}/resolve`,
            image: `${SITE_ORIGIN}/og/resolve.png`,
            type: "website",
          };
          return { ...meta, tags: metaTagsHtml(meta) };
        }
        // Fallback: site-wide defaults.
        const defaults = {
          ...PAGE_META_DEFAULTS,
          url: `${SITE_ORIGIN}${path === "/" ? "" : path}`,
        };
        return { ...defaults, tags: metaTagsHtml(defaults) };
      },
    });
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemap(): string {
  const rows = adapter.query({
    type: "corpus",
    howmany: 10000,
    order: "updated_at DESC",
    fields: "slug,updated_at,created_at",
  }).rows as Array<{ slug: string; updated_at?: string; created_at?: string }>;

  const staticUrls = [
    { loc: `${SITE_ORIGIN}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_ORIGIN}/about`, priority: "0.6", changefreq: "monthly" },
    { loc: `${SITE_ORIGIN}/garden`, priority: "0.7", changefreq: "weekly" },
  ];

  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const url of staticUrls) {
    parts.push("  <url>");
    parts.push(`    <loc>${escapeXml(url.loc)}</loc>`);
    parts.push(`    <changefreq>${url.changefreq}</changefreq>`);
    parts.push(`    <priority>${url.priority}</priority>`);
    parts.push("  </url>");
  }

  for (const row of rows) {
    if (!row.slug) continue;
    const lastmod = row.updated_at ?? row.created_at;
    parts.push("  <url>");
    parts.push(`    <loc>${escapeXml(`${SITE_ORIGIN}/doc/${row.slug}`)}</loc>`);
    if (lastmod) {
      parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
    }
    parts.push("    <changefreq>monthly</changefreq>");
    parts.push("    <priority>0.8</priority>");
    parts.push("  </url>");
  }

  parts.push("</urlset>");
  return parts.join("\n");
}

const sitemapModule: Module = {
  name: () => "sitemap",
  boot(reg) {
    reg.registerMiddleware({
      handle(request, next) {
        if (request.method === "GET" && request.path === "/sitemap.xml") {
          return {
            status: 200,
            body: buildSitemap(),
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          };
        }
        return next(request);
      },
    });
  },
};

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
  { dev: false, modules: [corpusStatsModule, sitemapModule, pageMetaModule, createResolveModule()] },
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
