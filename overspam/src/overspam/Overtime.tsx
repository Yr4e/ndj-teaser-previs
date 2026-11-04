import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {LAND, rand, SPAWN} from "./kit";
import {PixelText} from "./PixelText";

/* ───────────── 10 минут на мир, потом овертайм ─────────────
   Таймер 10:00 сбегает к нулю с ускорением, шкала сложности растёт, со всех сторон лезет орда.
   На 0:00 портал открыт: OVERTIME в цветах сайта (розово-фиолетовый), таймер уходит в плюс и проходит
   уровни DEADLY → NIGHTMARE → CATACLYSM → APOCALYPSE → OVERSPAM (по 2 доли на уровень, 130 BPM).
   Мобы по одному превращаются в призраков овертайма: бледный с DEADLY, фиолетовый с NIGHTMARE,
   большой багровый с CATACLYSM; призраков всё больше и они крупнее, к концу на поле только они. */
const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const BEAT = 60 / 130;

const RUN = 0.45; // старт отсчёта
const ZERO = 2.75; // 0:00
// уровни овертайма с overspam.com: имя, отметка таймера (с), цвет плашки
const TIERS = [
  {name: "DEADLY", at: 0, color: "#ff8c3d"},
  {name: "NIGHTMARE", at: 120, color: "#c77aff"},
  {name: "CATACLYSM", at: 300, color: "#ff524d"},
  {name: "APOCALYPSE", at: 480, color: "#e01a42"},
  {name: "OVERSPAM", at: 1200, color: "#ff38c7"},
].map((tier, i) => ({...tier, t: ZERO + i * 2 * BEAT}));
// после SIM_START призраки лезут волнами с краёв, толкаются и к концу заливают весь кадр
const SIM_START = 5.0;
const FILL_DUR = 3.0; // за сколько секунд приходят все новые призраки
const END = TIERS[4].t + 2.8;
export const overtimeFrames = f(END);

const PINK = "#ff38c7";
const HORDE = ["junkling", "skitter", "popup", "ping", "crawler", "blink", "craterbrute", "scarabling", "dunejackal", "cursorhound", "bulkmail", "coralrunner"];
type Ghost = "pale" | "purple" | "crimson";

/* ───────────── места на поле: без наложений, середина свободна под таймер ───────────── */
const CENTER = {x0: 300, x1: 1620, y0: 240, y1: 800};
const TIER_ROW = {x0: 120, x1: 1800, y0: 690, y1: 800}; // плашки уровней шире таймера
const HORDE_N = 24;
const EXTRA_N = 9; // призраки, которые приходят сверх орды на поздних уровнях
const SPOTS = (() => {
  const out: {x: number; y: number; size: number}[] = [];
  for (let k = 0; out.length < HORDE_N + EXTRA_N && k < 20000; k++) {
    const size = 95 + rand(k * 5.3) * 55;
    const x = 40 + rand(k * 3.1) * 1840;
    const y = 50 + rand(k * 7.7) * 980;
    const pad = size * 0.55;
    const hits = (r: {x0: number; x1: number; y0: number; y1: number}) => x + pad > r.x0 && x - pad < r.x1 && y + pad > r.y0 && y - pad < r.y1;
    if (hits(CENTER) || hits(TIER_ROW)) continue;
    // запас 1.4: призраки потом подрастают и чуть подползают к центру
    if (out.some((s) => Math.hypot(s.x - x, s.y - y) < ((s.size + size) / 2) * 1.4)) continue;
    out.push({x, y, size});
  }
  return out;
})();

// разные мобы рядом: каждому месту тот тип, которого нет у соседей и который реже встречался
const MOB_OF = (() => {
  const used: number[] = HORDE.map(() => 0);
  const pick: number[] = [];
  SPOTS.slice(0, HORDE_N).forEach((s, i) => {
    const near = new Set(pick.filter((_, j) => Math.hypot(SPOTS[j].x - s.x, SPOTS[j].y - s.y) < 520));
    const options = HORDE.map((_, k) => k).filter((k) => !near.has(k));
    const k = (options.length ? options : HORDE.map((_, k2) => k2)).sort((a, b) => used[a] - used[b] || rand(i * 11 + a) - rand(i * 11 + b))[0];
    used[k]++;
    pick.push(k);
  });
  return pick;
})();

// время появления моба (до нуля, сначала редко, потом гуще) и превращения в призрака (после нуля)
const SPAWN_AT = SPOTS.slice(0, HORDE_N).map((_, i) => RUN + (ZERO - RUN - 0.15) * Math.cbrt((i + rand(i * 2.3)) / HORDE_N));
const CONVERT_ORDER = SPOTS.slice(0, HORDE_N).map((_, i) => i).sort((a, b) => rand(a * 9.1) - rand(b * 9.1));
const CONVERT_AT: number[] = [];
CONVERT_ORDER.forEach((i, k) => {
  CONVERT_AT[i] = TIERS[0].t + 0.12 + (SIM_START - 0.05 - TIERS[0].t - 0.12) * Math.pow(k / (HORDE_N - 1), 0.85);
});
const EXTRA_AT = Array.from({length: EXTRA_N}, (_, k) => TIERS[2].t + (SIM_START - 0.05 - TIERS[2].t) * (k / EXTRA_N));

/** Какой призрак появляется в момент t: новые виды подключаются по уровням */
const ghostAt = (t: number, seed: number): Ghost => {
  const pool: Ghost[] = t >= TIERS[2].t ? ["pale", "purple", "crimson", "crimson"] : t >= TIERS[1].t ? ["pale", "purple"] : ["pale"];
  return pool[Math.floor(rand(seed) * pool.length)];
};

const glowOf = (k: Ghost) => (k === "pale" ? "#bcd4ff" : k === "purple" ? "#c77aff" : "#ff524d");
const tierAt = (t: number) => TIERS.reduce((acc, tier, i) => (t >= tier.t ? i : acc), 0);
const pullAt = (t: number) => Math.min(1, (t - ZERO) / (END - ZERO)) * 0.035; // поле чуть сжимается к центру
const growAt = (t: number) => 1 + 0.04 * tierAt(t); // призраки крупнее с каждым уровнем

/* ───────────── толкотня: мягкие круги, тянутся к центру, расталкивают друг друга ─────────────
   Считается один раз кадр за кадром (Verlet + разведение пересечений), результат кэшируется,
   поэтому любой кадр рендерится одинаково. */
type Body = {kind: Ghost; r0: number; m: number; born: number; x: number; y: number; vx: number; vy: number};
const NEW_N = 150;
const SIM_F0 = f(SIM_START);
const BODIES: Body[] = (() => {
  const out: Body[] = [];
  const pull = pullAt(SIM_START), grow = growAt(SIM_START);
  // все, кто уже на поле к SIM_START: бывшая орда и призраки сверх неё
  SPOTS.forEach((sp, i) => {
    const kind = i < HORDE_N ? ghostAt(CONVERT_AT[i], i) : ghostAt(EXTRA_AT[i - HORDE_N], 100 + i - HORDE_N);
    const w = sp.size * (kind === "crimson" ? 1.2 : 1) * grow;
    out.push({kind, r0: w * 0.4, m: kind === "crimson" ? 2 : 1, born: 0, x: sp.x + (960 - sp.x) * pull, y: sp.y + (560 - sp.y) * pull, vx: 0, vy: 0});
  });
  // новые: всё чаще, с четырёх сторон
  for (let k = 0; k < NEW_N; k++) {
    const born = f(SIM_START + FILL_DUR * Math.pow((k + 1) / NEW_N, 0.6));
    const pool: Ghost[] = ["pale", "purple", "purple", "crimson"];
    const kind = pool[Math.floor(rand(300 + k) * pool.length)];
    const w = (95 + rand(k * 4.7) * 55) * (kind === "crimson" ? 1.2 : 1) * growAt(born / FPS);
    const r0 = w * 0.4;
    const side = Math.floor(rand(k * 6.1) * 4);
    const u = 0.08 + rand(k * 8.3) * 0.84;
    const x = side === 0 ? -r0 : side === 1 ? 1920 + r0 : u * 1920;
    const y = side === 2 ? -r0 : side === 3 ? 1080 + r0 : u * 1080;
    const sp = 7 + rand(k * 2.9) * 6;
    const d = Math.hypot(960 - x, 540 - y);
    out.push({kind, r0, m: kind === "crimson" ? 2 : 1, born, x, y, vx: ((960 - x) / d) * sp, vy: ((540 - y) / d) * sp});
  }
  return out;
})();

type SimFrame = {x: Float32Array; y: Float32Array; r: Float32Array; press: Float32Array};
let SIM: SimFrame[] | null = null;
const simulate = () => {
  if (SIM) return SIM;
  const n = BODIES.length;
  const x = new Float64Array(n), y = new Float64Array(n), px = new Float64Array(n), py = new Float64Array(n), r = new Float64Array(n);
  BODIES.forEach((b, i) => {
    x[i] = b.x; y[i] = b.y; px[i] = b.x - b.vx; py[i] = b.y - b.vy;
  });
  const frames: SimFrame[] = [];
  const F1 = f(END);
  for (let fr = SIM_F0; fr <= F1; fr++) {
    const prog = (fr - SIM_F0) / (F1 - SIM_F0);
    const alive: number[] = [];
    for (let i = 0; i < n; i++) if (BODIES[i].born <= fr) alive.push(i);
    const press = new Float32Array(n);
    for (const i of alive) {
      r[i] = BODIES[i].r0 * (1 + 0.22 * prog);
      const vx = (x[i] - px[i]) * 0.86, vy = (y[i] - py[i]) * 0.86;
      px[i] = x[i]; py[i] = y[i];
      const dx = 960 - x[i], dy = 540 - y[i], d = Math.hypot(dx, dy) || 1;
      x[i] += vx + (dx / d) * 0.45;
      y[i] += vy + (dy / d) * 0.45;
    }
    for (let it = 0; it < 4; it++) {
      for (let a = 0; a < alive.length; a++) {
        const i = alive[a];
        for (let b = a + 1; b < alive.length; b++) {
          const j = alive[b];
          const dx = x[j] - x[i], dy = y[j] - y[i];
          const min = r[i] + r[j];
          if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d >= min) continue;
          const ov = min - d, nx = dx / d, ny = dy / d;
          const mi = BODIES[i].m, mj = BODIES[j].m, c = ov * 0.8;
          x[i] -= nx * c * (mj / (mi + mj)); y[i] -= ny * c * (mj / (mi + mj));
          x[j] += nx * c * (mi / (mi + mj)); y[j] += ny * c * (mi / (mi + mj));
          if (it === 0) {
            press[i] += ov / r[i];
            press[j] += ov / r[j];
          }
        }
        // стенки: кто уже вошёл в кадр, не вылетает обратно
        if (fr - BODIES[i].born > 25) {
          const m = r[i] * 0.55;
          x[i] = Math.min(1920 - m, Math.max(m, x[i]));
          y[i] = Math.min(1080 - m, Math.max(m, y[i]));
        }
      }
    }
    frames.push({x: Float32Array.from(x), y: Float32Array.from(y), r: Float32Array.from(r), press});
  }
  SIM = frames;
  return SIM;
};

const mmss = (sec: number, plus = false) => {
  const s = Math.max(0, Math.floor(sec));
  return `${plus ? "+" : ""}${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Таймер в плюсе: между отметками уровней ускоряется, после OVERSPAM бежит дальше */
const overtimeClock = (t: number) => {
  for (let i = 0; i < TIERS.length - 1; i++) {
    const a = TIERS[i], b = TIERS[i + 1];
    if (t < b.t) return a.at + (b.at - a.at) * Easing.in(Easing.quad)(Math.max(0, (t - a.t) / (b.t - a.t)));
  }
  return TIERS[4].at + (t - TIERS[4].t) * 90;
};

/** Пиксельная «бесконечность» (в шрифте игры такого знака нет) */
const INF = [".##...##.", "#..#.#..#", "#...#...#", "#..#.#..#", ".##...##."];
export const Infinity: React.FC<{scale: number; color?: string}> = ({scale, color = PINK}) => (
  <svg width={9 * scale} height={5 * scale} style={{filter: `drop-shadow(0 0 10px ${color})`}}>
    {INF.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x * scale} y={y * scale} width={scale} height={scale} fill={color} /> : null)))}
  </svg>
);

const GhostImg: React.FC<{kind: Ghost; x: number; y: number; size: number; s: number; glow: string; frame: number; seed: number}> = ({kind, x, y, size, s, glow, frame, seed}) => {
  const w = size * (kind === "crimson" ? 1.2 : 1);
  const h = (w * 413) / 472;
  return (
    <Img
      src={staticFile(`overspam/ghosts/${kind}.png`)}
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2 + Math.sin(frame / 13 + seed) * 7,
        width: w,
        height: h,
        transform: `scale(${s}) scaleX(${x > 960 ? -1 : 1})`,
        filter: `drop-shadow(0 0 ${18 * s}px ${glow}) drop-shadow(0 10px 12px rgba(0,0,0,0.6))`,
      }}
    />
  );
};

/** Клуб дыма в момент превращения моба в призрака */
const Puff: React.FC<{x: number; y: number; size: number; age: number; color: string}> = ({x, y, size, age, color}) => {
  if (age < 0 || age > 16) return null;
  const k = age / 16;
  const r = size * (0.35 + 0.55 * Easing.out(Easing.cubic)(k));
  return <div style={{position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${6 * (1 - k) + 1}px solid ${color}`, opacity: 1 - k, boxShadow: `0 0 24px ${color}`}} />;
};

export const Overtime: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const p = Easing.in(Easing.cubic)(Math.min(1, Math.max(0, (t - RUN) / (ZERO - RUN)))); // 0 → 1 к нулю
  const over = t >= ZERO;
  const tierIdx = over ? TIERS.reduce((acc, tier, i) => (t >= tier.t ? i : acc), 0) : -1;
  const tier = tierIdx >= 0 ? TIERS[tierIdx] : null;
  const left = 600 * (1 - p);
  const hitF = f(ZERO);

  // камера: удар на нуле, лёгкий толчок на каждом новом уровне
  const bump = TIERS.reduce((acc, tr, i) => {
    const age = frame - f(tr.t);
    if (age < 0 || age > 16) return acc;
    return acc + (i === 0 ? 0.08 : 0.025) * (1 - spring({frame: age, fps: FPS, config: SPAWN, durationInFrames: 16}));
  }, 0);
  const shakeT = frame - hitF;
  const shake = shakeT >= 0 && shakeT < 14 ? Math.round((1 - shakeT / 14) * 3) * 4 : 0;
  const overIn = over ? spring({frame: frame - hitF, fps: FPS, config: SPAWN, durationInFrames: 18}) : 0;
  const tierAge = tier ? frame - f(tier.t) : 0;
  const pulse = over ? 0.5 + 0.5 * Math.sin((t - ZERO) * Math.PI * 2 / BEAT) : 0;
  const vignette = over ? interpolate(frame - hitF, [0, 4, 30], [0, 0.6, 0.32], clamp) + pulse * 0.1 + 0.04 * tierIdx : p * 0.2;
  const vColor = over ? PINK : "#ff3048"; // овертайм всегда в розово-пурпурном, цвет уровня только на плашке и таймере
  const pull = over ? pullAt(t) : 0;
  const grow = over ? growAt(t) : 1;
  const sim = t >= SIM_START ? simulate()[frame - SIM_F0] : null;

  return (
    <AbsoluteFill style={{background: "radial-gradient(110% 90% at 50% 50%, #12121d, #050508)", overflow: "hidden"}}>
      {/* пурпурный свет портала, как у блока Overtime на сайте */}
      <AbsoluteFill style={{opacity: overIn, background: "radial-gradient(70% 60% at 50% 48%, rgba(42,6,38,0.95), rgba(7,7,13,0) 75%), linear-gradient(to right, rgba(7,7,13,0.6), rgba(42,6,38,0.55) 50%, rgba(7,7,13,0.6))"}} />
      <AbsoluteFill style={{transform: `translate(${shake * Math.sin(shakeT * 2.9)}px, ${shake * Math.cos(shakeT * 3.4)}px) scale(${1 + bump + p * 0.04})`}}>
        {/* орда, потом призраки на тех же местах */}
        {!sim && SPOTS.slice(0, HORDE_N).map((s, i) => {
          const at = f(SPAWN_AT[i]);
          if (frame < at) return null;
          const x = s.x + (960 - s.x) * pull;
          const y = s.y + (560 - s.y) * pull;
          const cAt = f(CONVERT_AT[i]);
          const age = frame - cAt;
          const kind = ghostAt(CONVERT_AT[i], i);
          const glow = kind === "pale" ? "#bcd4ff" : kind === "purple" ? "#c77aff" : "#ff524d";
          if (age >= 0) {
            const gs = spring({frame: age, fps: FPS, config: SPAWN, durationInFrames: 18}) * grow;
            return (
              <React.Fragment key={i}>
                <GhostImg kind={kind} x={x} y={y} size={s.size} s={gs} glow={glow} frame={frame} seed={i} />
                <Puff x={x} y={y} size={s.size} age={age} color={glow} />
              </React.Fragment>
            );
          }
          const sp = spring({frame: frame - at, fps: FPS, config: SPAWN, durationInFrames: 16});
          // за 6 кадров до превращения моб сжимается и светлеет
          const out = interpolate(age, [-6, 0], [1, 0.2], clamp);
          return (
            <Img
              key={i}
              src={staticFile(`overspam/site/enemies/${HORDE[MOB_OF[i]]}.webp`)}
              style={{
                position: "absolute",
                left: x - s.size / 2,
                top: y - s.size / 2 + Math.sin(frame / 9 + i) * 4,
                width: s.size,
                height: s.size,
                objectFit: "contain",
                transform: `scale(${sp * out}) scaleX(${s.x > 960 ? -1 : 1})`,
                filter: `brightness(${(0.45 + 0.25 * p) * (age > -6 ? 2.2 : 1)}) drop-shadow(0 8px 10px rgba(0,0,0,0.6))`,
              }}
            />
          );
        })}
        {/* призраки сверх орды: их всё больше на поздних уровнях */}
        {!sim && SPOTS.slice(HORDE_N).map((s, k) => {
          const at = f(EXTRA_AT[k]);
          if (frame < at) return null;
          const kind = ghostAt(EXTRA_AT[k], 100 + k);
          const glow = kind === "pale" ? "#bcd4ff" : kind === "purple" ? "#c77aff" : "#ff524d";
          const gs = spring({frame: frame - at, fps: FPS, config: SPAWN, durationInFrames: 18}) * grow;
          return <GhostImg key={`x${k}`} kind={kind} x={s.x + (960 - s.x) * pull} y={s.y + (560 - s.y) * pull} size={s.size} s={gs} glow={glow} frame={frame} seed={50 + k} />;
        })}

        {/* таймер, шкала до нуля, уровни после */}
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 30}}>
          <div style={{height: 96, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 14}}>
            {!over ? (
              <div style={{opacity: interpolate(frame, [6, 20], [0, 1], clamp)}}>
                <PixelText text="TEN MINUTES PER WORLD" scale={3} style="dim" spacing={3} noOutline />
              </div>
            ) : (
              <>
                <div style={{opacity: interpolate(frame - hitF, [4, 16], [0, 1], clamp)}}>
                  <PixelText text="THE PORTAL IS OPEN. YOU COULD LEAVE." scale={3} color={PINK} spacing={2} noOutline />
                </div>
                <div style={{transform: `scale(${0.6 + 0.4 * overIn})`, opacity: overIn}}>
                  <PixelText text="OVERTIME" scale={7} color={PINK} />
                </div>
              </>
            )}
          </div>
          <div style={{transform: `translateX(${over && frame - hitF < 10 ? Math.round((rand(frame) - 0.5) * 4) * 8 : 0}px) scale(${tier ? 1 + 0.05 * (1 - spring({frame: tierAge, fps: FPS, config: SPAWN, durationInFrames: 12})) : 1})`}}>
            {over ? <PixelText text={mmss(overtimeClock(t), true)} scale={22} color={tier!.color} /> : <PixelText text={mmss(left)} scale={22} style="logo" />}
          </div>
          <div style={{height: 70, display: "flex", alignItems: "center"}}>
            {!over ? (
              <div style={{display: "flex", alignItems: "center", gap: 22}}>
                <PixelText text="DIFFICULTY" scale={3} style="dim" noOutline />
                <div style={{display: "flex", gap: 6}}>
                  {Array.from({length: 20}, (_, i) => {
                    const on = i < Math.round(p * 20);
                    const k = i / 19;
                    const col = `hsl(${110 - 110 * k}, 85%, ${on ? 52 : 22}%)`;
                    return <div key={i} style={{width: 22, height: 34, background: on ? col : "#1e1e2c", boxShadow: on && k > 0.7 ? `0 0 14px ${col}` : undefined}} />;
                  })}
                </div>
              </div>
            ) : (
              <div style={{display: "flex", gap: 14}}>
                {TIERS.map((tr, i) => {
                  const lit = i <= tierIdx;
                  const age = frame - f(tr.t);
                  const s = lit ? spring({frame: age, fps: FPS, config: LAND, durationInFrames: 14}) : 0;
                  const current = i === tierIdx;
                  return (
                    <div
                      key={tr.name}
                      style={{
                        padding: "12px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        border: `4px solid ${lit ? tr.color : "#262636"}`,
                        background: lit ? "rgba(20,8,24,0.85)" : "rgba(12,12,20,0.6)",
                        boxShadow: current ? `0 0 ${22 + pulse * 18}px ${tr.color}` : "none",
                        transform: `scale(${1 + (current ? 0.06 : 0) * s + (lit ? 0.12 * (1 - s) : 0)})`,
                        opacity: interpolate(frame - hitF, [i * 2, i * 2 + 8], [0, 1], clamp) * (lit ? 1 : 0.45),
                      }}
                    >
                      {lit ? <PixelText text={tr.name} scale={3} color={tr.color} noOutline /> : <PixelText text={tr.name} scale={3} style="dim" noOutline />}
                      <PixelText text={`+${mmss(tr.at)}`} scale={2} style="dim" noOutline />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </AbsoluteFill>
        {/* толкотня поверх всего: к концу призраки заливают таймер и плашки */}
        {sim &&
          BODIES.map((b, i) => ({b, i}))
            .filter(({b}) => b.born <= frame)
            .sort((a, c) => sim.y[a.i] - sim.y[c.i])
            .map(({b, i}) => {
              const w = sim.r[i] / 0.4;
              const h = (w * 413) / 472;
              const sq = Math.min(0.16, sim.press[i] * 0.22);
              const pop = b.born > 0 ? interpolate(frame - b.born, [0, 10], [0.6, 1], {...clamp, easing: Easing.out(Easing.back(2))}) : 1;
              return (
                <Img
                  key={`s${i}`}
                  src={staticFile(`overspam/ghosts/${b.kind}.png`)}
                  style={{
                    position: "absolute",
                    left: sim.x[i] - w / 2,
                    top: sim.y[i] - h / 2,
                    width: w,
                    height: h,
                    transform: `scale(${pop * (1 + sq)}, ${pop * (1 - sq * 0.8)}) scaleX(${sim.x[i] > 960 ? -1 : 1})`,
                    filter: `drop-shadow(0 0 10px ${glowOf(b.kind)})`,
                  }}
                />
              );
            })}
      </AbsoluteFill>
      {/* виньетка цвета текущего уровня, пульс на каждую долю */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 260px 60px ${vColor}${Math.round(Math.min(1, vignette) * 255).toString(16).padStart(2, "0")}`}} />
      <AbsoluteFill style={{opacity: interpolate(frame, [0, 12], [1, 0], clamp), background: "#000"}} />
    </AbsoluteFill>
  );
};
