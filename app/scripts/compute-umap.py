#!/usr/bin/env python3
"""Compute UMAP 3D positions for corpus documents from their embeddings.

Reads the corpus_embeddings table in corpus.sqlite, runs UMAP with cosine
metric, normalizes results globally so max magnitude = 1, writes JSON to
app/data/umap-positions.json.

Usage:
    python3 app/scripts/compute-umap.py
"""
from __future__ import annotations
import json
import sqlite3
import sys
from pathlib import Path

import numpy as np
import umap


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_DIR = SCRIPT_DIR.parent.parent
DB_PATH = REPO_DIR / "app" / "data" / "corpus.sqlite"
OUT_PATH = REPO_DIR / "app" / "data" / "umap-positions.json"

N_NEIGHBORS = 15
MIN_DIST = 0.1
N_COMPONENTS = 3
METRIC = "cosine"
RANDOM_STATE = 42


def main() -> int:
    if not DB_PATH.exists():
        print(f"error: {DB_PATH} not found", file=sys.stderr)
        return 1

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT slug, vector FROM corpus_embeddings ORDER BY slug")
    rows = cur.fetchall()
    conn.close()

    if len(rows) < N_NEIGHBORS + 1:
        print(f"error: not enough embeddings ({len(rows)}) for UMAP with n_neighbors={N_NEIGHBORS}", file=sys.stderr)
        return 1

    slugs = [r[0] for r in rows]
    vectors = np.array([json.loads(r[1]) for r in rows], dtype=np.float32)
    print(f"loaded {len(slugs)} embeddings, dim={vectors.shape[1]}", file=sys.stderr)

    reducer = umap.UMAP(
        n_neighbors=N_NEIGHBORS,
        min_dist=MIN_DIST,
        n_components=N_COMPONENTS,
        metric=METRIC,
        random_state=RANDOM_STATE,
        verbose=False,
    )
    coords = reducer.fit_transform(vectors)

    # Center at origin (UMAP output is translation-invariant anyway)
    coords = coords - coords.mean(axis=0, keepdims=True)
    max_mag = float(np.linalg.norm(coords, axis=1).max())
    if max_mag > 0:
        coords = coords / max_mag

    result = {slug: coords[i].tolist() for i, slug in enumerate(slugs)}

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(result, f)
    print(f"wrote {len(result)} UMAP positions to {OUT_PATH}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
