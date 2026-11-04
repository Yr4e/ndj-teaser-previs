# Удлиняет начало звука рефа Fast Cuts: удар остаётся как есть, гул после удара растягивается,
# щелчки и всё дальше просто сдвигаются на столько же.
# Запуск (из папки overspam): python -I scripts/opener_audio_extend.py 4
#   вход  public/sfx/ref/fastcuts.wav (дорожка рефа, в git не кладём)
#   выход public/sfx/ref/fastcuts-ext-<мс>.wav — его берёт OS-OpenerCuts при opener.extend > 0
import subprocess, sys
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

EXT = float(sys.argv[1]) if len(sys.argv) > 1 else 4.0
SRC = "public/sfx/ref/fastcuts.wav"
DST = f"public/sfx/ref/fastcuts-ext-{round(EXT * 1000)}.wav"
SR = 48000
A, B = 0.45, 1.25  # гул после удара (до 0,45 с атака удара, после 1,25 с начинаются щелчки)

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
a, b = int(A * SR), int(B * SR)

# гранулярная растяжка: зёрна по 0,2 с с перекрытием 4, позиция в исходнике идёт медленно от A к B,
# небольшой случайный разброс, чтобы не было слышно повторяющегося рисунка
L = int((B - A + EXT) * SR)
G = int(0.2 * SR)
H = G // 4
win = np.hanning(G).astype(np.float32)[:, None]
out = np.zeros((L + G, 2), np.float32)
norm = np.zeros((L + G, 1), np.float32)
rng = np.random.default_rng(7)
for o in range(0, L, H):
    pos = a + (o / L) * (b - a - G) + rng.uniform(-0.03, 0.03) * SR
    pos = int(np.clip(pos, a, b - G))
    out[o : o + G] += x[pos : pos + G] * win
    norm[o : o + G] += win
mid = out[:L] / np.maximum(norm[:L], 1e-3)

# стыки: равномощный кроссфейд 40 мс с оригиналом на входе и 80 мс на выходе
def xfade(tail, head):
    n = len(tail)
    t = np.linspace(0, np.pi / 2, n, dtype=np.float32)[:, None]
    return tail * np.cos(t) + head * np.sin(t)

fi, fo = int(0.04 * SR), int(0.08 * SR)
mid[:fi] = xfade(x[a : a + fi], mid[:fi])
mid[-fo:] = xfade(mid[-fo:], x[b - fo : b])
y = np.concatenate([x[:a], mid, x[b:]]).astype(np.float32)

subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", DST], input=y.tobytes(), check=True)
print(f"{DST}: {len(y) / SR:.2f} с (было {len(x) / SR:.2f} с, +{EXT} с в гуле {A}–{B} с)")
