"""Still mock-ups of three end-card layouts, built from the same pixel pieces as make_endcard.py."""
import os
from PIL import Image, ImageDraw
import make_endcard as ec
W, H = ec.W, ec.H
def logo(cell):
    word = 'OVERSPAM'; tops = [ec.lerp(ec.CREAM, ec.PEACH, i/3) if i < 4 else ec.lerp(ec.PEACH, ec.ORANGE, (i-4)/3) for i in range(8)]
    ls = [ec.logo_letter(c, cell, tops[i]) for i, c in enumerate(word)]
    tw = sum(l.width for l in ls) - 3*cell*7
    img = Image.new('RGBA', (tw, ls[0].height), (0, 0, 0, 0)); x = 0
    for l in ls: img.alpha_composite(l, (x, 0)); x += l.width - 3*cell
    return img
def button(txt, px):
    t = ec.small_text(txt, px, ec.hexc('#FFF0D2')); bw, bh = t.width+16*px, t.height+8*px
    b = Image.new('RGBA', (bw+8, bh+8), (0, 0, 0, 0)); d = ImageDraw.Draw(b)
    d.rectangle([8, 8, bw+7, bh+7], fill=(0, 0, 0, 160))
    d.rectangle([0, 0, bw-1, bh-1], fill=ec.hexc('#1B2838')+(255,), outline=ec.hexc('#66C0F4')+(255,), width=px)
    b.alpha_composite(t, ((bw-t.width)//2, (bh-t.height)//2)); return b
def put(fr, im, y): fr.alpha_composite(im, ((W-im.width)//2, y))
bg = ec.background().convert('RGBA')
out = os.path.dirname(os.path.abspath(__file__))
# A: current layout + release line
fr = bg.copy(); put(fr, ec.small_text('3D SURVIVOR ROGUELITE · IN DEVELOPMENT', 4, ec.hexc('#F3E6D0')), 150)
put(fr, logo(26), 250); put(fr, ec.small_text('5 WORLDS. 12 HEROES.', 10, ec.hexc('#FFF0D2')), 640)
put(fr, ec.small_text('ONE RIDICULOUS RUN.', 10, ec.hexc('#FF7A3D')), 740); put(fr, button('WISHLIST NOW ON STEAM', 6), 860)
put(fr, ec.small_text('COMING SOON', 5, ec.hexc('#F3E6D0')), 990); fr.convert('RGB').save(os.path.join(out, 'variant_A_full.png'))
# B: big call to action, slogan above
fr = bg.copy(); put(fr, logo(22), 140); put(fr, ec.small_text('ONE RIDICULOUS RUN.', 9, ec.hexc('#FF7A3D')), 500)
put(fr, button('WISHLIST NOW ON STEAM', 10), 640); put(fr, ec.small_text('COMING SOON', 6, ec.hexc('#F3E6D0')), 870)
fr.convert('RGB').save(os.path.join(out, 'variant_B_big_button.png'))
# C: minimal, logo + button + date only
fr = bg.copy(); put(fr, logo(30), 300); put(fr, button('WISHLIST ON STEAM', 7), 720)
put(fr, ec.small_text('COMING SOON', 5, ec.hexc('#F3E6D0')), 870); fr.convert('RGB').save(os.path.join(out, 'variant_C_minimal.png'))
