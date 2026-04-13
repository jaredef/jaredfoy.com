// Inject internal cross-reference links into corpus body_html
// Converts "document N" references to <a href="/doc/slug">document N</a>
// Also extracts referenced document numbers for the "Related" footer

import Database from "bun:sqlite";

const DB_PATH = "app/data/corpus.sqlite";
const db = new Database(DB_PATH);

// Build doc_num → slug mapping
const rows = db.query('SELECT slug, meta FROM content WHERE type = "corpus"').all() as { slug: string; meta: string }[];
const numToSlug = new Map<number, string>();
const numToTitle = new Map<number, string>();

for (const row of rows) {
  const m = JSON.parse(row.meta || "{}");
  if (m.doc_num) {
    numToSlug.set(m.doc_num, row.slug);
  }
}

// Get titles
const titleRows = db.query('SELECT slug, title FROM content WHERE type = "corpus"').all() as { slug: string; title: string }[];
const slugToTitle = new Map<string, string>();
for (const row of titleRows) {
  slugToTitle.set(row.slug, row.title);
}

// Process each document
const allDocs = db.query('SELECT id, slug, meta FROM content WHERE type = "corpus"').all() as { id: number; slug: string; meta: string }[];

let updated = 0;

for (const doc of allDocs) {
  const meta = JSON.parse(doc.meta || "{}");
  let html = meta.body_html || "";
  if (!html) continue;

  const referencedDocs: { num: number; slug: string; title: string }[] = [];
  const seen = new Set<number>();

  // Match patterns: "document N", "Document N", "doc N", "(document N)"
  // But NOT inside href attributes or already-linked text
  const pattern = /(?<![\/\w-])(?:document|Document|doc)\s+(\d{1,3})(?!\d)(?![^<]*<\/a>)/g;

  html = html.replace(pattern, (match, numStr) => {
    const num = parseInt(numStr);
    const slug = numToSlug.get(num);
    if (!slug) return match; // No slug found, leave unchanged

    if (!seen.has(num)) {
      seen.add(num);
      const title = slugToTitle.get(slug) || `Document ${num}`;
      referencedDocs.push({ num, slug, title });
    }

    return `<a href="/doc/${slug}" class="doc-ref">${match}</a>`;
  });

  // Sort referenced docs by number
  referencedDocs.sort((a, b) => a.num - b.num);

  // Build related documents footer
  if (referencedDocs.length > 0) {
    let footer = '\n<hr class="ref-divider">\n<div class="referenced-docs">\n';
    footer += '<h3>Referenced Documents</h3>\n<ul>\n';
    for (const ref of referencedDocs) {
      footer += `<li><a href="/doc/${ref.slug}">[${ref.num}] ${ref.title}</a></li>\n`;
    }
    footer += '</ul>\n</div>\n';
    html += footer;
  }

  // Also add "More in this section" links
  const section = meta.section;
  if (section) {
    const sameSection = db.query(
      'SELECT slug, title, meta FROM content WHERE type = "corpus" AND slug != ? ORDER BY slug'
    ).all(doc.slug) as { slug: string; title: string; meta: string }[];

    const sectionDocs = sameSection.filter(d => {
      const m = JSON.parse(d.meta || "{}");
      return m.section === section;
    }).slice(0, 8); // Max 8 related

    if (sectionDocs.length > 0) {
      let sectionFooter = '\n<div class="section-docs">\n';
      sectionFooter += `<h3>More in ${section}</h3>\n<ul>\n`;
      for (const sd of sectionDocs) {
        const m = JSON.parse(sd.meta || "{}");
        const numLabel = m.doc_num ? `[${m.doc_num}] ` : "";
        sectionFooter += `<li><a href="/doc/${sd.slug}">${numLabel}${sd.title}</a></li>\n`;
      }
      sectionFooter += '</ul>\n</div>\n';
      html += sectionFooter;
    }
  }

  // Update the meta with the new body_html
  meta.body_html = html;
  meta.referenced_docs = referencedDocs.map(r => r.num);

  db.run('UPDATE content SET meta = ? WHERE id = ?', [JSON.stringify(meta), doc.id]);
  updated++;

  const refCount = referencedDocs.length;
  if (refCount > 0) {
    console.log(`  ${doc.slug}: ${refCount} references linked`);
  }
}

console.log(`\nProcessed ${updated} documents`);
db.close();
