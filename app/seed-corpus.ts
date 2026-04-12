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

db.run(`CREATE TABLE IF NOT EXISTS corpus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_num INTEGER,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  section TEXT NOT NULL,
  body TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT DEFAULT 'published',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

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

  try {
    db.run(
      `INSERT OR REPLACE INTO corpus (doc_num, slug, title, subtitle, section, body, body_html, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
      [docNum, slug, title, subtitle, section, content, bodyHtml]
    );
    seeded++;
    console.log(`  ${docNum ? `[${docNum}]` : "[---]"} ${title} (${section})`);
  } catch (e: any) {
    console.error(`  ERROR: ${file}: ${e.message}`);
  }
}

console.log(`\nSeeded ${seeded} documents into ${DB_PATH}`);
db.close();
