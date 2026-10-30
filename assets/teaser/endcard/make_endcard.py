"""OVERSPAM end card for the Steam teaser: pixel logo drop-in, typed taglines, wishlist button.
Renders a 1920x1080 30 fps MP4 over a darkened game background, plus a transparent MOV for overlaying."""
import math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
BG = os.path.join(HERE, '..', 'blender-blockout', 'revision-06', 'final_7-22', '02-meadow.png')
FRAMES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'frames')
W, H, FPS, DUR = 1920, 1080, 30, 6.5

def ss(a, b, x):
    u = max(0., min(1., (x - a) / (b - a))); return u * u * (3 - 2 * u)
def ease_back(u, k=1.9):
    u = max(0., min(1., u)); u -= 1; return 1 + u * u * ((k + 1) * u + k)
def hexc(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def lerp(a, b, u): return tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))

CREAM, PEACH, ORANGE = hexc('#FFF0D2'), hexc('#FFC27A'), hexc('#FF6A3A')
MAROON, MAROON_D, OUTLINE = hexc('#6E1A3A'), hexc('#4E1029'), hexc('#160A12')

# Chunky logo glyphs, '#' = filled cell.
LOGO = {
 'O': ["######", "######", "##..##", "##..##", "##..##", "##..##", "######", "######"],
 'V': ["##..##", "##..##", "##..##", "##..##", "##..##", ".####.", ".####.", "..##.."],
 'E': ["######", "######", "##....", "#####.", "#####.", "##....", "######", "######"],
 'R': ["#####.", "######", "##..##", "######", "#####.", "##.##.", "##..##", "##..##"],
 'S': ["######", "######", "##....", "######", "######", "....##", "######", "######"],
 'P': ["#####.", "######", "##..##", "######", "#####.", "##....", "##....", "##...."],
 'A': [".####.", "######", "##..##", "##..##", "######", "######", "##..##", "##..##"],
 'M': ["##...##", "###.###", "#######", "##.#.##", "##...##", "##...##", "##...##", "##...##"],
}
# 5x7 pixel font for the small lines.
SMALL = {
 'A': ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
 'C': ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
 'D': ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
 'E': ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
 'G': ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
 'H': ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
 'I': ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
 'L': ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
 'M': ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
 'N': ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
 'O': ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
 'P': ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
 'R': ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
 'S': ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
 'T': ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
 'U': ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
 'V': ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
 'W': ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
 '1': ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
 '2': ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
 '3': ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
 '5': ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
 '.': ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
 '·': ["00000", "00000", "00000", "01100", "01100", "00000", "00000"],
 ' ': ["00000"] * 7,
}

def logo_letter(ch, cell, top):
    """One logo letter as RGBA: banded fill, 1-cell dark outline, drop shadow."""
    g = LOGO[ch]; gw, gh = len(g[0]), len(g)
    pad = 2; img = Image.new('RGBA', ((gw + pad * 2) * cell, (gh + pad * 2) * cell), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    filled = {(x, y) for y, row in enumerate(g) for x, c in enumerate(row) if c == '#'}
    outline = {(x + dx, y + dy) for x, y in filled for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - filled
    def box(x, y, col):
        X, Y = (x + pad) * cell, (y + pad) * cell; d.rectangle([X, Y, X + cell - 1, Y + cell - 1], fill=col + (255,))
    for x, y in outline: box(x + 1, y + 1, (0, 0, 0))  # shadow
    for x, y in outline: box(x, y, OUTLINE)
    for x, y in filled:
        if y <= 2: col = lerp(top, CREAM, .25 if y == 0 else 0)
        elif y == 3: col = lerp(top, MAROON, .35)
        else: col = MAROON_D if y % 2 == 0 else MAROON
        box(x, y, col)
    return img

def small_text(s, px, col, outline=OUTLINE):
    w = sum(6 for _ in s) - 1
    img = Image.new('RGBA', ((w + 2) * px, 9 * px), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for pass_, c in [(1, outline), (0, col)]:
        x0 = 0
        for ch in s:
            g = SMALL.get(ch, SMALL[' '])
            for y, row in enumerate(g):
                for x, v in enumerate(row):
                    if v == '1':
                        for dx, dy in ([(0, 0), (1, 0), (0, 1), (1, 1), (2, 1), (1, 2), (2, 2), (2, 0), (0, 2)] if pass_ else [(1, 1)]):
                            X, Y = (x0 + x + dx) * px - (px if pass_ else 0) + px, (y + dy) * px - (px if pass_ else 0) + px
                            if pass_: X -= px; Y -= px
                            d.rectangle([X, Y, X + px - 1, Y + px - 1], fill=c + (255,))
            x0 += 6
    return img

def background():
    bg = Image.open(BG).convert('RGB').resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))
    a = np.asarray(bg).astype(np.float32) * .38
    yy, xx = np.mgrid[0:H, 0:W]; r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    a *= np.clip(1.15 - .55 * r, 0, 1)[..., None]
    a[::4] *= .82  # scanlines like the site banner
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def main():
    os.makedirs(FRAMES, exist_ok=True)
    bg = background()
    cell = 26; word = 'OVERSPAM'; gap = cell
    tops = [lerp(CREAM, PEACH, i / 3) if i < 4 else lerp(PEACH, ORANGE, (i - 4) / 3) for i in range(len(word))]
    letters = [logo_letter(c, cell, tops[i]) for i, c in enumerate(word)]
    total = sum(l.width for l in letters) - 4 * cell * (len(letters) - 1) + gap * (len(letters) - 1)
    lx0, ly = (W - total) // 2, 250
    xs = []; x = lx0
    for l in letters: xs.append(x); x += l.width - 4 * cell + gap
    tag = small_text('3D SURVIVOR ROGUELITE · IN DEVELOPMENT', 4, hexc('#F3E6D0'))
    line1 = '5 WORLDS. 12 HEROES.'; line2 = 'ONE RIDICULOUS RUN.'
    btn_txt = small_text('WISHLIST NOW ON STEAM', 6, hexc('#FFF0D2'))
    for f in range(int(DUR * FPS)):
        t = f / FPS
        frame = Image.new('RGB', (W, H), (0, 0, 0))
        z = 1 + .03 * t / DUR; bw, bh = int(W * z), int(H * z)
        frame.paste(bg.resize((bw, bh)), (-(bw - W) // 2, -(bh - H) // 2))
        frame = Image.blend(Image.new('RGB', (W, H)), frame, ss(0, .35, t)).convert('RGBA')
        shake = 0
        for i, l in enumerate(letters):
            t0 = .25 + i * .1; u = (t - t0) / .45
            if u <= 0: continue
            y = ly - (1 - ease_back(u)) * 420 + math.sin(t * 2.2 + i * .6) * 4 * ss(1.6, 2.2, t)
            frame.alpha_composite(l, (xs[i], int(y)))
            if 0 < t - (t0 + .45) < .08: shake = 8
        # shimmer sweep across the logo
        if 3.6 < t < 4.6:
            sx = lx0 - 200 + (t - 3.6) * (total + 400)
            band = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(band)
            bd.polygon([(sx, ly + 40), (sx + 70, ly + 40), (sx - 60, ly + 340), (sx - 130, ly + 340)], fill=(255, 255, 255, 70))
            frame.alpha_composite(band)
        frame.alpha_composite(tag, ((W - tag.width) // 2, 150)) if t > 1.2 else None
        if t < 1.5: tag_a = 0
        for k, (txt, col, y0, ts) in enumerate([(line1, hexc('#FFF0D2'), 640, 1.5), (line2, hexc('#FF7A3D'), 740, 2.25)]):
            n = int(max(0, min(len(txt), (t - ts) / .035)))
            if n: im = small_text(txt[:n], 10, col); full = small_text(txt, 10, col); frame.alpha_composite(im, ((W - full.width) // 2, y0))
        if t > 3.2:
            s = ease_back((t - 3.2) / .35, 2.5) * (1 + .03 * math.sin((t - 3.6) * 5) * ss(3.6, 4, t))
            bwid, bht = int((btn_txt.width + 80) * s), int((btn_txt.height + 44) * s)
            if bwid > 4 and bht > 4:
                btn = Image.new('RGBA', (bwid + 12, bht + 12), (0, 0, 0, 0)); bd = ImageDraw.Draw(btn)
                bd.rectangle([6, 6, bwid + 5, bht + 5], fill=(0, 0, 0, 160))
                bd.rectangle([0, 0, bwid - 1, bht - 1], fill=hexc('#1B2838') + (255,), outline=hexc('#66C0F4') + (255,), width=max(1, int(5 * s)))
                tt = btn_txt.resize((max(1, int(btn_txt.width * s)), max(1, int(btn_txt.height * s))), Image.NEAREST)
                btn.alpha_composite(tt, ((bwid - tt.width) // 2, (bht - tt.height) // 2))
                frame.alpha_composite(btn, ((W - bwid) // 2, 900 - bht // 2))
        if shake:
            frame = frame.transform(frame.size, Image.AFFINE, (1, 0, shake * (1 if f % 2 else -1), 0, 1, 0))
        frame.convert('RGB').save(os.path.join(FRAMES, 'f_%04d.png' % f))

if __name__ == '__main__':
    main()
