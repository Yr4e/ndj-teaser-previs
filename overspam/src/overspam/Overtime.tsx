import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {rand, SPAWN} from "./kit";
import {PixelText} from "./PixelText";

/* ───────────── 10 минут на мир, потом овертайм ─────────────
   Таймер 10:00 сбегает к нулю с ускорением, шкала сложности растёт, со всех сторон лезет орда.
   На 0:00 удар: таймер краснеет и уходит в плюс, OVERTIME, шкала переливается за край (+∞), выплывают призраки. */
const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const RUN = 0.45; // старт отсчёта
const ZERO = 2.75; // 0:00
const END = 6.5;
export const overtimeFrames = f(END);

const HORDE = ["junkling", "skitter", "popup", "ping", "crawler", "blink", "craterbrute", "scarabling", "dunejackal", "cursorhound", "bulkmail", "coralrunner"];
const GHOSTS = ["serverwraith", "sandwraith", "spamspecter"];
// места орды: по краям, середина свободна под таймер
const SPOTS = Array.from({length: 26}, (_, i) => {
  const a = rand(i * 3.1) * Math.PI * 2;
  const r = 0.62 + rand(i * 7.7) * 0.4;
  return {x: 960 + Math.cos(a) * 960 * r, y: 560 + Math.sin(a) * 520 * r, size: 110 + rand(i * 5.3) * 110, at: i / 26};
});
const SEGMENTS = 20;

const mmss = (sec: number, plus = false) => {
  const s = Math.max(0, Math.floor(sec));
  return `${plus ? "+" : ""}${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** Пиксельная «бесконечность» (в шрифте игры такого знака нет) */
const INF = [".##...##.", "#..#.#..#", "#...#...#", "#..#.#..#", ".##...##."];
const Infinity: React.FC<{scale: number}> = ({scale}) => (
  <svg width={9 * scale} height={5 * scale} style={{filter: "drop-shadow(0 0 10px rgba(255,48,72,0.8))"}}>
    {INF.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x * scale} y={y * scale} width={scale} height={scale} fill="#ff4a5c" /> : null)))}
  </svg>
);

export const Overtime: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const p = Easing.in(Easing.cubic)(Math.min(1, Math.max(0, (t - RUN) / (ZERO - RUN)))); // 0 → 1 к нулю
  const over = t >= ZERO;
  const left = 600 * (1 - p);
  const plus = over ? Math.pow(t - ZERO, 1.6) * 140 : 0; // овертайм бежит вверх всё быстрее
  const hitF = f(ZERO);
  const punch = over ? 0.08 * (1 - spring({frame: frame - hitF, fps: FPS, config: SPAWN, durationInFrames: 16})) : 0;
  const shakeT = frame - hitF;
  const shake = shakeT >= 0 && shakeT < 14 ? Math.round((1 - shakeT / 14) * 3) * 4 : 0;
  const heart = over ? 0.5 + 0.5 * Math.sin((t - ZERO) * Math.PI * 2 * 1.6) : 0;
  const redV = over ? interpolate(frame - hitF, [0, 4, 30], [0, 0.85, 0.45], clamp) + heart * 0.15 : p * 0.2;
  const overIn = over ? spring({frame: frame - hitF, fps: FPS, config: SPAWN, durationInFrames: 18}) : 0;

  return (
    <AbsoluteFill style={{background: "radial-gradient(110% 90% at 50% 50%, #12121d, #050508)", overflow: "hidden"}}>
      <AbsoluteFill style={{transform: `translate(${shake * Math.sin(shakeT * 2.9)}px, ${shake * Math.cos(shakeT * 3.4)}px) scale(${1 + punch + p * 0.04})`}}>
        {/* орда */}
        {SPOTS.map((s, i) => {
          const show = p >= s.at * 0.95 || over;
          if (!show) return null;
          const at = f(RUN + (ZERO - RUN) * Math.cbrt(s.at * 0.95)) ;
          const sp = spring({frame: frame - at, fps: FPS, config: SPAWN, durationInFrames: 16});
          const bob = Math.sin(frame / 9 + i) * 4;
          const pull = over ? (t - ZERO) * 18 : 0; // в овертайме орда подползает
          const dx = (960 - s.x) / 1000 * pull, dy = (560 - s.y) / 1000 * pull;
          return (
            <Img key={i} src={staticFile(`overspam/site/enemies/${HORDE[i % HORDE.length]}.webp`)} style={{
              position: "absolute", left: s.x - s.size / 2 + dx, top: s.y - s.size / 2 + bob + dy, width: s.size, height: s.size, objectFit: "contain",
              transform: `scale(${sp}) scaleX(${s.x > 960 ? -1 : 1})`, filter: `brightness(${0.45 + 0.25 * p}) drop-shadow(0 8px 10px rgba(0,0,0,0.6))`,
            }} />
          );
        })}
        {/* призраки овертайма */}
        {over && GHOSTS.map((g, i) => {
          const at = hitF + 10 + i * 14;
          const o = interpolate(frame, [at, at + 30], [0, 0.72], clamp);
          const x = [380, 1540, 1250][i], y = [420, 380, 900][i];
          const drift = (frame - at) * 0.6;
          return (
            <Img key={g} src={staticFile(`overspam/site/enemies/${g}.webp`)} style={{
              position: "absolute", left: x - 170 + (960 - x) * drift / 900, top: y - 190 + Math.sin(frame / 14 + i) * 12, width: 340, height: 380, objectFit: "contain",
              opacity: o, mixBlendMode: "screen", filter: "saturate(0.4) brightness(1.3) drop-shadow(0 0 30px rgba(140,200,255,0.8)) blur(0.5px)",
            }} />
          );
        })}

        {/* таймер и шкала */}
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 34}}>
          <div style={{height: 60, display: "flex", alignItems: "center"}}>
            {!over ? (
              <div style={{opacity: interpolate(frame, [6, 20], [0, 1], clamp)}}><PixelText text="TEN MINUTES PER WORLD" scale={3} style="dim" spacing={3} noOutline /></div>
            ) : (
              <div style={{transform: `scale(${0.6 + 0.4 * overIn})`, opacity: overIn}}><PixelText text="OVERTIME" scale={7} style="red" /></div>
            )}
          </div>
          <div style={{transform: `translateX(${over && frame - hitF < 10 ? Math.round((rand(frame) - 0.5) * 4) * 8 : 0}px)`}}>
            <PixelText text={over ? mmss(plus, true) : mmss(left)} scale={22} style={over ? "red" : "logo"} />
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 22}}>
            <PixelText text="DIFFICULTY" scale={3} style="dim" noOutline />
            <div style={{display: "flex", gap: 6}}>
              {Array.from({length: SEGMENTS + (over ? 6 : 0)}, (_, i) => {
                const on = over || i < Math.round(p * SEGMENTS);
                const extra = i >= SEGMENTS;
                const k = Math.min(1, i / (SEGMENTS - 1));
                const col = extra ? "#ff3048" : `hsl(${110 - 110 * k}, 85%, ${52 + (on ? 0 : -30)}%)`;
                const eo = extra ? interpolate(frame, [hitF + (i - SEGMENTS) * 4, hitF + (i - SEGMENTS) * 4 + 6], [0, 1], clamp) : 1;
                return <div key={i} style={{width: 22, height: 34, background: on ? col : "#1e1e2c", opacity: eo, boxShadow: on && (extra || k > 0.7) ? `0 0 14px ${col}` : undefined}} />;
              })}
            </div>
            {over && (
              <div style={{opacity: overIn, display: "flex", alignItems: "center", gap: 10}}>
                <PixelText text="+" scale={5} style="red" />
                <Infinity scale={7} />
              </div>
            )}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* красная виньетка, сердцебиение в овертайме */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 260px 60px rgba(255,40,60,${redV})`}} />
      <AbsoluteFill style={{opacity: interpolate(frame, [0, 12], [1, 0], clamp), background: "#000"}} />
    </AbsoluteFill>
  );
};
