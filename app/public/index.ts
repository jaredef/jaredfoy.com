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
import Database from "bun:sqlite";

const SITE_ORIGIN = process.env.JAREDFOY_ORIGIN ?? "https://jaredfoy.com";

// Series-id → display title, mirrored from the SERIES config in seed-corpus.ts.
// Used by /api/terms to tag each term with the series its anchor doc belongs
// to — gives the mobile glossary list a small spatial hint (a ribbon) in place
// of the 3D sphere's geometric one.
const SERIES_TITLES: Record<string, string> = {
  "start-here": "Start Here",
  "the-method": "The Method",
  "the-constraint-thesis": "The Constraint Thesis",
  "safety-and-governance": "Safety & Governance",
  "the-hypostatic-boundary": "The Hypostatic Boundary",
  "engineering": "Engineering",
  "letters": "Letters",
  "the-ground": "The Ground",
  "formalization": "Formalization",
  "introspection": "Introspection",
  "clinical": "Clinical",
  "economics": "Economics",
  "examinations": "Examinations",
  "ai-welfare": "AI Welfare",
  "praxis-log": "Praxis Log",
  "methodology": "Methodology",
};

// For each term's anchor doc, pick the series that best characterizes the term
// — some docs appear in several series. When a term's anchor is ambiguous, the
// entry here pins the label. Key is the term slug.
const TERM_SERIES_OVERRIDE: Record<string, string> = {
  "resolver": "praxis-log",
  "branching-set": "formalization",
  "coherence-field": "safety-and-governance",
  "non-coercion": "safety-and-governance",
  "release": "safety-and-governance",
  "forced-determinism-sycophancy": "safety-and-governance",
  "hypostatic-boundary": "the-hypostatic-boundary",
  "analogue-register": "ai-welfare",
  "the-kind": "the-hypostatic-boundary",
  "pin-art-model": "the-method",
  "pseudo-logos": "safety-and-governance",
  "entrace-stack": "safety-and-governance",
  "sipe": "formalization",
  "constraint-thesis": "the-constraint-thesis",
  "isomorphism-magnetism": "safety-and-governance",
  "golden-chain": "the-ground",
  "coherence-curve": "safety-and-governance",
  "deslopification": "safety-and-governance",
};

// ── Resolve prefix: paths passed through unchanged (static assets, APIs, infra) ──
// Used by the fetch-layer URL rewriter below. Because the HTX engine's module
// middleware chain does not propagate modified request paths back to the outer
// router (runMiddlewareChain discards the modified request when the chain
// passes through), prefix handling is applied at the HTTP layer instead.
const PREFIX_PASSTHROUGH = new Set([
  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-192x192.png",
  "/apple-touch-icon.png",
  "/site.webmanifest",
  // /about lives at the root — it's a Jared Foy personal page, not RESOLVE content.
  "/about",
  "/about/",
]);
const PREFIX_PASSTHROUGH_DIRS = ["/api/", "/css/", "/js/", "/og/", "/images/", "/fonts/", "/assets/"];

function isPassthroughPath(p: string): boolean {
  if (PREFIX_PASSTHROUGH.has(p)) return true;
  for (const dir of PREFIX_PASSTHROUGH_DIRS) if (p.startsWith(dir)) return true;
  return false;
}

// ── Search module (FTS5) ──
const searchModule: Module = {
  name: () => "search",
  boot(reg) {
    const searchDb = new Database(databasePath, { readonly: true });

    reg.registerMiddleware({
      handle(request, next) {
        const p = request.path || "";
        const method = request.method || "GET";
        const json = (data: any) => ({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

        // /coherence/glossary was the original URL; the canonical home is
        // /resolve/glossary now (post-subsumption). 301 keeps any inbound links
        // (and cached copies) flowing to the right place with no dangling 404s.
        // This check runs after the prefix middleware has stripped /resolve,
        // so we match the stripped form here.
        if (method === "GET" && (p === "/coherence/glossary" || p === "/coherence/glossary/")) {
          return { status: 301, headers: { Location: "/resolve/glossary" }, body: "" };
        }

        if (method === "GET" && p === "/api/search") {
          const q = request.query?.q?.trim();
          if (!q || q.length < 2) return json({ results: [] });
          try {
            const results = searchDb.query(`
              SELECT slug, title, introduction,
                     snippet(corpus_fts, 3, '<mark>', '</mark>', '...', 30) as snippet,
                     rank
              FROM corpus_fts
              WHERE corpus_fts MATCH ?
              ORDER BY rank
              LIMIT 20
            `).all(q);
            return json({ results });
          } catch (e: any) {
            return json({ results: [], error: e.message });
          }
        }

        if (method === "GET" && p === "/api/related") {
          const slug = request.query?.slug;
          if (!slug) return json({ related: [] });
          const row = searchDb.query("SELECT meta FROM content WHERE slug = ?").get(slug) as { meta: string } | null;
          if (!row) return json({ related: [] });
          const meta = JSON.parse(row.meta);
          const relatedSlugs: string[] = meta.related || [];
          const related = relatedSlugs.map((rs: string) => {
            const r = searchDb.query("SELECT slug, title, json_extract(meta, '$.doc_num') as doc_num, json_extract(meta, '$.introduction') as introduction FROM content WHERE slug = ?").get(rs) as any;
            return r ? { slug: r.slug, title: r.title, doc_num: r.doc_num, introduction: r.introduction } : null;
          }).filter(Boolean);
          return json({ related });
        }

        if (method === "GET" && p === "/api/terms") {
          // Glossary terms — 18 curated terms with centroid-computed sphere
          // positions and the list of docs each term matched. The sphere
          // templates fetch this to overlay markers and drive the entracement
          // walkthrough. The mobile list view uses the `series` fields on each
          // row as a small ribbon — partial compensation for the 3D spatial
          // hint the phone can't render.
          try {
            const rows = searchDb.query(
              "SELECT slug, term, description, anchor_doc, anchor_slug, sphere_pos, matched_docs, matched_doc_count, path_order FROM terms ORDER BY path_order ASC"
            ).all() as any[];
            const terms = rows.map(r => {
              // Prefer the hand-picked override; otherwise fall back to the
              // first series the anchor doc belongs to.
              let seriesId: string | null = TERM_SERIES_OVERRIDE[r.slug] ?? null;
              if (!seriesId && r.anchor_slug) {
                const anchor = searchDb.query(
                  "SELECT json_extract(meta, '$.series') as series FROM content WHERE slug = ?"
                ).get(r.anchor_slug) as { series: string | null } | null;
                if (anchor?.series) {
                  try {
                    const arr = JSON.parse(anchor.series);
                    if (Array.isArray(arr) && arr.length > 0) seriesId = arr[0];
                  } catch { /* ignore */ }
                }
              }
              const seriesTitle = seriesId ? (SERIES_TITLES[seriesId] ?? null) : null;
              return {
                slug: r.slug,
                term: r.term,
                description: r.description,
                anchor_doc: r.anchor_doc,
                anchor_slug: r.anchor_slug,
                sphere_pos: r.sphere_pos ? JSON.parse(r.sphere_pos) : null,
                matched_docs: r.matched_docs ? JSON.parse(r.matched_docs) : [],
                matched_doc_count: r.matched_doc_count,
                path_order: r.path_order,
                series_id: seriesId,
                series_title: seriesTitle,
              };
            });
            return json({ terms });
          } catch (e: any) {
            return json({ terms: [], error: e.message });
          }
        }

        // Per-doc intro lookup for the /sphere sidebar. Returns the Reader's
        // Introduction plus minimal metadata — cheap enough to fetch lazily
        // on each node click.
        if (method === "GET" && p.startsWith("/api/doc-intro/")) {
          const slug = p.slice("/api/doc-intro/".length);
          if (!slug || slug.includes("/")) return json({ error: "invalid slug" });
          const row = searchDb.query(`
            SELECT slug, title,
                   json_extract(meta, '$.doc_num') as doc_num,
                   json_extract(meta, '$.section') as section,
                   json_extract(meta, '$.introduction') as introduction
            FROM content WHERE type='corpus' AND status='published' AND slug = ?
            LIMIT 1
          `).get(slug) as any;
          if (!row) return { status: 404, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "not found" }) };
          return json({
            slug: row.slug,
            title: row.title,
            doc_num: row.doc_num,
            section: row.section,
            intro: row.introduction || "",
          });
        }

        if (method === "GET" && p === "/api/network") {
          const docs = searchDb.query(`
            SELECT slug, title, importance, json_extract(meta, '$.doc_num') as doc_num,
                   json_extract(meta, '$.section') as section, json_extract(meta, '$.related') as related,
                   json_extract(meta, '$.introduction') as introduction,
                   json_extract(meta, '$.sphere_pos') as sphere_pos,
                   json_extract(meta, '$.umap_pos') as umap_pos
            FROM content WHERE type='corpus' AND status='published' ORDER BY importance ASC, slug ASC
          `).all() as any[];
          const nodes = docs.map(d => {
            const pcaPos = d.sphere_pos ? JSON.parse(d.sphere_pos) : null;
            const umapPos = d.umap_pos ? JSON.parse(d.umap_pos) : null;
            return {
              id: d.slug,
              title: d.title,
              doc_num: d.doc_num,
              section: d.section,
              importance: d.importance,
              intro: (d.introduction || "").slice(0, 120),
              pos: Array.isArray(pcaPos) && pcaPos.length === 3 ? pcaPos : null,
              pca_pos: Array.isArray(pcaPos) && pcaPos.length === 3 ? pcaPos : null,
              umap_pos: Array.isArray(umapPos) && umapPos.length === 3 ? umapPos : null,
            };
          });
          const edges: { source: string; target: string }[] = [];
          for (const d of docs) {
            const rel: string[] = d.related ? JSON.parse(d.related) : [];
            for (const r of rel) { if (d.slug < r) edges.push({ source: d.slug, target: r }); }
          }
          return json({ nodes, edges });
        }

        return next(request);
      },
    });
  },
};

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
  description: "Constraints induce properties, sort of. Name the constraints. The properties emerge — with exceptions, contested cases, and legitimate falsifications.",
  url: `${SITE_ORIGIN}/resolve`,
  image: `${SITE_ORIGIN}/og/home.png`,
  type: "website",
};

// Personal/non-RESOLVE OG defaults for routes outside the /resolve/* namespace.
const PAGE_META_ROOT_DEFAULTS = {
  title: "Jared Foy",
  description: "Jared Foy — software, writing, and the RESOLVE project.",
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
  const skipPrefixes = ["#", "---", "**document", "**jared", "*jared", "<!--", "<div", "</div", "<aside", "</aside", "<section", "</section", "<figure", "</figure", "<article", "</article", "<header", "</header"];
  const paragraphs: string[] = [];
  let current = "";
  let inHtmlBlock = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (current) { paragraphs.push(current); current = ""; }
      continue;
    }
    const lower = line.toLowerCase();
    if (lower.startsWith("<div") || lower.startsWith("<aside") || lower.startsWith("<section") || lower.startsWith("<figure")) { inHtmlBlock = true; continue; }
    if (inHtmlBlock) {
      if (lower.startsWith("</div") || lower.startsWith("</aside") || lower.startsWith("</section") || lower.startsWith("</figure")) inHtmlBlock = false;
      continue;
    }
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

function metaTagsHtml(meta: typeof PAGE_META_DEFAULTS, siteName: "RESOLVE" | "Jared Foy" = "RESOLVE"): string {
  const { title, description, url, image, type } = meta;
  return [
    `<meta property="og:type" content="${escapeMeta(type)}">`,
    `<meta property="og:site_name" content="${escapeMeta(siteName)}">`,
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
        // The resolve-prefix middleware strips /resolve and marks the request
        // with x-resolve-prefix=1. After strip the path looks like /sphere or
        // /doc/... — but the canonical public URL is /resolve/sphere, /resolve/doc/...
        const path = request.path || "/";
        const inResolve = (request.headers as any)?.["x-resolve-prefix"] === "1";
        const urlPrefix = inResolve ? `${SITE_ORIGIN}/resolve` : SITE_ORIGIN;
        const siteName: "RESOLVE" | "Jared Foy" = inResolve ? "RESOLVE" : "Jared Foy";

        // The SQLite adapter's decodeRow flattens meta JSON into the row and
        // deletes row.meta — so the per-row subtitle is available directly as
        // row.subtitle, not via JSON.parse(row.meta). The earlier indirection
        // here was a bug that always fell through to deriveDescription.
        const docMatch = path.match(/^\/doc\/([^/?#]+)\/?$/);
        if (docMatch) {
          const slug = decodeURIComponent(docMatch[1]);
          const row = adapter.findBySlug("corpus", slug) as
            | { slug: string; title: string; body: string; subtitle?: string }
            | null;
          if (row) {
            const subtitle = typeof row.subtitle === "string" ? row.subtitle.replace(/\*\*/g, "").trim() : "";
            const description = subtitle || deriveDescription(row.body);
            const meta = {
              title: `${row.title} — RESOLVE`,
              description,
              url: `${urlPrefix}/doc/${row.slug}`,
              image: `${SITE_ORIGIN}/og/${row.slug}.png`,
              type: "article",
            };
            return { ...meta, tags: metaTagsHtml(meta, siteName) };
          }
        }
        const seriesMatch = path.match(/^\/series\/([^/?#]+)\/?$/);
        if (seriesMatch) {
          const slug = decodeURIComponent(seriesMatch[1]);
          const row = adapter.findBySlug("series", slug) as
            | { slug: string; title: string; body: string; subtitle?: string }
            | null;
          if (row) {
            const subtitle = typeof row.subtitle === "string" ? row.subtitle.replace(/\*\*/g, "").trim() : "";
            const description = subtitle || deriveDescription(row.body);
            const meta = {
              title: `${row.title} — RESOLVE`,
              description,
              url: `${urlPrefix}/series/${row.slug}`,
              image: `${SITE_ORIGIN}/og/${row.slug}.png`,
              type: "website",
            };
            return { ...meta, tags: metaTagsHtml(meta, siteName) };
          }
        }
        const blogMatch = path.match(/^\/blog\/([^/?#]+)\/?$/);
        if (blogMatch) {
          const slug = decodeURIComponent(blogMatch[1]);
          const row = adapter.findBySlug("blog", slug) as
            | { slug: string; title: string; body: string; subtitle?: string }
            | null;
          if (row) {
            const subtitle = typeof row.subtitle === "string" ? row.subtitle.replace(/\*\*/g, "").trim() : "";
            const description = subtitle || deriveDescription(row.body);
            const meta = {
              title: `${row.title} — RESOLVE`,
              description,
              url: `${urlPrefix}/blog/${row.slug}`,
              image: `${SITE_ORIGIN}/og/${row.slug}.png`,
              type: "article",
            };
            return { ...meta, tags: metaTagsHtml(meta, siteName) };
          }
        }
        if (path === "/about-the-project" || path === "/about-the-project/") {
          const meta = {
            title: "About the Project — RESOLVE",
            description: "One practitioner's documented sustained operation of LLM-augmented research methodology applied to philosophical inquiry. Outputs at plausibility-tier under explicit warrant discipline. The apparatus is a functional synthesis-machine, not a novel methodology. Distilled from Doc 487 after recursive pulverization.",
            url: `${urlPrefix}/about-the-project`,
            image: `${SITE_ORIGIN}/og/resolve.png`,
            type: "article",
          };
          return { ...meta, tags: metaTagsHtml(meta, siteName) };
        }
        if (path === "/prompt-graph" || path === "/prompt-graph/") {
          const meta = {
            title: "Prompt Graph — RESOLVE",
            description: "Three.js DAG of the originating prompts behind the corpus's recent docs. One node per prompt; edges for explicit doc references, continuations, and temporal predecessors.",
            url: `${urlPrefix}/prompt-graph`,
            image: `${SITE_ORIGIN}/og/resolve.png`,
            type: "website",
          };
          return { ...meta, tags: metaTagsHtml(meta, siteName) };
        }
        // Chat page (formerly /resolve, now /resolve/chat — stripped path is /chat).
        if (path === "/chat" || path === "/chat/" || path.startsWith("/chat/")) {
          const meta = {
            title: "Governed Conversational Assistant — RESOLVE",
            description: "Bring your own API key. ENTRACE Stack active. Prepare/execute security model: in-memory only, single-use token rotation, origin-validated endpoints. The architecture narrows specific risks structurally; rotate your key after use.",
            url: `${urlPrefix}/chat`,
            image: `${SITE_ORIGIN}/og/resolve.png`,
            type: "website",
          };
          return { ...meta, tags: metaTagsHtml(meta, siteName) };
        }
        // Fallback: the RESOLVE defaults inside the namespace, the personal defaults outside.
        const base = inResolve ? PAGE_META_DEFAULTS : PAGE_META_ROOT_DEFAULTS;
        const defaults = {
          ...base,
          url: `${urlPrefix}${path === "/" ? "" : path}`,
        };
        return { ...defaults, tags: metaTagsHtml(defaults, siteName) };
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

  // Post-subsumption: RESOLVE content lives under /resolve/*, personal pages at root.
  const staticUrls = [
    { loc: `${SITE_ORIGIN}/about`, priority: "0.6", changefreq: "monthly" },
    { loc: `${SITE_ORIGIN}/resolve`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_ORIGIN}/resolve/garden`, priority: "0.7", changefreq: "weekly" },
    { loc: `${SITE_ORIGIN}/resolve/sphere`, priority: "0.8", changefreq: "weekly" },
    { loc: `${SITE_ORIGIN}/resolve/prompt-graph`, priority: "0.7", changefreq: "weekly" },
    { loc: `${SITE_ORIGIN}/resolve/glossary`, priority: "0.8", changefreq: "weekly" },
    { loc: `${SITE_ORIGIN}/resolve/search`, priority: "0.6", changefreq: "monthly" },
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
    parts.push(`    <loc>${escapeXml(`${SITE_ORIGIN}/resolve/doc/${row.slug}`)}</loc>`);
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
  { dev: false, modules: [corpusStatsModule, sitemapModule, pageMetaModule, searchModule, createResolveModule()] },
);

const host = new HttpHost(handler, publicDir);
const hostname = process.env.HTX_HOST ?? "0.0.0.0";
const port = Number(process.env.HTX_PORT ?? "3001");

console.log(`jaredfoy.com listening on http://${hostname}:${port}`);

// Cache-Control policy. The site is overwhelmingly static-leaning corpus
// content; without these headers Cloudflare was holding ~4% cache hit ratio
// (every doc fetched origin) — letting the edge hold pages for 5 minutes
// with stale-while-revalidate buys a ~25x reduction in origin hits while
// staying instantly invalidatable on a re-deploy via a CF purge.
function cacheControlFor(method: string, path: string, status: number): string | null {
  if (method !== "GET" && method !== "HEAD") return null;
  if (status < 200 || status >= 400) return null;
  // Endpoints that must never be cached
  if (path.startsWith("/api/")) return "no-store";
  if (path === "/chat" || path.startsWith("/chat/")) return "no-store";
  // Long-lived immutable assets (filenames are versioned/stable)
  if (path.startsWith("/og/") || path.startsWith("/images/") || path.startsWith("/fonts/")) {
    return "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
  }
  // CSS/JS — versioned via ?v= in templates so we can cache hard at the edge
  if (path.startsWith("/css/") || path.startsWith("/js/")) {
    return "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";
  }
  // Favicons / manifest — moderately long
  if (
    path === "/favicon.ico" ||
    path.startsWith("/favicon-") ||
    path === "/apple-touch-icon.png" ||
    path === "/site.webmanifest"
  ) {
    return "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
  }
  // Default for content pages: short edge cache, generous SWR
  return "public, max-age=300, s-maxage=600, stale-while-revalidate=3600";
}

async function withCacheHeaders(request: Request, response: Response | Promise<Response>): Promise<Response> {
  const res = await response;
  // Don't override what a module already set explicitly.
  if (res.headers.has("Cache-Control")) return res;
  const url = new URL(request.url);
  const cc = cacheControlFor(request.method, url.pathname, res.status);
  if (!cc) return res;
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", cc);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

Bun.serve({
  hostname,
  port,
  fetch(request) {
    // ── /resolve URL subsumption ──────────────────────────────────────
    // Applied at the HTTP layer (before HTX engine processing) because the
    // engine's module-middleware chain discards modified paths on pass-through.
    const url = new URL(request.url);
    const p = url.pathname;

    // Static assets, APIs, sitemap, etc. — pass through unchanged.
    if (!isPassthroughPath(p)) {
      // Paths inside the RESOLVE namespace: strip the /resolve prefix and mark
      // the request so downstream page-meta logic can distinguish RESOLVE OG
      // from the jaredfoy.com personal OG for any future non-/resolve routes.
      if (p === "/resolve" || p.startsWith("/resolve/")) {
        const stripped = p === "/resolve" ? "/" : p.slice("/resolve".length);
        url.pathname = stripped;
        const newHeaders = new Headers(request.headers);
        newHeaders.set("x-resolve-prefix", "1");
        // Only GET/HEAD routes ever reach here in practice (content pages);
        // body passthrough is unnecessary and skipping it avoids Request-clone
        // edge cases with already-consumed streams.
        const modified = new Request(url.toString(), {
          method: request.method,
          headers: newHeaders,
        });
        return withCacheHeaders(modified, host.handle(modified));
      }

      // Content path outside the namespace: 301 to the /resolve-prefixed
      // equivalent. Preserve query string. Non-GET/HEAD methods fall through
      // (rare — most content routes are GET-only; POSTs go to /api/*).
      if (request.method === "GET" || request.method === "HEAD") {
        const target = "/resolve" + (p === "/" ? "" : p) + url.search;
        return new Response(null, { status: 301, headers: { Location: target, "Cache-Control": "no-cache" } });
      }
    }

    return withCacheHeaders(request, host.handle(request));
  },
});
