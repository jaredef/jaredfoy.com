#!/usr/bin/env python3
"""
Favicon generator for jaredfoy.com.

Renders the "JF" mark (white type on Google's orange letter-card background, RGB
255,136,0 — preserved as the de-facto brand mark since this was the favicon
identity Google's placeholder system has been propagating for the site) into the
full set of icon sizes browsers and platforms expect.

Outputs to --out:
    favicon.ico              (multi-resolution: 16, 32, 48)
    favicon-16x16.png
    favicon-32x32.png
    favicon-48x48.png
    favicon-192x192.png
    favicon-512x512.png
    apple-touch-icon.png     (180x180)
    site.webmanifest         (Android home-screen install)

Usage:
    python3 generate-favicon.py --out /path/to/public
"""

import argparse
import json
import os

from PIL import Image, ImageDraw, ImageFont


ORANGE = (255, 136, 0)
WHITE = (255, 255, 255)

MONO_BOLD_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def find_font() -> str:
    for p in MONO_BOLD_PATHS:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("no usable bold font found")


def render(size: int, font_path: str, corner_radius_ratio: float = 0.18) -> Image.Image:
    """Render a single square icon at the given pixel size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = max(2, int(size * corner_radius_ratio))
    # Rounded square background
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=ORANGE)

    # Letter mark — sized to ~62% of the icon so it has visual weight without crowding.
    target_h = int(size * 0.62)
    # Binary-search-ish font sizing to hit target visual height for "JF" glyphs
    fs = target_h
    font = ImageFont.truetype(font_path, fs)
    text = "JF"
    while fs > 6:
        font = ImageFont.truetype(font_path, fs)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        if tw <= size * 0.78 and th <= target_h:
            break
        fs -= 1

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Center, accounting for bbox offset (text rendering origin isn't always 0)
    x = (size - tw) // 2 - bbox[0]
    # Slight upward bias so the J descender doesn't crowd the bottom edge
    y = (size - th) // 2 - bbox[1] - max(1, size // 32)
    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="output directory (typically app/public)")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    font_path = find_font()

    sizes = [16, 32, 48, 192, 512]
    rendered: dict[int, Image.Image] = {}
    for size in sizes:
        img = render(size, font_path)
        rendered[size] = img
        img.save(os.path.join(args.out, f"favicon-{size}x{size}.png"), "PNG", optimize=True)

    # Apple touch icon at 180x180 (rounded by iOS itself, so we render solid)
    apple = render(180, font_path, corner_radius_ratio=0.0)
    apple.save(os.path.join(args.out, "apple-touch-icon.png"), "PNG", optimize=True)

    # Multi-resolution .ico containing 16, 32, 48
    ico_imgs = [rendered[16], rendered[32], rendered[48]]
    rendered[48].save(
        os.path.join(args.out, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[rendered[16], rendered[32]],
    )

    # Web manifest (PWA / Android home screen install)
    manifest = {
        "name": "RESOLVE — Jared Foy",
        "short_name": "RESOLVE",
        "icons": [
            {"src": "/favicon-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/favicon-512x512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "theme_color": "#0a0a0f",
        "background_color": "#0a0a0f",
        "display": "standalone",
        "start_url": "/",
    }
    with open(os.path.join(args.out, "site.webmanifest"), "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"wrote favicon set ({len(sizes)} PNGs + apple-touch + .ico + manifest) → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
