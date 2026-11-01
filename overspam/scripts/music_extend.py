# Удлиняет циклическую музыку склейкой по тактам, без слышимых швов.
# Запуск: python -I scripts/music_extend.py <вход.mp3> <выход без расширения> [--start-bar 3] [--jumps 12:9,20:17]
#   --bpm, --bar0  темп и время первой сильной доли (по умолчанию для Combat_Surge: 130 BPM, 1.332 с)
#   --start-bar    с какого такта начать (обрезка начала)
#   --jumps        после такта A вернуться к такту B (A:B, или A:Bx2 — два раза), каждый прыжок вставляет A-B+1 тактов
# Пишет <выход>.wav и <выход>.mp3 и печатает, где в новой версии стоят такты.
import argparse, subprocess, sys
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("dst")
p.add_argument("--bpm", type=float, default=130.0)
p.add_argument("--bar0", type=float, default=1.332)
p.add_argument("--start-bar", type=int, default=3)
p.add_argument("--jumps", default="12:9,20:17")
p.add_argument("--fade-ms", type=float, default=25)
a = p.parse_args()

SR = 48000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.src, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
bar = 4 * 60 / a.bpm
nbars = int((len(x) / SR - a.bar0) // bar)
at = lambda i: int(round((a.bar0 + i * bar) * SR))

jumps = {}
for j in filter(None, a.jumps.split(",")):
    frm, to = j.split(":")
    to, _, times = to.partition("x")
    jumps[int(frm)] = (int(to), int(times or 1))

# порядок тактов: идём подряд, на такте A один раз прыгаем к B
order, i, used = [], a.start_bar, {}
while i < nbars:
    order.append(i)
    if i in jumps and used.get(i, 0) < jumps[i][1]:
        used[i] = used.get(i, 0) + 1
        i = jumps[i][0]
    else:
        i += 1

fade = int(a.fade_ms / 1000 * SR)
out = [x[at(order[0]) - fade : at(order[0])] * np.linspace(0, 1, fade)[:, None]]  # мягкий вход
for k, b in enumerate(order):
    seg = x[at(b) : at(b + 1) + fade].copy()
    if k > 0 and order[k - 1] + 1 != b:
        # шов: равномощный кроссфейд хвоста предыдущего такта и начала этого
        t = np.linspace(0, np.pi / 2, fade)[:, None]
        prev_tail = x[at(order[k - 1] + 1) : at(order[k - 1] + 1) + fade]
        seg[:fade] = seg[:fade] * np.sin(t) + prev_tail * np.cos(t)
    out.append(seg[: at(b + 1) - at(b)])
out.append(x[at(nbars) :])  # хвост трека после последнего целого такта
y = np.concatenate(out).astype(np.float32)

for ext, args in (("wav", ["-c:a", "pcm_s16le"]), ("mp3", ["-c:a", "libmp3lame", "-b:a", "320k"])):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", *args, f"{a.dst}.{ext}"], input=y.tobytes(), check=True)

lead = fade / SR
print(f"длина {len(y) / SR:.2f} с, тактов {len(order)}, такт {bar:.4f} с")
print("такт оригинала → время в новой версии:")
print("  " + "  ".join(f"{b}@{lead + k * bar:.2f}" for k, b in enumerate(order)))
