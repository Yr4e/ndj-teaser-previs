# Собирает звуковую дорожку полноценного тизера по карте SOUND_MAP.md:
# музыка = трек B (ElevenLabs, 168 BPM), переставленный по тактам, + звуки ElevenLabs владельца на ключевых точках.
# Запуск: python -I scripts/teaser_audio.py <папка_с_музыкой_и_sfx> <папка_выхода>
#   в папке: teaser90_B_safe.mp3 и sfx/ok/*.mp3 (boom_1..4, final_hit, text_zap_2, card_whoosh_hit, card_braam, predrop_reverse, predrop_subdrop)
# На выходе: teaser_mix.wav/.mp3 (всё вместе), teaser_music.wav (только музыка), teaser_sfx.wav (только звуки), teaser_cues.txt (тайминги).
import subprocess, sys
import numpy as np
from scipy.signal import stft, istft

sys.stdout.reconfigure(encoding="utf-8")
SRC, OUT = sys.argv[1], sys.argv[2]
SR = 44100
BAR = 4 * 60 / 168
BEAT = BAR / 4
DOWN = 0.88  # первая сильная доля трека B


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def save(y, path, codec):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", *codec, path], input=y.astype(np.float32).tobytes(), check=True)


B = load(f"{SRC}/teaser90_B_safe.mp3")
bar_at = lambda k: int(round((DOWN + (k - 1) * BAR) * SR))  # начало такта k трека B (с 1)


def bars(a, b):
    """такты a..b трека B включительно"""
    return B[bar_at(a) : bar_at(b + 1)].copy()


def filt(seg, cut_from, cut_to, kind="low", gain_from=1.0, gain_to=1.0):
    """фильтр с плавно меняющимся срезом (Гц) и громкостью по длине куска"""
    f, t, Z = stft(seg.T, fs=SR, nperseg=2048, noverlap=1536)
    k = np.clip(t / (len(seg) / SR), 0, 1)
    cut = cut_from * (cut_to / cut_from) ** k
    g = gain_from + (gain_to - gain_from) * k
    r = f[:, None] / cut[None, :]
    mask = (1 / (1 + r**8)) if kind == "low" else (1 - 1 / (1 + r**8))
    _, y = istft(Z * (mask * g[None, :])[None, :, :], fs=SR, nperseg=2048, noverlap=1536)
    return y.T[: len(seg)].astype(np.float32)


# ───── музыка: порядок кусков ─────
parts = []  # (имя, массив)
lead = int(0.5 * SR)
parts.append(("тишина", np.zeros((lead, 2), np.float32)))
parts.append(("начало B (тихо)", B[: bar_at(4)].copy()))
parts.append(("нагнетание: тёмная часть B 49–56 под фильтром", filt(bars(49, 56), 260, 1400, "low", 0.85, 1.0)))
build = bars(4, 7)
last = bar_at(7) - bar_at(4)
build[last:] = filt(build[last:], 220, 220, "high", 0.9, 0.9)  # последний такт разгона без баса
parts.append(("разгон B 4–7, в конце без баса", build))
parts.append(("ПЕРВЫЙ УДАР: основная часть B 8–30", bars(8, 30)))
brk = bars(31, 32)
parts.append(("брейк под босса B 31–32: верх срезан", filt(brk, 320, 320, "low", 0.8, 0.6)))
parts.append(("ДРОП: B 33–48", bars(33, 48)))
parts.append(("концовка B 59–60", bars(59, 60)))

# склейка с кроссфейдом 15 мс на стыках
XF = int(0.015 * SR)
music = parts[0][1]
starts = {}
for name, seg in parts[1:]:
    starts[name] = len(music) - (XF if len(music) else 0)
    if len(music) >= XF and len(seg) >= XF:
        t = np.linspace(0, np.pi / 2, XF, dtype=np.float32)[:, None]
        tail = music[-XF:] * np.cos(t) + seg[:XF] * np.sin(t)
        music = np.concatenate([music[:-XF], tail, seg[XF:]])
    else:
        music = np.concatenate([music, seg])
# хвост после последнего такта: место под финальный удар
music = np.concatenate([music, np.zeros((int(5.5 * SR), 2), np.float32)])

sec = lambda name: starts[name] / SR
T_INTRO = sec("начало B (тихо)") + DOWN  # первая сильная доля
T_DARK = sec("нагнетание: тёмная часть B 49–56 под фильтром")
T_BUILD = sec("разгон B 4–7, в конце без баса")
T_HIT = sec("ПЕРВЫЙ УДАР: основная часть B 8–30")
T_BRK = sec("брейк под босса B 31–32: верх срезан")
T_DROP = sec("ДРОП: B 33–48")
T_END = sec("концовка B 59–60")
T_FINAL = T_END + 2 * BAR

# ───── звуки ─────
sfx = np.zeros_like(music)
cues = []


def put(name, t, vol, end_at=False, note=""):
    s = load(f"{SRC}/sfx/ok/{name}.mp3") * vol
    i = int(round((t - (len(s) / SR if end_at else 0)) * SR))
    j = min(len(sfx), i + len(s))
    sfx[max(0, i) : j] += s[max(0, -i) : j - i]
    cues.append((t, name, note))


put("boom_1", T_INTRO, 0.55, note="первый удар: картинка из чёрного")
for k, b in enumerate(["boom_2", "boom_3", "boom_4", "boom_2"]):  # смена планов в нагнетании: каждые 2 такта
    put(b, T_DARK + k * 2 * BAR, 0.5 + 0.08 * k, note=f"смена плана {k + 1}")
put("predrop_reverse", T_HIT, 0.7, end_at=True, note="нарастание в первый удар")
put("card_braam", T_HIT, 0.75, note="ПЕРВЫЙ УДАР: логотип / 5 WORLDS")
put("boom_1", T_HIT, 0.5)
for k, b in enumerate([4, 8, 12, 16, 20]):  # входы во вставки в основной части
    put("text_zap_2" if k % 2 else "card_whoosh_hit", T_HIT + b * BAR, 0.4, note=f"вставка {k + 1}")
put("boom_3", T_BRK, 0.6, note="белая вспышка, стоп-кадр босса")
put("predrop_subdrop", T_BRK, 0.45)
put("predrop_reverse", T_DROP, 0.75, end_at=True, note="нарастание в дроп")
put("card_braam", T_DROP, 0.8, note="ДРОП: 1 BUILD NOBODY PLANNED")
put("boom_2", T_DROP, 0.55)
put("final_hit", T_FINAL, 0.9, note="ФИНАЛ: логотип, THIS WINTER, 12.12.2026")

mix = music + sfx
peak = np.abs(mix).max()
g = 10 ** (-1 / 20) / peak
for y, name in ((mix, "teaser_mix"), (music, "teaser_music"), (sfx, "teaser_sfx")):
    save(y * g, f"{OUT}/{name}.wav", ["-c:a", "pcm_s16le"])
save(mix * g, f"{OUT}/teaser_mix.mp3", ["-c:a", "libmp3lame", "-b:a", "320k"])

lines = [f"Тизер: {len(mix) / SR:.1f} с, 168 BPM, доля {BEAT:.3f} с, такт {BAR:.3f} с", "", "Музыка:"]
lines += [f"  {sec(n):6.2f} с  {n}" for n, _ in parts[1:]]
lines += ["", "Звуки:"] + [f"  {t:6.2f} с  {n:16s} {note}" for t, n, note in sorted(cues)]
open(f"{OUT}/teaser_cues.txt", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("\n".join(lines))
