"""Мини-импакт на получение карты: подсос 0,1 с → глубокий басовый удар → короткий хвост.
Запуск: python scripts/synth_impact.py → public/sfx/foley/card_impact.wav (удар ровно на 0,100 с)"""
import os, subprocess, wave
import numpy as np
SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx", "foley")
rng = np.random.default_rng(3)
HIT = 0.10
n = int(SR * 0.9)
t = np.arange(n) / SR
x = np.zeros(n)

def lp(sig, cut):
    a = 1 - np.exp(-2 * np.pi * cut / SR); y = np.zeros_like(sig); s = 0.0
    for i, v in enumerate(sig):
        s += a * (v - s); y[i] = s
    return y

# подсос: шум нарастает к удару
pre = (t < HIT)
sw = lp(rng.standard_normal(n), 900) * np.where(pre, (t / HIT) ** 3, 0) * 0.5
# саб: синус с падением тона 150 → 42 Гц
th = np.clip(t - HIT, 0, None)
f = 42 + 108 * np.exp(-th * 28)
sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-th * 5.5) * (t >= HIT)
# панч 180 Гц и щелчок атаки
punch = np.sin(2 * np.pi * 180 * th) * np.exp(-th * 45) * 0.7 * (t >= HIT)
click = (rng.standard_normal(n) - lp(rng.standard_normal(n), 2500)) * np.exp(-th * 260) * 0.6 * (t >= HIT)
# короткий шумовой хвост «пыль»
tail = lp(rng.standard_normal(n), 400) * np.exp(-th * 9) * 0.35 * (t >= HIT)
y = sw + sub * 1.3 + punch + click + tail
y = np.tanh(y * 2.2)  # плотность и громкость
y /= np.max(np.abs(y)) / 0.97
st = np.stack([y, y], 1)
tmp = os.path.join(OUT, "_imp.wav")
with wave.open(tmp, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", "acompressor=threshold=-18dB:ratio=6:attack=1:release=80:makeup=4,volume=8dB,alimiter=limit=0.97:level=false", os.path.join(OUT, "card_impact.wav")], check=True)
os.remove(tmp)
print("ok")
