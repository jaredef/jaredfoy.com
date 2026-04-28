import Database from "bun:sqlite";
import { readdirSync, readFileSync } from "fs";
import { resolve, basename } from "path";
import { createHash } from "crypto";

const CORPUS_DIR = resolve(import.meta.dir, "../../hypermediaapp.org/corpus");
const BLOG_DIR = resolve(import.meta.dir, "../blog");
const DB_PATH = resolve(import.meta.dir, "data/corpus.sqlite");
const MODEL = "text-embedding-3-large";
const API_KEY = process.env.OPENAI_API_KEY;

// text-embedding-3-small max is 8191 tokens. Using ~4 chars/token as a rough ceiling,
// target ~6200 tokens per chunk with a little headroom. Docs under this go as a single
// input; docs over get chunked, each chunk embedded separately, then averaged.
const CHARS_PER_CHUNK = 24000;
const CHUNK_OVERLAP = 1500;

// Per-request batching: OpenAI caps total request tokens; stay safely under.
const MAX_INPUTS_PER_REQUEST = 30;
const MAX_CHARS_PER_REQUEST = 350_000;

if (!API_KEY) {
  console.error("OPENAI_API_KEY is not set. Export it in your shell, then re-run.");
  process.exit(1);
}

function cleanMarkdown(md: string): string {
  // Light-touch cleanup: keep structure (headings, paragraphs), strip noise that
  // doesn't carry meaning (HTML comments, link URLs while keeping link text, code
  // fences' backtick delimiters, excessive whitespace).
  return md
    .replace(/<!--[\s\S]*?-->/g, "")               // HTML comments
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")       // [text](url) → text
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string): string[] {
  if (text.length <= CHARS_PER_CHUNK) return [text];
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + CHARS_PER_CHUNK, text.length);
    let cut = end;
    // Prefer to cut at a paragraph break if one is reasonably close to the end
    if (cut < text.length) {
      const windowStart = Math.max(i + CHARS_PER_CHUNK - 2500, i);
      const paraBreak = text.lastIndexOf("\n\n", cut);
      if (paraBreak > windowStart) cut = paraBreak;
    }
    chunks.push(text.slice(i, cut));
    if (cut >= text.length) break;
    i = Math.max(cut - CHUNK_OVERLAP, i + 1);
  }
  return chunks;
}

function contentHash(text: string, model: string, strategy: string): string {
  return createHash("sha256").update(`${model}|${strategy}|${text}`).digest("hex").slice(0, 16);
}

function normalize(vec: number[]): number[] {
  let mag = 0;
  for (let i = 0; i < vec.length; i++) mag += vec[i] * vec[i];
  mag = Math.sqrt(mag) || 1;
  return vec.map(v => v / mag);
}

function averageVectors(vectors: number[][]): number[] {
  const D = vectors[0].length;
  const sum = new Array(D).fill(0);
  for (const v of vectors) for (let i = 0; i < D; i++) sum[i] += v[i];
  for (let i = 0; i < D; i++) sum[i] /= vectors.length;
  return normalize(sum);
}

const db = new Database(DB_PATH);
db.run(`CREATE TABLE IF NOT EXISTS corpus_embeddings (
  slug TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  vector TEXT NOT NULL,
  embedded_at TEXT NOT NULL
)`);

const STRATEGY = "full-body-v1";

// Collect everything we need to process
type DocWork = {
  slug: string;
  chunks: string[];     // 1+ chunks of text to embed
  hash: string;
  chunkIndexOffset: number; // where this doc's chunks start in the input list
};

type Source = { dir: string; label: string };
const sources: Source[] = [
  { dir: CORPUS_DIR, label: "corpus" },
  { dir: BLOG_DIR, label: "blog" },
];
const work: DocWork[] = [];
let singleDocs = 0, chunkedDocs = 0, totalChunks = 0;

for (const { dir, label } of sources) {
  let files: string[];
  try {
    files = readdirSync(dir).filter(f => f.endsWith(".md")).sort();
  } catch (e: any) {
    if (e.code === "ENOENT") { console.log(`  [${label}] dir missing (${dir}) — skipping`); continue; }
    throw e;
  }
  for (const file of files) {
    const slug = basename(file, ".md");
    const raw = readFileSync(resolve(dir, file), "utf-8");
    const cleaned = cleanMarkdown(raw);
    if (!cleaned) continue;

    const hash = contentHash(cleaned, MODEL, STRATEGY);
    const existing = db.query("SELECT content_hash FROM corpus_embeddings WHERE slug = ? AND model = ?").get(slug, MODEL) as { content_hash: string } | null;
    if (existing && existing.content_hash === hash) continue;

    const chunks = chunkText(cleaned);
    if (chunks.length === 1) singleDocs++; else chunkedDocs++;
    totalChunks += chunks.length;
    work.push({ slug, chunks, hash, chunkIndexOffset: 0 });
  }
}

console.log(`${work.length} documents need embedding (${singleDocs} single, ${chunkedDocs} chunked into ${totalChunks} pieces total).`);
if (work.length === 0) {
  console.log("Nothing to do. All embeddings up to date.");
  db.close();
  process.exit(0);
}

// Flatten all chunks into a single input list, keeping track of which doc each chunk belongs to.
type FlatChunk = { docIdx: number; chunkIdx: number; text: string };
const flat: FlatChunk[] = [];
for (let d = 0; d < work.length; d++) {
  work[d].chunkIndexOffset = flat.length;
  for (let c = 0; c < work[d].chunks.length; c++) {
    flat.push({ docIdx: d, chunkIdx: c, text: work[d].chunks[c] });
  }
}

// Per-doc accumulator for chunk vectors
const vectorsByDoc: number[][][] = work.map(() => []);
const docDone: boolean[] = work.map(() => false);
let tokensUsed = 0;

// Incremental insert: as soon as a doc has all chunks embedded, persist it.
// This way a crash mid-run doesn't lose completed work.
const insert = db.prepare(`
  INSERT OR REPLACE INTO corpus_embeddings (slug, model, content_hash, vector, embedded_at)
  VALUES (?, ?, ?, ?, ?)
`);

// Batch by both count and total-char budget
let cursor = 0;
let batchNum = 0;
while (cursor < flat.length) {
  let end = cursor;
  let charsInBatch = 0;
  while (
    end < flat.length &&
    end - cursor < MAX_INPUTS_PER_REQUEST &&
    charsInBatch + flat[end].text.length <= MAX_CHARS_PER_REQUEST
  ) {
    charsInBatch += flat[end].text.length;
    end++;
  }
  // Always include at least one, even if a single chunk is over-budget
  if (end === cursor) end = cursor + 1;

  const slice = flat.slice(cursor, end);
  batchNum++;

  let result: { data: { embedding: number[]; index: number }[]; usage: { total_tokens: number } } | null = null;
  let attempt = 0;
  while (result === null) {
    attempt++;
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: slice.map(c => c.text),
      }),
    });

    if (response.ok) {
      result = await response.json() as typeof result extends null ? never : NonNullable<typeof result>;
    } else if (response.status === 429 && attempt <= 6) {
      const err = await response.text();
      const match = err.match(/try again in ([0-9.]+)s/);
      const waitSec = match ? Math.max(parseFloat(match[1]), 1) + 1 : Math.pow(2, attempt);
      console.error(`  batch ${batchNum} 429 (attempt ${attempt}); sleeping ${waitSec}s`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
    } else {
      const err = await response.text();
      console.error(`OpenAI API error (batch ${batchNum}, chunks ${cursor}-${end - 1}): ${response.status} ${err}`);
      process.exit(1);
    }
  }

  tokensUsed += result.usage.total_tokens;

  for (const item of result.data) {
    const chunk = slice[item.index];
    vectorsByDoc[chunk.docIdx].push(item.embedding);
  }

  const touchedDocs = new Set(slice.map(c => c.docIdx));
  const nowBatch = new Date().toISOString();
  let insertedThisBatch = 0;
  for (const d of touchedDocs) {
    if (docDone[d]) continue;
    if (vectorsByDoc[d].length !== work[d].chunks.length) continue;
    const vectors = vectorsByDoc[d];
    const finalVec = vectors.length === 1 ? normalize(vectors[0]) : averageVectors(vectors);
    insert.run(work[d].slug, MODEL, work[d].hash, JSON.stringify(finalVec), nowBatch);
    docDone[d] = true;
    insertedThisBatch++;
  }

  console.log(`  batch ${batchNum}: ${slice.length} chunks (${result.usage.total_tokens} tokens, running total ${tokensUsed}${insertedThisBatch ? `, +${insertedThisBatch} docs persisted` : ""})`);
  cursor = end;
}

// Any stragglers (shouldn't happen — every doc's chunks should have been in the loop)
const now = new Date().toISOString();
for (let d = 0; d < work.length; d++) {
  if (docDone[d]) continue;
  const vectors = vectorsByDoc[d];
  if (vectors.length === 0) {
    console.error(`  skipping ${work[d].slug}: no vectors returned`);
    continue;
  }
  const finalVec = vectors.length === 1 ? normalize(vectors[0]) : averageVectors(vectors);
  insert.run(work[d].slug, MODEL, work[d].hash, JSON.stringify(finalVec), now);
}

const pricePerMil = MODEL === "text-embedding-3-large" ? 0.13 : 0.02;
console.log(`\nTotal: ${work.length} documents, ${totalChunks} chunks, ${tokensUsed} tokens used (~$${(tokensUsed / 1_000_000 * pricePerMil).toFixed(4)} at ${MODEL} pricing).`);
console.log(`Embeddings stored in ${DB_PATH} (table: corpus_embeddings, strategy: ${STRATEGY}).`);
db.close();
