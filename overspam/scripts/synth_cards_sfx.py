"""Звуки для нарезки карт: бумс на открытие меню и выбор, «слайд» карты на каждый реролл.
Запуск: python scripts/synth_cards_sfx.py → public/sfx/foley/boom_*.mp3, card_slide_*.mp3"""
import os, subprocess, wave
import numpy as np
SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx", "foley")
rng = np.random.default_rng(11)

def save(name, x, peak=0.85):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    st = x if x.ndim == 2 else np.stack([x, x], 1)
    wav = os.path.join(OUT, name + ".wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", wav, "-q:a", "2", os.path.join(OUT, name + ".mp3")], check=True)
    os.remove(wav)

def lp(x, a):  # one-pole lowpass, a in (0,1)
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y

def boom(d=1.4, f0=95, f1=38, bright=0.35):
    t = np.arange(int(SR * d)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    knock = np.sin(2 * np.pi * 160 * t) * np.exp(-t * 40) * 0.6
    n = rng.standard_normal(len(t))
    air = lp(n, 0.08) * np.exp(-t * 7) * bright
    tail = lp(n, 0.02) * np.exp(-t * 3) * 0.25
    x = sub + knock + air + tail
    x[: int(SR * 0.003)] *= np.linspace(0, 1, int(SR * 0.003))
    return np.tanh(x * 1.6)

def slide(d=0.16, pitch=1.0, pan=0.0):
    t = np.arange(int(SR * d)) / SR
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * np.exp(-t * 6)
    sw = (lp(n, 0.25 * pitch) - lp(n, 0.04 * pitch)) * env
    tick = np.sin(2 * np.pi * 2400 * pitch * t) * np.exp(-((t - d * 0.55) * 140) ** 2) * 0.35
    flip = np.sin(2 * np.pi * 700 * pitch * t) * np.exp(-t * 60) * 0.25
    x = sw + tick + flip
    l, r = x * (1 - pan) / 2, x * (1 + pan) / 2
    return np.stack([l, r], 1)

save("boom_open", boom())
save("boom_pick", boom(1.6, 120, 40, 0.5))
for i, (p, pan) in enumerate([(1.0, -0.3), (1.08, 0.3), (0.94, 0.0), (1.15, -0.15)]):
    save(f"card_slide_{i + 1}", slide(pitch=p, pan=pan), peak=0.6)
print("ok")
