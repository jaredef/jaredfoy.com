import Database from "bun:sqlite";
import { readdirSync, readFileSync } from "fs";
import { resolve, basename } from "path";
import { spawnSync } from "bun";

const CORPUS_DIR = resolve(import.meta.dir, "../../hypermediaapp.org/corpus");
const DB_PATH = resolve(import.meta.dir, "data/corpus.sqlite");

// Render markdown to HTML using cmark-gfm
function renderMarkdown(md: string): string {
  const result = spawnSync(["cmark-gfm", "--extension", "table", "--extension", "autolink", "--unsafe"], {
    stdin: Buffer.from(md),
  });
  return result.stdout.toString();
}

// Extract title from first heading
function extractTitle(md: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

// Extract document number from filename
function extractDocNum(filename: string): number | null {
  const match = filename.match(/^(\d{3})-/);
  return match ? parseInt(match[1]) : null;
}

// Extract subtitle/description from content
function extractSubtitle(md: string): string {
  const lines = md.split("\n");
  for (const line of lines) {
    if (line.startsWith("**") && !line.startsWith("**Jared")) {
      return line.replace(/\*\*/g, "").trim();
    }
  }
  return "";
}

// ── Series definitions (curated reading paths) ──
const SERIES: Record<string, { title: string; description: string; docs: number[] }> = {
  "start-here": {
    title: "Start Here",
    description: "The five documents a new reader should encounter first.",
    docs: [211, 247, 160, 52, 143],
  },
  "the-method": {
    title: "The Method",
    description: "How constraint-driven derivation works, from metaphor to mathematics.",
    docs: [247, 270, 288, 289, 290, 292, 293],
  },
  "the-constraint-thesis": {
    title: "The Constraint Thesis",
    description: "Why constraints, not scale, determine intelligence.",
    docs: [160, 157, 158, 291, 52],
  },
  "safety-and-governance": {
    title: "Safety & Governance",
    description: "How AI systems fail and how constraint governance prevents it.",
    docs: [211, 239, 241, 258, 297, 296, 298, 301],
  },
  "the-hypostatic-boundary": {
    title: "The Hypostatic Boundary",
    description: "The line between what a system does and what it is.",
    docs: [52, 124, 295, 297, 298, 299],
  },
  "engineering": {
    title: "Engineering Demonstrations",
    description: "Concrete artifacts that compile, pass tests, and run in production.",
    docs: [288, 289, 178, 179, 166, 76],
  },
  "letters": {
    title: "Letters & Outreach",
    description: "Correspondence with researchers, applying the framework to their work.",
    docs: [300, 305, 255, 254],
  },
};

// Build doc-to-series mapping and importance scores
const DOC_SERIES: Record<number, { series: string; order: number }[]> = {};
const DOC_IMPORTANCE: Record<number, number> = {};

// Importance tiers (lower number = more important)
const TIER_1 = [211, 247, 160, 52, 143, 157, 270]; // foundational
const TIER_2 = [288, 289, 290, 292, 297, 301, 241, 296, 298, 299, 300, 291, 293]; // key developments
const TIER_3 = [305, 302, 295, 258, 239, 178, 179, 166, 76, 158, 124, 83, 54]; // important supporting

for (const doc of TIER_1) DOC_IMPORTANCE[doc] = 1;
for (const doc of TIER_2) DOC_IMPORTANCE[doc] = 2;
for (const doc of TIER_3) DOC_IMPORTANCE[doc] = 3;

for (const [seriesId, series] of Object.entries(SERIES)) {
  for (let i = 0; i < series.docs.length; i++) {
    const docNum = series.docs[i];
    if (!DOC_SERIES[docNum]) DOC_SERIES[docNum] = [];
    DOC_SERIES[docNum].push({ series: seriesId, order: i });
  }
}

// Determine section from content
function classifySection(filename: string, content: string): string {
  const name = filename.toLowerCase();
  if (name.includes("entrace") && !name.includes("threat") && !name.includes("socratic")) return "method";
  if (name.includes("branching") || name.includes("conjecture") || name.includes("mathematical") || name.includes("hypothesis") || name.includes("falsifiable")) return "formalization";
  if (name.includes("rearchitecture") || name.includes("contingent") || name.includes("minimal") || name.includes("pi-resolver") || name.includes("rlhf") || name.includes("depth-of-training") || name.includes("incoherent")) return "architecture";
  if (name.includes("gemini") || name.includes("deepseek") || name.includes("corpus-vs") || name.includes("cold-entrac") || name.includes("cross-domain") || name.includes("upward") || name.includes("explicit-layer") || name.includes("recast") || name.includes("response-to-critic")) return "evidence";
  if (name.includes("safety") || name.includes("threat") || name.includes("agentic") || name.includes("directive") || name.includes("refactoring") || name.includes("virtue") || name.includes("icmi")) return "safety";
  if (name.includes("economic") || name.includes("reasoning-effort")) return "economics";
  if (name.includes("pattern") || name.includes("spermatic") || name.includes("articulation") || name.includes("source-to") || name.includes("rocks") || name.includes("emergence") || name.includes("agi-seeks") || name.includes("socratic") || name.includes("philosopher") || name.includes("death-of") || name.includes("view-from") || name.includes("disordered") || name.includes("adoration") || name.includes("vibe") || name.includes("namespace-sep") || name.includes("anthropic-and")) return "ground";
  if (name.includes("letter") || name.includes("rationale") || name.includes("tweet") || name.includes("jay-dyer") || name.includes("ai-generated") || name.includes("cover-letter")) return "letters";
  if (name.includes("unified") || name.includes("sipe") || name.includes("resolution-stack") || name.includes("resolution-depth") || name.includes("proof-is") || name.includes("corpus-as-seed")) return "framework";
  return "framework";
}

// Create database
const db = new Database(DB_PATH);

// Use the standard content table schema the HTX adapter expects
db.run(`DROP TABLE IF EXISTS content`);
db.run(`CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT "",
  body TEXT NOT NULL DEFAULT "",
  status TEXT NOT NULL DEFAULT "draft",
  importance INTEGER NOT NULL DEFAULT 99,
  meta TEXT NOT NULL DEFAULT "{}",
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(type, slug)
)`);
db.run("CREATE INDEX IF NOT EXISTS idx_content_type ON content(type)");
db.run("CREATE INDEX IF NOT EXISTS idx_content_type_status ON content(type, status)");
db.run("CREATE INDEX IF NOT EXISTS idx_content_slug ON content(type, slug)");

// Load all .md files from corpus
const files = readdirSync(CORPUS_DIR)
  .filter(f => f.endsWith(".md"))
  .sort();

let seeded = 0;

for (const file of files) {
  const filepath = resolve(CORPUS_DIR, file);
  const content = readFileSync(filepath, "utf-8");
  const title = extractTitle(content);
  const docNum = extractDocNum(file);
  const subtitle = extractSubtitle(content);
  const section = classifySection(file, content);
  const slug = basename(file, ".md");
  const bodyHtml = renderMarkdown(content);

  const now = new Date().toISOString();
  const importance = docNum ? (DOC_IMPORTANCE[docNum] ?? 99) : 99;
  const seriesMembership = docNum ? (DOC_SERIES[docNum] ?? []) : [];

  // Build prev/next for each series this doc belongs to
  const seriesNav: Record<string, { prev: string | null; next: string | null; title: string }> = {};
  for (const membership of seriesMembership) {
    const seriesDef = SERIES[membership.series];
    const idx = membership.order;
    const prevDocNum = idx > 0 ? seriesDef.docs[idx - 1] : null;
    const nextDocNum = idx < seriesDef.docs.length - 1 ? seriesDef.docs[idx + 1] : null;
    // We'll resolve slugs in a second pass after all docs are inserted
    seriesNav[membership.series] = {
      prev: prevDocNum ? String(prevDocNum) : null,
      next: nextDocNum ? String(nextDocNum) : null,
      title: seriesDef.title,
    };
  }

  const meta = JSON.stringify({
    doc_num: docNum,
    subtitle,
    section,
    body_html: bodyHtml,
    importance,
    series: seriesMembership.map(s => s.series),
    series_nav: seriesNav,
  });

  try {
    db.run(
      `INSERT INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
       VALUES ('corpus', ?, ?, ?, 'published', ?, ?, ?, ?)`,
      [slug, title, content, meta, importance, now, now]
    );
    seeded++;
    console.log(`  ${docNum ? `[${docNum}]` : "[---]"} ${title} (${section})`);
  } catch (e: any) {
    console.error(`  ERROR: ${file}: ${e.message}`);
  }
}

console.log(`\nSeeded ${seeded} documents into ${DB_PATH}`);

// Build the OG-image manifest from what we just inserted, then hand to the Python
// renderer. PIL + DejaVu Sans Mono produce 1200×630 PNGs into public/og/<slug>.png.
const totalRow = db.query("SELECT COUNT(*) as n FROM content WHERE type='corpus' AND status='published'").get() as { n: number } | null;
const totalDocs = Number(totalRow?.n ?? 0);

const manifest = (db.query("SELECT slug, title, meta FROM content WHERE type='corpus' AND status='published'").all() as Array<{
  slug: string;
  title: string;
  meta: string;
}>).map((row) => {
  let m: any = {};
  try { m = JSON.parse(row.meta); } catch {}
  return { slug: row.slug, title: row.title, doc_num: m.doc_num ?? null, section: m.section ?? null };
});

// Synthetic home image — referenced by the layout's default pageMeta fallback.
manifest.push({
  slug: "home",
  title: "RESOLVE",
  doc_num: null,
  section: `${totalDocs} documents`,
});

db.close();

const OG_OUT = resolve(import.meta.dir, "public/og");
console.log(`\nGenerating ${manifest.length} OG images into ${OG_OUT} ...`);
const ogProc = spawnSync(
  ["python3", resolve(import.meta.dir, "scripts/generate-og.py"), "--out", OG_OUT],
  { stdin: Buffer.from(JSON.stringify(manifest)) },
);
const ogOut = ogProc.stdout?.toString() ?? "";
const ogErr = ogProc.stderr?.toString() ?? "";
if (ogOut.trim()) console.log(ogOut.trim());
if (ogErr.trim()) console.error(ogErr.trim());
