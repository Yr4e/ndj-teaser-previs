"""Синтез мягких звуков «под движение» (foley для моушен-графики).

Запуск:  python scripts/synth_sfx.py
Результат: public/sfx/foley/*.mp3 + public/sfx/foley/index.html (прослушивание и «когда применять»).
Все звуки создаются кодом, значит свободны от авторских прав.
Каждый звук сделан так, чтобы совпадать с типом движения (растягивается, лопается, скользит и т. д.).
"""
import json
import math
import os
import subprocess
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx", "foley")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

CATALOG = []  # {name, group, use}


def t_axis(d):
    return np.arange(int(SR * d)) / SR


def env_ad(n, attack=0.004, decay=None, curve=3.0):
    """Атака + экспоненциальный спад."""
    t = np.arange(n) / SR
    a = np.minimum(1.0, t / max(attack, 1e-4))
    d = np.exp(-curve * t / (decay if decay else n / SR))
    return a * d


def fade(x, ms_in=3, ms_out=12):
    n_in, n_out = int(SR * ms_in / 1000), int(SR * ms_out / 1000)
    x = x.copy()
    x[:n_in] *= np.linspace(0, 1, n_in)
    x[-n_out:] *= np.linspace(1, 0, n_out)
    return x


def sine_glide(d, f0, f1, curve="exp"):
    t = t_axis(d)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (t / d)
    else:
        f = f0 + (f1 - f0) * (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise_band(d, f0, f1, width=0.5):
    """Шум, пропущенный через полосовой фильтр, центр которого плывёт от f0 до f1 (FFT по блокам)."""
    n = int(SR * d)
    N = 1024
    hop = N // 2
    win = np.hanning(N)
    src = rng.standard_normal(n + N)
    out = np.zeros(n + N)
    for i in range(0, n, hop):
        c = f0 * (f1 / f0) ** (i / max(n, 1))
        seg = src[i : i + N] * win
        S = np.fft.rfft(seg)
        fr = np.fft.rfftfreq(N, 1 / SR)
        gain = np.exp(-0.5 * ((np.log2(np.maximum(fr, 1) / c)) / width) ** 2)
        out[i : i + N] += np.fft.irfft(S * gain, N) * win
    return out[:n]


def lowpass(x, cutoff):
    a = math.exp(-2 * math.pi * cutoff / SR)
    y = np.zeros_like(x)
    prev = 0.0
    for i, v in enumerate(x):
        prev = (1 - a) * v + a * prev
        y[i] = prev
    return y


def pan(x, p):
    """p от -1 (лево) до 1 (право): постоянная мощность."""
    ang = (p + 1) * math.pi / 4
    return np.stack([x * math.cos(ang), x * math.sin(ang)], axis=1)


def sweep_pan(x, p0, p1):
    n = len(x)
    p = np.linspace(p0, p1, n)
    ang = (p + 1) * math.pi / 4
    return np.stack([x * np.cos(ang), x * np.sin(ang)], axis=1)


def save(name, x, group, use, peak=0.7):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    m = np.max(np.abs(x)) or 1
    x = x / m * peak
    for ch in range(2):
        x[:, ch] = fade(x[:, ch])
    wav = os.path.join(OUT, name + ".wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", wav, "-codec:a", "libmp3lame", "-q:a", "2", os.path.join(OUT, name + ".mp3")], check=True)
    os.remove(wav)
    CATALOG.append({"name": name, "group": group, "use": use, "dur": round(len(x) / SR, 2)})


# ---------- звуки ----------
# POP: пузырь лопнул, элемент появился
for i, (f0, f1, d) in enumerate([(700, 190, 0.11), (900, 240, 0.10), (520, 150, 0.13)], 1):
    x = sine_glide(d, f0, f1) * env_ad(int(SR * d), 0.002, d, 5.5)
    x += 0.25 * noise_band(d, 2500, 1200, 0.8)[: len(x)] * env_ad(len(x), 0.001, 0.02, 6)
    save(f"pop_soft_{i}", x, "pop", "Элемент появился / лопнул пузырь / слово выскочило")
for i, (f0, f1, d) in enumerate([(280, 820, 0.12), (350, 1000, 0.10)], 1):
    x = sine_glide(d, f0, f1) * env_ad(int(SR * d), 0.003, d, 4)
    save(f"pop_bubble_{i}", x, "pop", "Пузырь всплыл (подъём тона), мягкое появление вверх")

# STRETCH: резина тянется (тон ползёт вверх с лёгкой дрожью)
for name, d, f0, f1 in [("stretch_s", 0.35, 200, 520), ("stretch_m", 0.6, 180, 620), ("stretch_l", 1.0, 160, 760)]:
    t = t_axis(d)
    vib = 1 + 0.03 * np.sin(2 * np.pi * 7 * t)
    f = f0 * (f1 / f0) ** (t / d) * vib
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    e = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.08)
    save(name, x * e, "stretch", "Объект растягивается (подгони длительность под растяжение)")
# SNAP BACK: резинка отпущена, затухающая «пружина»
for i, f in enumerate([520, 640], 1):
    d = 0.5
    t = t_axis(d)
    pitch = f * (0.35 + 0.65 * np.exp(-t * 18)) * (1 + 0.18 * np.exp(-t * 7) * np.sin(2 * np.pi * 13 * t))
    x = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * env_ad(len(t), 0.002, d, 6)
    save(f"snapback_{i}", x, "stretch", "Резинка отпущена / предмет вернулся на место с «пружиной»")
# SQUISH: сжатие (тон вниз)
for i, (f0, f1, d) in enumerate([(420, 150, 0.22), (360, 120, 0.3)], 1):
    x = sine_glide(d, f0, f1) * env_ad(int(SR * d), 0.01, d, 3.5)
    save(f"squish_{i}", x, "stretch", "Объект сжимается / проседает")
# BOING: подпрыгнул
d = 0.7
t = t_axis(d)
pitch = 300 * (1 + 0.5 * np.exp(-t * 7) * np.sin(2 * np.pi * 12 * t))
save("boing", np.sin(2 * np.pi * np.cumsum(pitch) / SR) * env_ad(len(t), 0.003, d, 4.5), "stretch", "Подпрыгнул, шуточное пружинение")

# SWISH / WHOOSH: движение по экрану с панорамой (слева направо и обратно)
for name, d, f0, f1, w in [("swish_s", 0.25, 700, 3800, 0.9), ("swish_m", 0.45, 500, 3200, 0.9), ("whoosh_l", 0.85, 350, 2600, 1.0)]:
    n = noise_band(d, f0, f1, w)
    t = t_axis(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    for tag, a, b in [("lr", -0.8, 0.8), ("rl", 0.8, -0.8)]:
        save(f"{name}_{tag}", sweep_pan(n * e, a, b), "swish", "Объект проносится по экрану (lr: слева направо, rl: справа налево)", peak=0.55)
# вверх/вниз
for name, a, b in [("whoosh_up", 300, 3000), ("whoosh_down", 3000, 300)]:
    d = 0.5
    n = noise_band(d, a, b, 0.9)
    t = t_axis(d)
    save(name, n * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.4, "swish", "Объект летит вверх / падает вниз по экрану", peak=0.55)

# SLAM SOFT / THUMP: мягкий удар (приземлился)
for i, (f0, f1, d) in enumerate([(140, 55, 0.22), (110, 48, 0.28)], 1):
    x = sine_glide(d, f0, f1) * env_ad(int(SR * d), 0.004, d, 4.5)
    save(f"slam_soft_{i}", x, "impact", "Слово/плита приземлилась мягко (без резкого удара)")
d = 0.35
x = sine_glide(0.18, 120, 55) * env_ad(int(SR * 0.18), 0.004, 0.18, 5)
x = np.pad(x, (0, int(SR * d) - len(x)))
b2 = sine_glide(0.1, 150, 80) * env_ad(int(SR * 0.1), 0.003, 0.1, 5) * 0.5
x[int(SR * 0.17) : int(SR * 0.17) + len(b2)] += b2
save("drop_in", x, "impact", "Предмет упал и чуть подпрыгнул")

# TICK / CLICK / KEYS
for i, f in enumerate([1800, 2400, 3000], 1):
    d = 0.05
    x = np.sin(2 * np.pi * f * t_axis(d)) * env_ad(int(SR * d), 0.0008, 0.018, 6)
    x += 0.4 * noise_band(d, 4000, 2500, 1.0)[: len(x)] * env_ad(len(x), 0.0005, 0.01, 6)
    save(f"tick_{i}", x, "tick", "Мелкий акцент: буква, слово, шаг счётчика", peak=0.5)
d = 0.06
x = noise_band(d, 3500, 2000, 0.8) * env_ad(int(SR * d), 0.0006, 0.015, 7)
save("click_soft", x, "tick", "Мягкий щелчок мыши / нажатие кнопки", peak=0.55)
for i, f in enumerate([180, 210, 160], 1):
    d = 0.07
    x = sine_glide(d, f * 1.4, f) * env_ad(int(SR * d), 0.001, 0.025, 6)
    x += 0.5 * noise_band(d, 3000, 1800, 0.9) * env_ad(int(SR * d), 0.0005, 0.012, 7)
    save(f"key_tap_{i}", x, "tick", "Печать текста: клавиша", peak=0.5)
# счётчик: тики с нарастающим тоном
for i in range(8):
    f = 900 * (2 ** (i / 12))
    d = 0.06
    x = np.sin(2 * np.pi * f * t_axis(d)) * env_ad(int(SR * d), 0.001, 0.02, 6)
    save(f"count_tick_{i}", x, "count", "Счётчик набирает значение: брать по порядку 0..7, тон растёт", peak=0.45)

# TOGGLE
for name, a, b in [("toggle_on", 420, 760), ("toggle_off", 760, 420)]:
    d1 = 0.05
    x1 = sine_glide(d1, a, a * 1.08) * env_ad(int(SR * d1), 0.002, d1, 5)
    x2 = sine_glide(0.09, b, b * 1.04) * env_ad(int(SR * 0.09), 0.002, 0.09, 5)
    x = np.concatenate([x1, np.zeros(int(SR * 0.012)), x2])
    save(name, x, "ui", "Переключатель щёлкнул (on — вверх, off — вниз)", peak=0.55)

# CHIMES
def chime(freqs, step, d=0.9):
    n = int(SR * d)
    x = np.zeros(n)
    for k, f in enumerate(freqs):
        s = int(SR * step * k)
        seg = (np.sin(2 * np.pi * f * t_axis(d)[: n - s]) + 0.3 * np.sin(4 * np.pi * f * t_axis(d)[: n - s])) * env_ad(n - s, 0.003, d * 0.7, 5)
        x[s:] += seg
    return x


save("chime_soft", chime([784, 988, 1175], 0.07), "ui", "Готово / принято (мягкий восходящий)", peak=0.5)
save("chime_done", chime([523, 659, 784, 1047], 0.085, 1.1), "ui", "Финал, всё применено", peak=0.5)
save("wrong_soft", chime([392, 311], 0.12, 0.7), "ui", "Не то / ошибка в квизе (мягкий нисходящий)", peak=0.5)
save("answer_reveal", chime([659, 880], 0.1, 0.8), "ui", "Правильный ответ показан", peak=0.55)

# SPARKLE: конфетти
x = np.zeros(int(SR * 0.8))
for _ in range(14):
    s = int(rng.uniform(0, 0.5) * SR)
    f = rng.uniform(2200, 5200)
    seg = np.sin(2 * np.pi * f * t_axis(0.12)) * env_ad(int(SR * 0.12), 0.001, 0.05, 6)
    x[s : s + len(seg)] += seg * rng.uniform(0.3, 1)
save("sparkle", x, "ui", "Конфетти / искры", peak=0.45)

# RISER SOFT: нарастание (мягкое)
for name, d in [("riser_soft_1", 1.0), ("riser_soft_2", 2.0)]:
    t = t_axis(d)
    n = noise_band(d, 300, 4200, 0.8) * (t / d) ** 2.0
    s = sine_glide(d, 180, 700) * 0.25 * (t / d) ** 1.5
    save(name, (n + s) * np.minimum(1, (d - t) / 0.03), "riser", "Мягкое нарастание перед сменой (кончается резко в момент события)", peak=0.5)

with open(os.path.join(OUT, "catalog.json"), "w", encoding="utf8") as f:
    json.dump(CATALOG, f, ensure_ascii=False, indent=2)

# страница прослушивания
groups = {}
for c in CATALOG:
    groups.setdefault(c["group"], []).append(c)
names = {"pop": "Поп (появление)", "stretch": "Растяжение / пружина", "swish": "Пролёт по экрану", "impact": "Мягкие удары", "tick": "Тики, клики, печать", "count": "Счётчик", "ui": "Переключатели, подтверждения", "riser": "Нарастание"}
html = '<!doctype html><meta charset=utf-8><title>Foley InputLag</title><style>body{font:15px system-ui;background:#111;color:#eee;max-width:900px;margin:20px auto;padding:0 16px}h1,h2{color:#ffd93b}h2{margin:22px 0 6px;font-size:17px}.r{display:flex;align-items:center;gap:10px;margin:3px 0}.r span{width:160px;font-family:monospace;font-size:13px}.r small{color:#999;flex:1}audio{height:30px}</style><h1>Свои мягкие звуки «под движение»</h1><p>Послушайте и напишите, что оставить, что убрать.</p>'
for g, items in groups.items():
    html += f"<h2>{names.get(g, g)}</h2>"
    for c in items:
        html += f'<div class=r><span>{c["name"]}</span><audio controls preload=none src="{c["name"]}.mp3"></audio><small>{c["use"]} · {c["dur"]} с</small></div>'
with open(os.path.join(OUT, "index.html"), "w", encoding="utf8") as f:
    f.write(html)
print("OK:", len(CATALOG), "sounds ->", os.path.abspath(OUT))
