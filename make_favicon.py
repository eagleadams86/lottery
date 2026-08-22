#!/usr/bin/env python3
"""Draw favicon.ico — the same mark as the inline SVG icon in both pages.

The pages' icon is an inline SVG data URI, which every current browser prefers.
favicon.ico is the fallback: it's what a browser fetches from the site root on
its own, what older ones use, and what a bookmark or a search result shows. The
two have to be the same picture, so this draws the SVG's geometry with Pillow
rather than hand-editing a binary nobody can review in a diff.

    python3 make_favicon.py

**The mark is the native apps' ball, in the app family's blue.** The GEOMETRY
is a port of `claude-lottery-ios/scripts/make_icon.py`, which is itself a
render of the Android adaptive icon in `claude-lottery-android` — a numbered
ball on the midnight field with its two drifting corner glows. The web, the
iPhone and the Android app are one product, so someone who has the app on their
phone should recognise the tab. **If the native icon's shapes change, change
these with them**; the coordinates below are deliberately the SAME 108x108
viewport the Android vectors use, so the two scripts can be read side by side.

**The COLOUR is where the web deliberately parts company.** The native ball is
near-white (`--text-primary`) with a `--text-secondary` band at 45%; here it is
the app family's two accent tones — `#a5b4fc` for the body, `--accent` for the
shaded crescent — so it sits beside Money Map, PAPTrack, Sprint Predictability,
Flow Metrics and Golf Handicap as one of a set. The band is FLAT rather than
translucent because the two accent tones are close together by design: at the
native icon's 45% the crescent all but vanished, where 45% of a much darker
`--text-secondary` gave the white ball a clear one. So: same ball, family
palette. The phone icons still wear the pale one; changing those means a new
build and, for iOS, a new submission, so they are deliberately left alone.

Everything except `#a5b4fc` is a real theme-pack token (`--bg`, `--surface`,
`--surface-alt`, `--accent`). That one is the lighter artwork tint every other
mark in the family uses — copied, never re-picked, so nothing new enters the
pack.

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
BALL = (165, 180, 252, 255)     # #a5b4fc — the light accent, as every other mark
SHADE = (129, 140, 248)         # #818cf8 — --accent, the shaded band
SHADE_ALPHA = 1.0               # flat, not the native icon's 45% (see below)

BALL_C = (54, 54, 26)           # centre x, y, radius
BAND_C = (61, 62, 31)           # the shading circle, clipped to the ball
RING_R = 15.5                   # the classic inner ring
RING_W = 2.5
# The numeral 1 — the Android path with its group transform (scale 0.62 about
# 54,54 then translateX 3) already applied, exactly as the iOS script does it.
NUMERAL = [(54.024, 62.68), (54.024, 48.792), (49.808, 51.644), (49.808, 47.924),
           (54.396, 44.824), (57.744, 44.824), (57.744, 62.68)]

# Every ball coordinate above is the NATIVE one, kept that way so this file and
# the iOS script still read side by side. This single factor is the second place
# the web parts company from the phone icons, after the colour: it blows the
# whole ball up about its own centre (54,54), background glows untouched.
#
# A home-screen icon is looked at whole and can afford air around its subject;
# a favicon is 16px of tab furniture beside five siblings, and at the native 26
# the ball covered 48% of the tile where the rest of the family's marks cover
# 55-70%. It read as the small one in the row. 34.5 puts it at 64%.
BALL_SCALE = 34.5 / 26

VIEW = 108                      # the viewport the coordinates above are in
SCALE = 8                       # supersample, then reduce
SIZES = [16, 32, 48, 64, 128, 256]

# The INSTALL icons, named by manifest.webmanifest and cached by sw.js. Renaming
# one means editing both of those files as well as this line.
#
# 192 and 512 are the two sizes Chrome asks for when it offers "Install app" on a
# Mac or a PC. They are the same drawing as favicon.ico, ROUNDED: nothing masks a
# `purpose: any` icon, so the corners have to be in the file.
PWA_ICONS = [(192, 'icon-192.png'), (512, 'icon-512.png')]

# The maskable one is the same drawing with SQUARE corners, and that is the only
# difference. A launcher crops it to whatever outline it likes — a circle on a lot
# of Android ones — so anything in the corners is thrown away and rounding it as
# well would round a picture that is about to be rounded again.
#
# Nothing has to move for the crop, and that is worth stating rather than leaving
# to be rediscovered: the ball is already centred on the tile at (54,54), and
# `BALL_SCALE` puts its radius at 34.5 of this 108 viewport. The circular safe
# zone is a disc of 80% of the width — radius 43.2 here — so the ball, its
# crescent and its numeral all sit inside it with room to spare. Only the two
# corner glows are cropped, and they are background weather. If BALL_SCALE is ever
# raised past 43.2, this stops being true and the maskable icon needs its own
# smaller scale.
MASKABLE = (512, 'icon-512-maskable.png')

F = SCALE                       # one viewport unit -> F pixels on the canvas


def sc(v):
    """A length, scaled up with the ball."""
    return v * BALL_SCALE


def pt(x, y):
    """A point, scaled about the ball's own centre."""
    cx, cy, _ = BALL_C
    return cx + (x - cx) * BALL_SCALE, cy + (y - cy) * BALL_SCALE


def circle(d, cx, cy, r, **kw):
    d.ellipse([(cx - r) * F, (cy - r) * F, (cx + r) * F, (cy + r) * F], **kw)


def build(rounded=True):
    n = VIEW * SCALE
    img = Image.new('RGBA', (n, n), BG)
    d = ImageDraw.Draw(img)
    circle(d, 82, 18, 44, fill=GLOW_TR)
    circle(d, 18, 94, 36, fill=GLOW_BL)

    # The ball, built on its own layer so the shaded band can be clipped to it.
    # Everything from here to the composite goes through sc()/pt().
    ball = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    bd = ImageDraw.Draw(ball)
    bx, by, br = BALL_C[0], BALL_C[1], sc(BALL_C[2])
    circle(bd, bx, by, br, fill=BALL)

    band = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    bandx, bandy = pt(BAND_C[0], BAND_C[1])
    circle(ImageDraw.Draw(band), bandx, bandy, sc(BAND_C[2]),
           fill=SHADE + (int(SHADE_ALPHA * 255),))
    clip = Image.new('L', (n, n), 0)
    circle(ImageDraw.Draw(clip), bx, by, br, fill=255)
    ball = Image.alpha_composite(
        ball, Image.composite(band, Image.new('RGBA', (n, n), (0, 0, 0, 0)), clip))

    bd = ImageDraw.Draw(ball)
    circle(bd, bx, by, sc(RING_R), fill=BALL, outline=BG,
           width=max(1, round(sc(RING_W) * F)))
    bd.polygon([(x * F, y * F) for x, y in (pt(*p) for p in NUMERAL)], fill=BG)

    img = Image.alpha_composite(img, ball)

    # Round the corners with an alpha mask. iOS applies its own corner mask, so
    # the native icon is drawn square; this is the file that ends up on a
    # bookmarks bar, where nothing masks it and a square tile reads as a bug.
    # The radius is the family's 14-in-64, scaled to this viewport.
    if not rounded:
        # Full bleed, for the maskable icon — see MASKABLE. The glows are drawn to
        # overflow the tile, so without the mask they need cutting back to it.
        return img.convert('RGB')
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

    for size, name in PWA_ICONS:
        art.resize((size, size), Image.LANCZOS).save(name, format='PNG',
                                                     optimize=True)
        print(f'{name} written (rounded — nothing masks a `purpose: any` icon)')

    size, name = MASKABLE
    build(rounded=False).resize((size, size), Image.LANCZOS).save(
        name, format='PNG', optimize=True)
    print(f'{name} written (full bleed — the launcher supplies the shape)')

    print('Now bump the ?v= on every favicon.ico reference — the three pages '
          'carry two apiece — browsers cache an icon for a long time and will '
          'keep showing the old one otherwise. The manifest icons are versioned '
          "by sw.js's CACHE constant instead; bump that too.")


if __name__ == '__main__':
    main()
