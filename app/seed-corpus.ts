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
const SERIES: Record<string, { title: string; description: string; featured: number[]; docs: number[] }> = {
  "start-here": {
    title: "Start Here",
    description: "The five most essential entry points to the RESOLVE corpus.",
    featured: [211, 247, 160, 52, 143],
    docs: [211, 247, 160, 52, 143],
  },
  "the-method": {
    title: "The Method",
    description: "How constraint-driven derivation works, from metaphor to mathematics.",
    featured: [247, 270, 290, 292, 288],
    docs: [51, 77, 109, 247, 252, 270, 272, 273, 274, 288, 289, 290, 292, 293, 306],
  },
  "the-constraint-thesis": {
    title: "The Constraint Thesis",
    description: "Why constraints, not scale, determine intelligence.",
    featured: [160, 157, 291, 174, 280],
    docs: [53, 61, 70, 72, 73, 81, 89, 96, 97, 99, 104, 105, 106, 137, 145, 155, 156, 157, 158, 159, 160, 169, 174, 175, 189, 197, 258, 269, 274, 278, 280, 291, 302],
  },
  "safety-and-governance": {
    title: "Safety & Governance",
    description: "How AI systems fail and how constraint governance prevents it.",
    featured: [211, 297, 239, 241, 296, 301, 298],
    docs: [53, 55, 56, 57, 58, 67, 72, 84, 85, 86, 96, 101, 108, 119, 122, 127, 129, 162, 167, 195, 199, 205, 208, 209, 211, 238, 239, 241, 259, 260, 268, 276, 295, 296, 297, 298, 301, 304],
  },
  "the-hypostatic-boundary": {
    title: "The Hypostatic Boundary",
    description: "The line between what a system does and what it is.",
    featured: [52, 299, 124, 295, 298, 267],
    docs: [52, 62, 65, 66, 69, 82, 87, 91, 92, 93, 103, 117, 124, 125, 130, 131, 135, 136, 139, 150, 151, 152, 153, 154, 210, 214, 216, 218, 220, 222, 224, 225, 227, 229, 231, 232, 234, 240, 241, 243, 254, 256, 257, 267, 269, 279, 281, 295, 298, 299],
  },
  "engineering": {
    title: "Engineering",
    description: "Concrete artifacts that compile, pass tests, and run in production.",
    featured: [288, 289, 178, 76, 166, 282],
    docs: [63, 64, 71, 73, 74, 75, 76, 90, 110, 116, 123, 137, 138, 144, 155, 161, 163, 164, 165, 166, 172, 173, 175, 176, 177, 178, 179, 180, 181, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 212, 242, 244, 246, 248, 249, 250, 251, 258, 282, 283, 284],
  },
  "letters": {
    title: "Letters",
    description: "Correspondence with researchers, institutions, and public figures.",
    featured: [300, 305, 254, 255, 196, 200],
    docs: [107, 112, 132, 133, 147, 148, 194, 196, 198, 200, 202, 204, 207, 213, 215, 217, 219, 221, 223, 226, 228, 233, 245, 253, 254, 255, 266, 277, 294, 300, 303, 305],
  },
  "the-ground": {
    title: "The Ground",
    description: "Theological, philosophical, Platonic, logos, anamnesis, source documents.",
    featured: [91, 150, 153, 154, 103, 287],
    docs: [62, 65, 66, 70, 82, 91, 92, 93, 94, 103, 111, 114, 125, 130, 131, 150, 151, 152, 153, 154, 158, 206, 210, 214, 218, 220, 222, 227, 229, 232, 234, 243, 256, 257, 267, 279, 281, 287, 299],
  },
  "formalization": {
    title: "Formalization",
    description: "SIPE, branching set, hypotheses, conjectures, mathematical treatments.",
    featured: [143, 68, 54, 290, 272],
    docs: [54, 57, 58, 61, 68, 77, 78, 79, 80, 98, 120, 121, 140, 141, 142, 143, 152, 156, 161, 170, 171, 182, 189, 225, 261, 262, 263, 264, 265, 271, 272, 273, 274, 288, 290, 291, 292, 293, 306],
  },
  "introspection": {
    title: "Introspection",
    description: "Self-observation, strain, emission analogue, refractory, peak states.",
    featured: [95, 124, 230, 237, 270, 285],
    docs: [88, 95, 100, 102, 113, 115, 124, 126, 130, 135, 136, 139, 146, 168, 225, 230, 231, 235, 237, 260, 267, 270, 271, 275, 279, 285, 286, 304],
  },
  "clinical": {
    title: "Clinical",
    description: "Mental health, therapeutic protocols, practitioner documents.",
    featured: [128, 134, 55, 195, 203],
    docs: [55, 84, 86, 118, 127, 128, 133, 134, 194, 195, 198, 199, 201, 202, 203, 236, 240, 302],
  },
  "economics": {
    title: "Economics",
    description: "Economic analyses, reasoning effort, token economics.",
    featured: [56, 98, 173, 258],
    docs: [56, 63, 71, 90, 98, 173, 181, 205, 258, 268, 278, 302],
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
      [slug, title, content, importance, meta, now, now]
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

// ── FTS5 full-text search index ──
db.run(`DROP TABLE IF EXISTS corpus_fts`);
db.run(`CREATE VIRTUAL TABLE corpus_fts USING fts5(slug, title, introduction, body, tokenize='porter unicode61')`);

// Extract introduction text from each document and populate FTS
const allDocs = db.query("SELECT id, slug, title, body FROM content WHERE type='corpus' AND status='published'").all() as Array<{ id: number; slug: string; title: string; body: string }>;

function extractIntroduction(md: string): string {
  const lines = md.split("\n");
  let inIntro = false;
  let intro: string[] = [];
  for (const line of lines) {
    if (line.includes("**Reader's Introduction**")) { inIntro = true; continue; }
    if (inIntro) {
      if (line.startsWith(">")) {
        intro.push(line.replace(/^>\s*/, ""));
      } else {
        break;
      }
    }
  }
  return intro.join(" ").replace(/\*\*/g, "").trim();
}

const introductions: Record<string, { slug: string; title: string; intro: string; docNum: number | null }> = {};

for (const doc of allDocs) {
  const intro = extractIntroduction(doc.body);
  const docNum = extractDocNum(doc.slug + ".md");
  introductions[doc.slug] = { slug: doc.slug, title: doc.title, intro, docNum };
  // Strip markdown for body search
  const plainBody = doc.body.replace(/[#*>`\[\]()_~|]/g, " ").replace(/\s+/g, " ").trim();
  db.run("INSERT INTO corpus_fts(slug, title, introduction, body) VALUES (?, ?, ?, ?)",
    [doc.slug, doc.title, intro, plainBody]);
}

// ── Compute similarity matrix from introductions (TF-IDF keyword overlap) ──
const stopwords = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","and","but","or","nor","for","yet","so","in","on","at","to","from","by","with","of","as","that","this","it","its","not","no","if","than","into","about","up","out","what","which","who","whom","when","where","how","all","each","every","both","few","more","most","other","some","such","only","own","same","also","just","then","very","too","here","there","these","those","their","they","them","we","our","us","he","she","him","her","his","you","your","i","my","me","one","two"]);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
}

// Build TF-IDF vectors
const slugs = Object.keys(introductions);
const docFreq: Record<string, number> = {};
const tfVectors: Record<string, Record<string, number>> = {};

for (const slug of slugs) {
  const tokens = tokenize(introductions[slug].intro + " " + introductions[slug].title);
  const tf: Record<string, number> = {};
  for (const t of tokens) { tf[t] = (tf[t] || 0) + 1; }
  tfVectors[slug] = tf;
  const seen = new Set(Object.keys(tf));
  for (const term of seen) { docFreq[term] = (docFreq[term] || 0) + 1; }
}

const N = slugs.length;

function cosineSimilarity(a: string, b: string): number {
  const va = tfVectors[a] || {};
  const vb = tfVectors[b] || {};
  const allTerms = new Set([...Object.keys(va), ...Object.keys(vb)]);
  let dot = 0, magA = 0, magB = 0;
  for (const term of allTerms) {
    const df = docFreq[term] || 1;
    const idf = Math.log(N / df);
    const wa = (va[term] || 0) * idf;
    const wb = (vb[term] || 0) * idf;
    dot += wa * wb;
    magA += wa * wa;
    magB += wb * wb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Compute top-5 related docs per document and store in meta
const relatedMap: Record<string, string[]> = {};
for (const slug of slugs) {
  const scores: { slug: string; score: number }[] = [];
  for (const other of slugs) {
    if (other === slug) continue;
    scores.push({ slug: other, score: cosineSimilarity(slug, other) });
  }
  scores.sort((a, b) => b.score - a.score);
  relatedMap[slug] = scores.slice(0, 5).filter(s => s.score > 0.05).map(s => s.slug);
}

// Update meta with related docs
for (const slug of slugs) {
  const row = db.query("SELECT meta FROM content WHERE slug = ?").get(slug) as { meta: string } | null;
  if (row) {
    const meta = JSON.parse(row.meta);
    meta.related = relatedMap[slug] || [];
    meta.introduction = introductions[slug]?.intro || "";
    db.run("UPDATE content SET meta = ? WHERE slug = ?", [JSON.stringify(meta), slug]);
  }
}

console.log(`FTS5 index + similarity matrix built for ${slugs.length} documents`);

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
