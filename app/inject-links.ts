// Inject internal cross-reference links into corpus body_html.
// Matches "Doc N", "Docs N", "Docs N, M, P", "Docs N–M" (en-dash or hyphen),
// and compound forms. Skips existing <a>, <code>, <pre> blocks so markdown
// links and code fences aren't touched. Also preserves the original
// "Referenced Documents" footer and the "More in this section" footer.
//
// Runs as a post-step of seed-corpus.ts: after all docs are seeded, this
// script back-fills body_html with inline hyperlinks for every recognized
// Doc reference.

import Database from "bun:sqlite";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dir, "data/corpus.sqlite");
const db = new Database(DB_PATH);

// ── Build number → slug / title maps ────────────────────────────────
const rows = db.query('SELECT slug, title, meta FROM content WHERE type = "corpus"').all() as { slug: string; title: string; meta: string }[];
const numToSlug = new Map<number, string>();
const slugToTitle = new Map<string, string>();
for (const row of rows) {
  const m = JSON.parse(row.meta || "{}");
  if (m.doc_num) numToSlug.set(m.doc_num, row.slug);
  slugToTitle.set(row.slug, row.title);
}

// ── Protect existing links and code from re-linking ─────────────────
// Replace each protected region with a sentinel `\u0000Pn\u0000`, process
// the resulting HTML, then restore. This is the only reliable way to avoid
// re-linking inside existing <a> tags, <code>, or <pre> blocks (markdown
// links and code fences both render to these in marked's output).
function protectRegions(html: string, store: string[]): string {
  return html.replace(
    /<a\b[^>]*>[\s\S]*?<\/a>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>/g,
    (m) => {
      const i = store.length;
      store.push(m);
      return `\u0000P${i}\u0000`;
    },
  );
}
function restoreRegions(html: string, store: string[]): string {
  return html.replace(/\u0000P(\d+)\u0000/g, (_, i) => store[parseInt(i)]);
}

// ── The link-injection regex ────────────────────────────────────────
// Matches "Doc N", "Docs N", "Docs N, M, P", "Docs N–M", "Docs N-M",
// where N/M/P are 2–3 digits.
//
// Group 1: "Doc" or "Docs"
// Group 2: the number(s) string, possibly with separators ", – -"
//
// The `(?!\d)` negative lookahead on the last digit prevents matching
// into 4+ digit numbers like "Doc 2026".
const REF_PATTERN =
  /\b(Docs?)\s+(\d{2,3}(?:\s*[,–\-]\s*\d{2,3})*)(?!\d)\b/g;

function injectLinks(
  html: string,
  seen: Set<number>,
  refs: { num: number; slug: string; title: string }[],
): string {
  return html.replace(REF_PATTERN, (match, prefix, numsStr) => {
    const isCompound = /[,\-–]/.test(numsStr);

    if (isCompound) {
      // "Docs 142, 143, 157" / "Docs 336–367": keep prefix as text, link each
      // number individually while preserving separators and whitespace.
      const linkedNums = numsStr.replace(/\d{2,3}/g, (numStr: string) => {
        const num = parseInt(numStr);
        const slug = numToSlug.get(num);
        if (!slug) return numStr;
        if (!seen.has(num)) {
          seen.add(num);
          refs.push({ num, slug, title: slugToTitle.get(slug) || `Doc ${num}` });
        }
        return `<a href="/resolve/doc/${slug}" class="doc-ref">${numStr}</a>`;
      });
      return `${prefix} ${linkedNums}`;
    }

    // Single reference: link the whole phrase "Doc N" or "Docs N".
    const num = parseInt(numsStr);
    const slug = numToSlug.get(num);
    if (!slug) return match;
    if (!seen.has(num)) {
      seen.add(num);
      refs.push({ num, slug, title: slugToTitle.get(slug) || `Doc ${num}` });
    }
    return `<a href="/resolve/doc/${slug}" class="doc-ref">${prefix} ${numsStr}</a>`;
  });
}

// ── Process every corpus doc ────────────────────────────────────────
const allDocs = db.query('SELECT id, slug, meta FROM content WHERE type = "corpus"').all() as { id: number; slug: string; meta: string }[];

let updated = 0;
let totalLinks = 0;

for (const doc of allDocs) {
  const meta = JSON.parse(doc.meta || "{}");
  let html: string = meta.body_html || "";
  if (!html) continue;

  // Split body from any existing referenced-docs / section-docs footer so
  // re-runs don't append duplicate footers. The footers are re-built fresh
  // below from the current link pass.
  const refFooterIdx = html.indexOf('<hr class="ref-divider">');
  const sectionFooterIdx = html.indexOf('<div class="section-docs">');
  let bodyOnly = html;
  if (refFooterIdx !== -1) bodyOnly = bodyOnly.slice(0, refFooterIdx);
  if (sectionFooterIdx !== -1 && (refFooterIdx === -1 || sectionFooterIdx < refFooterIdx)) {
    bodyOnly = html.slice(0, sectionFooterIdx);
  }

  const refs: { num: number; slug: string; title: string }[] = [];
  const seen = new Set<number>();

  // Protect existing links and code, inject, then restore.
  const protectedRegions: string[] = [];
  let working = protectRegions(bodyOnly, protectedRegions);
  working = injectLinks(working, seen, refs);
  working = restoreRegions(working, protectedRegions);

  // Count links added (rough: count new <a ... class="doc-ref"> tags).
  const linkCount = (working.match(/class="doc-ref"/g) || []).length;
  totalLinks += linkCount;

  // ── Rebuild footers ───────────────────────────────────────────────
  refs.sort((a, b) => a.num - b.num);

  let finalHtml = working;

  if (refs.length > 0) {
    let footer = '\n<hr class="ref-divider">\n<div class="referenced-docs">\n';
    footer += '<h3>Referenced Documents</h3>\n<ul>\n';
    for (const ref of refs) {
      footer += `<li><a href="/resolve/doc/${ref.slug}">[${ref.num}] ${ref.title}</a></li>\n`;
    }
    footer += '</ul>\n</div>\n';
    finalHtml += footer;
  }

  // "More in this section" footer — preserved from the prior script's behavior.
  const section = meta.section;
  if (section) {
    const sameSection = db.query(
      'SELECT slug, title, meta FROM content WHERE type = "corpus" AND slug != ? ORDER BY slug'
    ).all(doc.slug) as { slug: string; title: string; meta: string }[];
    const sectionDocs = sameSection.filter((d) => {
      const m = JSON.parse(d.meta || "{}");
      return m.section === section;
    }).slice(0, 8);
    if (sectionDocs.length > 0) {
      let sectionFooter = '\n<div class="section-docs">\n';
      sectionFooter += `<h3>More in ${section}</h3>\n<ul>\n`;
      for (const sd of sectionDocs) {
        const m = JSON.parse(sd.meta || "{}");
        const numLabel = m.doc_num ? `[${m.doc_num}] ` : "";
        sectionFooter += `<li><a href="/resolve/doc/${sd.slug}">${numLabel}${sd.title}</a></li>\n`;
      }
      sectionFooter += '</ul>\n</div>\n';
      finalHtml += sectionFooter;
    }
  }

  meta.body_html = finalHtml;
  meta.referenced_docs = refs.map((r) => r.num);

  db.run('UPDATE content SET meta = ? WHERE id = ?', [JSON.stringify(meta), doc.id]);
  updated++;
}

console.log(`inject-links: ${updated} documents processed, ${totalLinks} inline doc-refs linked.`);
db.close();
