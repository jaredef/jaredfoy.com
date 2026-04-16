#!/usr/bin/env python3
"""
Open Graph image generator for the RESOLVE corpus.

Reads a JSON manifest of {slug, title, doc_num, section} from stdin and writes
1200x630 PNG OG images into the output directory specified by --out. One image
per corpus document. Designed to match the site's monospace dark aesthetic.

Usage:
    python3 generate-og.py --out /path/to/public/og < manifest.json

Manifest format (stdin):
    [{"slug": "...", "title": "...", "doc_num": 128, "section": "framework"}, ...]
"""

import argparse
import json
import os
import sys
import textwrap

from PIL import Image, ImageDraw, ImageFont


# Palette (dark — matches the site's default theme)
BG = (10, 10, 15)            # --bg
ACCENT = (124, 138, 255)     # --accent
ACCENT_DIM = (74, 82, 153)   # --accent-dim
FG_BRIGHT = (232, 232, 240)  # --fg-bright
FG = (200, 200, 212)         # --fg
FG_DIM = (106, 106, 122)     # --fg-dim
BORDER = (26, 26, 40)        # --border

W = 1200
H = 630
PAD = 64

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap_title(title: str, max_chars_per_line: int = 26, max_lines: int = 4) -> list[str]:
    """Word-wrap the title to fit within the layout, truncating with an ellipsis if it overflows."""
    words = title.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        if len(candidate) <= max_chars_per_line:
            current = candidate
        else:
            if current:
                lines.append(current)
            # Long word: hard-break.
            while len(word) > max_chars_per_line:
                lines.append(word[:max_chars_per_line])
                word = word[max_chars_per_line:]
                if len(lines) >= max_lines:
                    break
            current = word
        if len(lines) >= max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        # Truncate last line with ellipsis
        last = lines[-1]
        if len(last) > max_chars_per_line - 1:
            last = last[: max_chars_per_line - 1]
        lines[-1] = last + "…"
    return lines


def render_og(title: str, doc_num: int | None, section: str | None) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Subtle accent strip on the left edge.
    draw.rectangle([(0, 0), (6, H)], fill=ACCENT_DIM)

    # Hairline border (frame the card subtly).
    draw.rectangle([(0, 0), (W - 1, H - 1)], outline=BORDER, width=2)

    # Top-left: brand
    brand_font = load_font(MONO_BOLD, 38)
    draw.text((PAD, PAD), "RESOLVE", fill=ACCENT, font=brand_font, spacing=8)

    # Tagline
    tagline_font = load_font(MONO, 18)
    draw.text(
        (PAD, PAD + 56),
        "constraints induce properties",
        fill=FG_DIM,
        font=tagline_font,
    )

    # Center: title (wrapped, max 4 lines)
    title_lines = wrap_title(title)
    title_font = load_font(MONO_BOLD, 56)
    line_h = 70
    block_h = len(title_lines) * line_h
    start_y = (H - block_h) // 2 - 10
    for i, line in enumerate(title_lines):
        draw.text((PAD, start_y + i * line_h), line, fill=FG_BRIGHT, font=title_font)

    # Bottom-left: document badge
    badge_font = load_font(MONO, 22)
    badge_parts = []
    if doc_num is not None:
        badge_parts.append(f"document {int(doc_num):03d}")
    if section:
        badge_parts.append(section.lower())
    if badge_parts:
        draw.text(
            (PAD, H - PAD - 56),
            " · ".join(badge_parts),
            fill=FG_DIM,
            font=badge_font,
        )

    # Bottom-left lower: domain
    domain_font = load_font(MONO, 18)
    draw.text(
        (PAD, H - PAD - 24),
        "jaredfoy.com",
        fill=FG_DIM,
        font=domain_font,
    )

    return img


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="output directory for PNGs")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    try:
        manifest = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"manifest parse error: {e}", file=sys.stderr)
        return 1

    written = 0
    for doc in manifest:
        slug = doc.get("slug")
        if not slug:
            continue
        title = doc.get("title") or "Untitled"
        doc_num = doc.get("doc_num")
        section = doc.get("section")
        try:
            img = render_og(title=title, doc_num=doc_num, section=section)
            img.save(os.path.join(args.out, f"{slug}.png"), "PNG", optimize=True)
            written += 1
        except Exception as e:  # noqa: BLE001
            print(f"failed {slug}: {e}", file=sys.stderr)

    print(f"wrote {written} OG images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
