// Builds the prompt-graph JSON from corpus markdown.
//
// Walks the corpus directory, extracts the "Originating prompt(s)" sections,
// produces one node per prompt, detects three edge types:
//   (1) Explicit doc reference: prompt text contains "Doc NNN" or "doc NNN"
//   (2) Temporal predecessor: the immediately-prior prompt in doc-number order
//   (3) Continuation: prompt starts with continuation language
//        ("now", "based on", "expand", "yes", "do both", etc.)
//
// Output: app/data/prompt-graph.json
//
// Usage: bun run app/build-prompt-graph.ts

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, basename } from "path";
import Database from "bun:sqlite";

const CORPUS_DIR = resolve(import.meta.dir, "../../hypermediaapp.org/corpus");
const OUT_PATH = resolve(import.meta.dir, "data/prompt-graph.json");
const PUBLIC_OUT_PATH = resolve(import.meta.dir, "public/prompt-graph.json");
const DB_PATH = resolve(import.meta.dir, "data/corpus.sqlite");

// ============================================================================
// Step 1: Parse the corpus and extract prompts.
// ============================================================================

interface PromptNode {
  id: string;            // unique node id, e.g. "514-1" (doc 514, prompt 1)
  doc_num: number;
  doc_slug: string;      // e.g. "514-structural-isomorphism-canonical-formalization"
  doc_title: string;
  prompt_index: number;  // 1-based index of this prompt within the doc
  prompt_text: string;
  prompt_count_in_doc: number; // how many prompts this doc has total
}

interface PromptEdge {
  from: string;     // node id
  to: string;       // node id
  kind: "ref" | "temporal" | "continuation";
}

const files = readdirSync(CORPUS_DIR)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => /^\d{3}-/.test(f))
  .sort();

const nodes: PromptNode[] = [];

for (const file of files) {
  const slug = basename(file, ".md");
  const docNumMatch = slug.match(/^(\d{3})/);
  if (!docNumMatch) continue;
  const docNum = parseInt(docNumMatch[1], 10);

  const content = readFileSync(resolve(CORPUS_DIR, file), "utf-8");

  // Extract title from first H1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Find the originating-prompt section. The corpus uses several conventions
  // for marking the prompt-appendix block at the bottom of a doc:
  //   1. Italic tag-line:        *Originating prompt(s):*
  //   2. ## section header:      ## Appendix: Originating prompt
  //                              ## Appendix: The Prompt That Triggered This Document
  //                              ## Appendix A: The Prompt
  //                              ## The Prompt That Elicited This Document
  //                              ## Appendix C: The prompts that triggered the v3...
  //   3. Bold tag-line:          **Originating prompt:**
  // The marker is matched on a line of its own; the section runs from that
  // line to the end of the file (or until the next h2 — captured by the
  // dotall match). All blockquotes inside the section are treated as prompts.
  // Header prefix that may sit before the prompt-appendix label:
  //   none; "1.", "12.", "A.", "B.4." — numbered or lettered;
  //   "Part 4:", "Part N:" — used in the praxis-log series.
  const HEADER_PREFIX = String.raw`(?:(?:Part\s+\d+\s*:?\s*)?(?:[\dA-Z]+(?:\.\d+)?[.):]\s+)?(?:[—–-]\s*)?)`;
  const markerLineRegex = new RegExp(
    [
      // Italic-marker forms: *Originating prompt...* or *The prompt was...*
      String.raw`^\s*\*\s*(?:Originating\s+[Pp]rompts?|The\s+[Pp]rompts?\s+(?:that|was|were)\b)[^*\n]*\*\s*$`,
      // Bold-marker form: **Originating prompt:**
      String.raw`^\s*\*\*\s*(?:Originating\s+[Pp]rompts?|The\s+[Pp]rompts?\s+(?:that|was|were)\b)[^*\n]*\*\*\s*$`,
      // ## header forms — anything that looks like a prompt-appendix header.
      // Examples surveyed across the corpus:
      //   "Appendix: The Prompt That Triggered..."
      //   "Appendix A: The Prompt", "Appendix B: Prompt"
      //   "Appendix C: The prompts that triggered v3..."
      //   "Appendix D: Originating prompt"
      //   "12. Appendix: Originating prompt"          ← numbered
      //   "Part 4: Appendix — The Four Prompts..."    ← part-numbered + em-dash
      //   "The Prompt That Elicited This Document"
      //   "Jared's Prompt, Appended in Full"          ← keeper-named convention
      //   "Jared's Prompt, Appended for Transparency"
      //   "Jared's Prompt, Preserved"
      String.raw`^##\s+` + HEADER_PREFIX +
        String.raw`(?:Appendix\b[^\n]*?[Pp]rompts?[^\n]*|Originating\s+[Pp]rompts?[^\n]*|Jared'?s\s+[Pp]rompts?\b[^\n]*|The\s+[Pp]rompts?\s+[Tt]hat\b[^\n]*|The\s+[Pp]rompts?\s+(?:Elicited|Produced|Triggered)\b[^\n]*|The\s+(?:Four|Three|Two|Five|Six|Seven|Eight|Nine|Ten)\s+[Pp]rompts?\b[^\n]*)$`,
    ].join("|"),
    "m",
  );
  const markerMatch = content.match(markerLineRegex);
  if (!markerMatch) continue;

  // Section runs from the marker line until the next h2 (## ...) or end of file.
  // Some docs (e.g. 001) have additional appendices after the prompt appendix
  // that contain blockquoted deprecation notices — those must not be captured.
  const markerOffset = markerMatch.index ?? 0;
  const after = content.slice(markerOffset + markerMatch[0].length);
  const nextSectionMatch = after.match(/\n##\s+/);
  const promptSection =
    nextSectionMatch && typeof nextSectionMatch.index === "number"
      ? content.slice(markerOffset, markerOffset + markerMatch[0].length + nextSectionMatch.index)
      : content.slice(markerOffset);

  // Within the section, extract each blockquote (starts with "> ").
  // A prompt may span multiple lines; consecutive "> " lines form one prompt.
  const lines = promptSection.split("\n");
  const prompts: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith(">")) {
      // strip the leading "> " and any leading whitespace
      const stripped = line.replace(/^>\s?/, "");
      current.push(stripped);
    } else if (line.trim() === "" && current.length > 0) {
      // blank line separates prompts only if it's truly outside a quote block
      const text = current.join(" ").replace(/\s+/g, " ").trim();
      if (text) prompts.push(text);
      current = [];
    } else if (line.trim() !== "" && !line.startsWith(">")) {
      if (current.length > 0) {
        const text = current.join(" ").replace(/\s+/g, " ").trim();
        if (text) prompts.push(text);
        current = [];
      }
    }
  }
  if (current.length > 0) {
    const text = current.join(" ").replace(/\s+/g, " ").trim();
    if (text) prompts.push(text);
  }

  if (prompts.length === 0) continue;

  prompts.forEach((text, i) => {
    nodes.push({
      id: `${docNum}-${i + 1}`,
      doc_num: docNum,
      doc_slug: slug,
      doc_title: title,
      prompt_index: i + 1,
      prompt_text: text,
      prompt_count_in_doc: prompts.length,
    });
  });
}

console.log(`Extracted ${nodes.length} prompts from ${new Set(nodes.map((n) => n.doc_num)).size} docs.`);

// ============================================================================
// Step 2: Detect edges.
// ============================================================================

const edges: PromptEdge[] = [];

// Build a doc_num → first node id map for explicit-ref edges.
const docFirstNode = new Map<number, string>();
for (const n of nodes) {
  if (!docFirstNode.has(n.doc_num)) {
    docFirstNode.set(n.doc_num, n.id);
  }
}

// (1) Explicit references: scan each prompt for "Doc NNN" or "doc NNN" references.
const refRegex = /\b[Dd]oc\s+(\d{3})\b/g;
for (const node of nodes) {
  const seen = new Set<number>();
  let m;
  while ((m = refRegex.exec(node.prompt_text)) !== null) {
    const refNum = parseInt(m[1], 10);
    if (refNum === node.doc_num) continue; // self-reference
    if (refNum > node.doc_num) continue;   // can't reference later docs (acyclic)
    if (seen.has(refNum)) continue;
    seen.add(refNum);
    const targetId = docFirstNode.get(refNum);
    if (targetId) {
      edges.push({ from: node.id, to: targetId, kind: "ref" });
    }
  }
}

// (2) Temporal predecessor: each prompt has an edge to the prompt
// immediately before it in temporal order (sorted by doc_num then prompt_index).
const sortedNodes = [...nodes].sort((a, b) => {
  if (a.doc_num !== b.doc_num) return a.doc_num - b.doc_num;
  return a.prompt_index - b.prompt_index;
});
for (let i = 1; i < sortedNodes.length; i++) {
  edges.push({
    from: sortedNodes[i].id,
    to: sortedNodes[i - 1].id,
    kind: "temporal",
  });
}

// (3) Continuation: prompts starting with continuation cues.
const continuationCues = [
  /^now\b/i, /^based on\b/i, /^expand\b/i, /^yes\b/i, /^do both\b/i,
  /^update\b/i, /^append\b/i, /^great\b/i, /^run\b/i, /^also\b/i,
  /^do a\b/i, /^continue\b/i, /^let'?s\b/i, /^reformalize\b/i,
];
for (let i = 1; i < sortedNodes.length; i++) {
  const text = sortedNodes[i].prompt_text;
  if (continuationCues.some((rx) => rx.test(text))) {
    // Mark the temporal edge as continuation instead.
    // Find and upgrade the temporal edge.
    const edge = edges.find(
      (e) => e.from === sortedNodes[i].id && e.to === sortedNodes[i - 1].id && e.kind === "temporal",
    );
    if (edge) edge.kind = "continuation";
  }
}

console.log(`Built ${edges.length} edges:`);
const counts = edges.reduce<Record<string, number>>((acc, e) => {
  acc[e.kind] = (acc[e.kind] || 0) + 1;
  return acc;
}, {});
console.log(`  ref: ${counts.ref || 0}`);
console.log(`  temporal: ${counts.temporal || 0}`);
console.log(`  continuation: ${counts.continuation || 0}`);

// ============================================================================
// Step 3: Pull doc-level PCA positions from the embedding-derived sphere
// coordinates so the visualization can offer a Semantic layout in addition
// to the time-axis layout. The seed pipeline computes top-3 PCA from the
// per-doc embeddings and stores [x,y,z] in meta.sphere_pos. We pass them
// through unchanged; the client scales to canvas units.
// ============================================================================

interface DocCloudEntry {
  doc_num: number;
  doc_slug: string;
  doc_title: string;
  pos: [number, number, number];   // PCA (sphere_pos), each in roughly [-1, 1]
  has_prompt: boolean;             // true if at least one prompt was extracted
}

const docCloud: DocCloudEntry[] = [];
if (existsSync(DB_PATH)) {
  const promptDocSet = new Set(nodes.map((n) => n.doc_slug));
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db
    .query(
      `SELECT slug, title,
              json_extract(meta, '$.doc_num') as doc_num,
              json_extract(meta, '$.sphere_pos') as sphere_pos
       FROM content WHERE type='corpus' AND status='published'
       ORDER BY doc_num ASC`,
    )
    .all() as Array<{ slug: string; title: string; doc_num: number; sphere_pos: string | null }>;
  for (const r of rows) {
    if (!r.sphere_pos) continue;
    let pos: [number, number, number] | null = null;
    try {
      const arr = JSON.parse(r.sphere_pos);
      if (Array.isArray(arr) && arr.length === 3) pos = [arr[0], arr[1], arr[2]];
    } catch { /* ignore */ }
    if (!pos) continue;
    docCloud.push({
      doc_num: r.doc_num,
      doc_slug: r.slug,
      doc_title: r.title,
      pos,
      has_prompt: promptDocSet.has(r.slug),
    });
  }
  db.close();
  console.log(`Doc cloud: ${docCloud.length} docs with PCA positions ` +
    `(${docCloud.filter((d) => d.has_prompt).length} with prompts).`);
} else {
  console.warn(`No SQLite db at ${DB_PATH} — doc cloud will be empty.`);
}

// ============================================================================
// Step 4: Write JSON.
// ============================================================================

const output = {
  generated: new Date().toISOString(),
  node_count: nodes.length,
  edge_count: edges.length,
  doc_count: new Set(nodes.map((n) => n.doc_num)).size,
  doc_range: {
    first: Math.min(...nodes.map((n) => n.doc_num)),
    last: Math.max(...nodes.map((n) => n.doc_num)),
  },
  nodes,
  edges,
  doc_cloud: docCloud,
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
writeFileSync(PUBLIC_OUT_PATH, JSON.stringify(output));
console.log(`Wrote ${OUT_PATH}`);
console.log(`Wrote ${PUBLIC_OUT_PATH}`);
