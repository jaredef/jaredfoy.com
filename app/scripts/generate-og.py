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

# Palette (blog — warmer, more literary; echoes the Medium-style Charter-serif
# blog page styling in /templates/blog.htx and /templates/blog/[slug].htx).
BG_BLOG = (14, 12, 11)            # warm near-black
AMBER = (212, 168, 102)           # warm accent
AMBER_DIM = (146, 112, 66)        # dimmer amber
AMBER_FAINT = (78, 60, 36)        # faintest amber (for trace motif)
FG_BRIGHT_BLOG = (240, 236, 230)  # warm off-white for title
FG_BLOG = (212, 206, 196)         # warm near-white for body
FG_DIM_BLOG = (148, 142, 134)     # warm gray
BORDER_BLOG = (30, 24, 18)        # warm dark border

W = 1200
H = 630
PAD = 64

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF_ITALIC = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"

SPHERE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "coherence-sphere.jpg")
SPHERE_TARGET_H = 560


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def load_sphere() -> Image.Image | None:
    if not os.path.exists(SPHERE_PATH):
        return None
    sphere = Image.open(SPHERE_PATH).convert("RGB")
    ratio = SPHERE_TARGET_H / sphere.height
    new_size = (int(sphere.width * ratio), SPHERE_TARGET_H)
    return sphere.resize(new_size, Image.LANCZOS)


def wrap_title(title: str, max_chars_per_line: int = 14, max_lines: int = 5) -> list[str]:
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


def render_og(title: str, doc_num: int | None, section: str | None, sphere: Image.Image | None = None) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)

    # Composite sphere on the right before drawing, so text overlays are crisp.
    if sphere is not None:
        sx = W - sphere.width - 20
        sy = (H - sphere.height) // 2
        img.paste(sphere, (sx, sy))

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

    # Center-left: title (wrapped, narrower than before to leave room for the sphere on the right)
    title_lines = wrap_title(title)
    title_font = load_font(MONO_BOLD, 44)
    line_h = 56
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


def wrap_blog_title(title: str, max_chars_per_line: int = 26, max_lines: int = 4) -> list[str]:
    """Word-wrap a blog-post title for the wider serif layout (no sphere on the right)."""
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
        last = lines[-1]
        if len(last) > max_chars_per_line - 1:
            last = last[: max_chars_per_line - 1]
        lines[-1] = last + "…"
    return lines


def render_og_blog(title: str, sphere: Image.Image | None = None) -> Image.Image:
    """Blog-post OG card. Warm dark palette, serif title, amber accent, and the
    coherence sphere composited on the right — shared visual vocabulary with the
    corpus OG while the left-side typography distinguishes the blog channel."""
    img = Image.new("RGB", (W, H), BG_BLOG)

    # Composite the sphere on the right before drawing text so overlays stay crisp.
    if sphere is not None:
        sx = W - sphere.width - 20
        sy = (H - sphere.height) // 2
        img.paste(sphere, (sx, sy))

    draw = ImageDraw.Draw(img)

    # Left-edge accent: thin warm amber strip.
    draw.rectangle([(0, 0), (4, H)], fill=AMBER_DIM)

    # Hairline outer border, warm tone.
    draw.rectangle([(0, 0), (W - 1, H - 1)], outline=BORDER_BLOG, width=2)

    # Top-left wordmark: brand in small italic serif.
    wordmark_font = load_font(SERIF_ITALIC, 22)
    draw.text((PAD, PAD), "jaredfoy.com", fill=FG_DIM_BLOG, font=wordmark_font)
    draw.text((PAD, PAD + 32), "— essays", fill=FG_DIM_BLOG, font=wordmark_font)

    # Center-left: title in serif. Narrower wrap now that the sphere occupies
    # the right half of the canvas, mirroring the corpus OG layout.
    title_lines = wrap_blog_title(title, max_chars_per_line=16, max_lines=5)
    title_font = load_font(SERIF_BOLD, 50)
    line_h = 64
    block_h = len(title_lines) * line_h
    start_y = (H - block_h) // 2 - 20
    for i, line in enumerate(title_lines):
        draw.text((PAD, start_y + i * line_h), line, fill=FG_BRIGHT_BLOG, font=title_font)

    # Thin hairline under the title.
    rule_y = start_y + block_h + 14
    draw.line([(PAD, rule_y), (PAD + 220, rule_y)], fill=AMBER_DIM, width=1)

    # Label directly beneath the rule: small mono tag.
    label_font = load_font(MONO, 16)
    draw.text(
        (PAD, rule_y + 14),
        "ESSAY · JAREDFOY.COM",
        fill=FG_DIM_BLOG,
        font=label_font,
        spacing=4,
    )

    # Bottom-left: inviting call in italic serif.
    read_font = load_font(SERIF_ITALIC, 20)
    draw.text(
        (PAD, H - PAD - 28),
        "Read the essay →",
        fill=FG_BLOG,
        font=read_font,
    )

    return img


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="output directory for PNGs")
    ap.add_argument("--only-missing", action="store_true",
                    help="skip slugs whose PNG already exists in --out")
    ap.add_argument("--force-slugs", default="",
                    help="comma-separated slugs to regenerate even when --only-missing is set")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    try:
        manifest = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"manifest parse error: {e}", file=sys.stderr)
        return 1

    force_slugs = {s.strip() for s in args.force_slugs.split(",") if s.strip()}

    sphere_cache: list[Image.Image | None] = []

    def sphere() -> Image.Image | None:
        if not sphere_cache:
            loaded = load_sphere()
            if loaded is None:
                print(f"warning: sphere image not found at {SPHERE_PATH}", file=sys.stderr)
            sphere_cache.append(loaded)
        return sphere_cache[0]

    written = 0
    skipped = 0
    for doc in manifest:
        slug = doc.get("slug")
        if not slug:
            continue
        out_path = os.path.join(args.out, f"{slug}.png")
        if args.only_missing and slug not in force_slugs and os.path.exists(out_path):
            skipped += 1
            continue
        title = doc.get("title") or "Untitled"
        doc_num = doc.get("doc_num")
        section = doc.get("section")
        try:
            if section == "blog":
                img = render_og_blog(title=title, sphere=sphere())
            else:
                img = render_og(title=title, doc_num=doc_num, section=section, sphere=sphere())
            img.save(out_path, "PNG", optimize=True)
            written += 1
        except Exception as e:  # noqa: BLE001
            print(f"failed {slug}: {e}", file=sys.stderr)

    if skipped:
        print(f"wrote {written} OG images (skipped {skipped} existing)")
    else:
        print(f"wrote {written} OG images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
