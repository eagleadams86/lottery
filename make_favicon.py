#!/usr/bin/env python3
"""Draw favicon.ico — the same mark as the inline SVG icon in both pages.

The pages' icon is an inline SVG data URI, which every current browser prefers.
favicon.ico is the fallback: it's what a browser fetches from the site root on
its own, what older ones use, and what a bookmark or a search result shows. The
two have to be the same picture, so this draws the SVG's geometry with Pillow
rather than hand-editing a binary nobody can review in a diff.

    python3 make_favicon.py

**The mark is the native apps' icon.** It is a port of
`claude-lottery-ios/scripts/make_icon.py`, which is itself a render of the
Android adaptive icon in `claude-lottery-android` — a numbered ball on the
midnight field with its two drifting corner glows. The web, the iPhone and the
Android app are one product, and someone who has the app on their phone should
recognise the tab. **If the native icon changes, change this with it**; the
coordinates below are deliberately the SAME 108x108 viewport the Android
vectors use, so the two scripts can be read side by side.

Every colour here is a real theme-pack token (`--bg`, `--surface`,
`--surface-alt`, `--text-primary`, `--text-secondary`), inherited from the
native icon — this mark introduces no artwork tints of its own.

Both pages share the one icon; the calculator and the portfolio are two doors
onto the same thing.

Everything is drawn at 8x and reduced with Lanczos, which is what gives the
16px version clean edges.
"""

from PIL import Image, ImageDraw

# The mark, in the Android vectors' own 108x108 viewport.
BG = (10, 14, 26, 255)          # #0a0e1a — --bg, midnight's page
GLOW_TR = (18, 24, 41, 255)     # #121829 — --surface, the top-right drift
GLOW_BL = (27, 34, 56, 255)     # #1b2238 — --surface-alt, the bottom-left one
BALL = (231, 234, 246, 255)     # #e7eaf6 — --text-primary
SHADE = (170, 178, 208)         # #aab2d0 — --text-secondary, the shaded band
SHADE_ALPHA = 0.45

BALL_C = (54, 54, 26)           # centre x, y, radius
BAND_C = (61, 62, 31)           # the shading circle, clipped to the ball
RING_R = 15.5                   # the classic inner ring
RING_W = 2.5
# The numeral 1 — the Android path with its group transform (scale 0.62 about
# 54,54 then translateX 3) already applied, exactly as the iOS script does it.
NUMERAL = [(54.024, 62.68), (54.024, 48.792), (49.808, 51.644), (49.808, 47.924),
           (54.396, 44.824), (57.744, 44.824), (57.744, 62.68)]

VIEW = 108                      # the viewport the coordinates above are in
SCALE = 8                       # supersample, then reduce
SIZES = [16, 32, 48, 64, 128, 256]

F = SCALE                       # one viewport unit -> F pixels on the canvas


def circle(d, cx, cy, r, **kw):
    d.ellipse([(cx - r) * F, (cy - r) * F, (cx + r) * F, (cy + r) * F], **kw)


def build():
    n = VIEW * SCALE
    img = Image.new('RGBA', (n, n), BG)
    d = ImageDraw.Draw(img)
    circle(d, 82, 18, 44, fill=GLOW_TR)
    circle(d, 18, 94, 36, fill=GLOW_BL)

    # The ball, built on its own layer so the shaded band can be clipped to it.
    ball = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    bd = ImageDraw.Draw(ball)
    bx, by, br = BALL_C
    circle(bd, bx, by, br, fill=BALL)

    band = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    circle(ImageDraw.Draw(band), *BAND_C,
           fill=SHADE + (int(SHADE_ALPHA * 255),))
    clip = Image.new('L', (n, n), 0)
    circle(ImageDraw.Draw(clip), bx, by, br, fill=255)
    ball = Image.alpha_composite(
        ball, Image.composite(band, Image.new('RGBA', (n, n), (0, 0, 0, 0)), clip))

    bd = ImageDraw.Draw(ball)
    circle(bd, bx, by, RING_R, fill=BALL, outline=BG,
           width=max(1, round(RING_W * F)))
    bd.polygon([(x * F, y * F) for x, y in NUMERAL], fill=BG)

    img = Image.alpha_composite(img, ball)

    # Round the corners with an alpha mask. iOS applies its own corner mask, so
    # the native icon is drawn square; this is the file that ends up on a
    # bookmarks bar, where nothing masks it and a square tile reads as a bug.
    # The radius is the family's 14-in-64, scaled to this viewport.
    mask = Image.new('L', (n, n), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, n - 1, n - 1], radius=round(14 / 64 * VIEW) * SCALE, fill=255)
    img.putalpha(mask)
    return img


def main():
    art = build()
    frames = [art.resize((s, s), Image.LANCZOS) for s in SIZES]
    frames[-1].save('favicon.ico', format='ICO',
                    sizes=[(s, s) for s in SIZES])
    print('favicon.ico written at ' + ', '.join(f'{s}px' for s in SIZES))
    print('Now bump the ?v= on every favicon.ico reference — both pages carry '
          'two apiece — browsers cache an icon for a long time and will keep '
          'showing the old one otherwise.')


if __name__ == '__main__':
    main()
