#!/usr/bin/env python3
"""Draw favicon.ico — the same mark as the inline SVG icon in both pages.

The pages' icon is an inline SVG data URI, which every current browser prefers.
favicon.ico is the fallback: it's what a browser fetches from the site root on
its own, what older ones use, and what a bookmark or a search result shows. The
two have to be the same picture, so this draws the SVG's geometry with Pillow
rather than hand-editing a binary nobody can review in a diff.

    python3 make_favicon.py

The mark is three drawn balls — the one image that says "lottery" at 16 pixels.
Solid discs rather than outlined ones on purpose: a ring this small turns to
mush, a filled shape survives. They sit on the family tile Money Map, PAPTrack,
Sprint Predictability and Flow Metrics all use: the midnight page as a rounded
square, the soft disc in the bottom-left corner, and the accent gradient — so
the balls come out darkest at the bottom left and lightest at the top, which is
what gives the cluster its depth.

Both pages share the one icon; the calculator and the portfolio are two doors
onto the same thing.

Everything is drawn at 8x and reduced with Lanczos, which is what gives the
16px version clean edges. Keep the shapes here in step with the SVG in the two
pages if that ever changes.
"""

from PIL import Image, ImageDraw

# The mark, in the SVG's own 64x64 coordinates.
BG = (10, 14, 26, 255)          # #0a0e1a — midnight, the default theme's page
GLOW = (20, 28, 51, 255)        # #141c33 — the darker disc in the corner
GRAD_FROM = (129, 140, 248)     # #818cf8 — midnight's accent
GRAD_TO = (165, 180, 252)       # #a5b4fc
GRAD_AXIS = ((10, 52), (54, 12))                  # where the gradient runs

BALLS = [(20, 41), (44, 41), (32, 20)]            # centres, drawn back to front
BALL_R = 9                      # the gaps between them are ~6, which is what
                                # keeps three separate balls at 16px

SCALE = 8                       # supersample, then reduce
SIZES = [16, 32, 48, 64, 128, 256]


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def gradient_at(point):
    """Colour for a point, projected onto the gradient's axis."""
    (x0, y0), (x1, y1) = GRAD_AXIS
    dx, dy = x1 - x0, y1 - y0
    span = dx * dx + dy * dy
    t = ((point[0] - x0) * dx + (point[1] - y0) * dy) / span
    return lerp(GRAD_FROM, GRAD_TO, min(1.0, max(0.0, t)))


def build():
    n = 64 * SCALE
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, n, n], fill=BG)
    # the soft disc bottom-left, the way the SVG has it
    d.ellipse([(14 - 20) * SCALE, (52 - 20) * SCALE,
               (14 + 20) * SCALE, (52 + 20) * SCALE], fill=GLOW)

    # Each ball takes its colour from where its CENTRE falls on the gradient
    # axis, so a ball is one flat colour and the three read as three depths.
    # The SVG does the same, by giving each circle its own solid fill.
    for x, y in BALLS:
        d.ellipse([(x - BALL_R) * SCALE, (y - BALL_R) * SCALE,
                   (x + BALL_R) * SCALE, (y + BALL_R) * SCALE],
                  fill=gradient_at((x, y)) + (255,))

    # Round the corners with an alpha mask. The SVG leaves the disc square at
    # the edges; an icon reads better rounded, and this is the file that ends
    # up on a bookmarks bar.
    mask = Image.new('L', (n, n), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, n - 1, n - 1],
                                           radius=14 * SCALE, fill=255)
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
