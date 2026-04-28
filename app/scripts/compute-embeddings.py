#!/usr/bin/env python3
"""
Compute semantic embeddings for all corpus document introductions
using a small local model (all-MiniLM-L6-v2, 22M params, 384 dims).

Outputs: updates the corpus.sqlite meta JSON with:
  - embedding: list of 384 floats (stored separately in embeddings table)
  - related_semantic: top-5 related docs by cosine similarity

Also creates an embeddings table in SQLite for efficient storage.
"""

import json
import sqlite3
import sys
import numpy as np
from sentence_transformers import SentenceTransformer

DB_PATH = sys.argv[1] if len(sys.argv) > 1 else "data/corpus.sqlite"

print("Loading model: all-MiniLM-L6-v2...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Loading documents...")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Get all docs with introductions
cur.execute("""
    SELECT slug, title, json_extract(meta, '$.introduction') as intro,
           json_extract(meta, '$.doc_num') as doc_num
    FROM content
    WHERE type='corpus' AND status='published'
    ORDER BY slug
""")
rows = cur.fetchall()

slugs = []
texts = []
doc_nums = []
for slug, title, intro, doc_num in rows:
    slugs.append(slug)
    doc_nums.append(doc_num)
    # Use introduction + title for embedding (richer signal)
    text = f"{title}. {intro}" if intro else title
    texts.append(text)

print(f"Computing embeddings for {len(texts)} documents...")
embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

# Create embeddings table
cur.execute("DROP TABLE IF EXISTS embeddings")
cur.execute("""
    CREATE TABLE embeddings (
        slug TEXT PRIMARY KEY,
        vector BLOB NOT NULL
    )
""")

for i, slug in enumerate(slugs):
    vec_bytes = embeddings[i].astype(np.float32).tobytes()
    cur.execute("INSERT INTO embeddings (slug, vector) VALUES (?, ?)", (slug, vec_bytes))

# Compute cosine similarity matrix and store top-5 related
print("Computing similarity matrix...")
# Embeddings are already normalized, so cosine = dot product
sim_matrix = embeddings @ embeddings.T

for i, slug in enumerate(slugs):
    scores = sim_matrix[i]
    # Get top-6 (excluding self)
    top_indices = np.argsort(scores)[::-1]
    related = []
    for j in top_indices:
        if j == i:
            continue
        if scores[j] < 0.1:
            break
        related.append({
            "slug": slugs[j],
            "score": round(float(scores[j]), 4)
        })
        if len(related) >= 5:
            break

    # Update meta with semantic related docs
    cur.execute("SELECT meta FROM content WHERE slug = ?", (slug,))
    row = cur.fetchone()
    if row:
        meta = json.loads(row[0])
        meta["related_semantic"] = [r["slug"] for r in related]
        meta["related_scores"] = {r["slug"]: r["score"] for r in related}
        # Also update the main related field to use semantic similarity
        meta["related"] = [r["slug"] for r in related]
        cur.execute("UPDATE content SET meta = ? WHERE slug = ?", (json.dumps(meta), slug))

conn.commit()
conn.close()

print(f"Done. {len(slugs)} embeddings stored. Similarity matrix computed.")

# Print some interesting clusters
print("\nTop coherence pairs (highest similarity):")
pairs = []
for i in range(len(slugs)):
    for j in range(i + 1, len(slugs)):
        pairs.append((sim_matrix[i][j], slugs[i], slugs[j]))
pairs.sort(reverse=True)
for score, a, b in pairs[:10]:
    print(f"  {score:.4f}  {a[:40]:40s}  <->  {b[:40]}")
