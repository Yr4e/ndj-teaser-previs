import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {BOSSES, GOLD, WORLDS} from "./data";
import {rand, SPAWN} from "./kit";
import {PixelText} from "./PixelText";

/* ───────────── Боссы для тизера: показываем двух, остальные три — загадка ─────────────
   A) OS-BossPath: путь на одном полотне, камера летит вдоль линии от карточки к карточке.
   B) OS-BossLineup: пять силуэтов в ряд, прожектор открывает первых двух, над остальными глючит «?». */

const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const SHOWN = 2; // сколько боссов открыто

/** «?» с пиксельным глитчем: дрожит на целые пиксели, иногда расслаивается */
const GlitchQ: React.FC<{at: number; scale: number}> = ({at, scale}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const step = Math.floor(frame / 5);
  const g = interpolate(frame - at, [0, 20], [1, 0.25], clamp);
  const dx = Math.round((rand(step * 7 + at) - 0.5) * 4 * g) * scale;
  const s = spring({frame: frame - at, fps: FPS, config: SPAWN, durationInFrames: 16});
  return (
    <div style={{position: "relative", transform: `scale(${s})`}}>
      <div style={{position: "absolute", left: -scale + dx, opacity: 0.6 * g, mixBlendMode: "screen"}}><PixelText text="?" scale={scale} style="red" /></div>
      <div style={{position: "absolute", left: scale - dx, opacity: 0.5 * g, filter: "hue-rotate(160deg) saturate(3)", mixBlendMode: "screen"}}><PixelText text="?" scale={scale} style="red" /></div>
      <div style={{transform: `translateX(${dx}px)`}}><PixelText text="?" scale={scale} style="dim" /></div>
    </div>
  );
};

/* ═════════════ A. Путь ═════════════ */
const CW = 460, CH = 580; // карточка
const NODES = [
  {x: 700, y: 760}, {x: 1900, y: 420}, {x: 3050, y: 780}, {x: 4150, y: 430}, {x: 5250, y: 760},
];
// камера: [время, центр x, центр y, зум]
const CAM: [number, number, number, number][] = [
  [0, NODES[0].x, NODES[0].y, 1.55],
  [1.45, NODES[0].x, NODES[0].y, 1.62],
  [1.85, NODES[1].x, NODES[1].y, 1.55],
  [3.15, NODES[1].x, NODES[1].y, 1.62],
  [3.45, NODES[2].x, NODES[2].y, 1.4],
  [3.75, NODES[2].x, NODES[2].y, 1.42],
  [4.0, NODES[3].x, NODES[3].y, 1.4],
  [4.25, NODES[3].x, NODES[3].y, 1.42],
  [4.5, NODES[4].x, NODES[4].y, 1.4],
  [4.9, NODES[4].x, NODES[4].y, 1.42],
  [5.8, 2975, 640, 0.33],
  [7.5, 2975, 640, 0.34],
];
const REVEAL = [0.2, 1.95, 3.5, 4.05, 4.55]; // когда карточка появляется
export const bossPathFrames = f(7.5);

const camAt = (t: number) => {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const [t0, x0, y0, z0] = CAM[i], [t1, x1, y1, z1] = CAM[i + 1];
  const k = ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
  // по пути камера чуть отъезжает, чтобы было ощущение полёта
  const dip = Math.sin(k * Math.PI) * (Math.hypot(x1 - x0, y1 - y0) > 400 ? 0.18 : 0);
  return {x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, z: z0 + (z1 - z0) * k - dip};
};

const PathCard: React.FC<{i: number; at: number}> = ({i, at}) => {
  const frame = useCurrentFrame();
  const boss = BOSSES[i];
  const world = WORLDS[boss.world];
  const open = i < SHOWN;
  const s = frame < at ? 0 : spring({frame: frame - at, fps: FPS, config: {damping: 13, stiffness: 170, mass: 0.7}, durationInFrames: 26});
  const pop = frame < at + 8 ? 0 : spring({frame: frame - at - 8, fps: FPS, config: SPAWN, durationInFrames: 22});
  const col = open ? world.color : "#3a3a52";
  return (
    <div style={{position: "absolute", left: NODES[i].x - CW / 2, top: NODES[i].y - CH / 2, width: CW, height: CH, transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + 0.15 * s})`, opacity: s}}>
      <div style={{position: "absolute", inset: 0, border: `8px solid ${col}`, background: open ? "#0b0b12" : "#0d0d16", boxShadow: `0 0 ${open ? 50 : 10}px ${col}66, 0 30px 60px rgba(0,0,0,0.7)`, overflow: "hidden"}}>
        {open ? (
          <>
            <Img src={staticFile(`overspam/site/bosses/${boss.id}-1.webp`)} style={{position: "absolute", height: "100%", left: "50%", transform: "translateX(-50%)", filter: "brightness(0.55) saturate(1.1)"}} />
            <AbsoluteFill style={{background: "linear-gradient(transparent 40%, rgba(7,7,13,0.95) 78%)"}} />
          </>
        ) : (
          <AbsoluteFill style={{alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(45deg, #0d0d16 0 18px, #11111c 18px 36px)"}}>
            <GlitchQ at={at + 6} scale={22} />
          </AbsoluteFill>
        )}
      </div>
      {open && (
        <Img src={staticFile(`overspam/site/bosses/${boss.id}.webp`)} style={{
          position: "absolute", left: CW / 2 - 200, top: -150, width: 400, height: 500, transformOrigin: "50% 100%",
          transform: `translateY(${(1 - pop) * 80}px) scale(${0.7 + 0.3 * pop})`, opacity: pop, filter: `drop-shadow(0 0 30px ${col}aa)`,
        }} />
      )}
      <div style={{position: "absolute", left: 24, top: 22}}><PixelText text={`BOSS ${i + 1}`} scale={3} style="white" /></div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: open ? pop : s}}>
        <PixelText text={open ? boss.name : "???"} scale={4} style={open ? "logo" : "dim"} />
        <PixelText text={open ? world.name : "LOCKED"} scale={3} style="dim" noOutline />
      </div>
    </div>
  );
};

export const BossPath: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = camAt(t), p = camAt(t - 1 / FPS);
  const speed = Math.hypot(c.x - p.x, c.y - p.y) * c.z;
  const blur = Math.min(9, speed / 14);
  // линия рисуется к следующей карточке, пока камера летит
  const segP = (k: number) => interpolate(t, [REVEAL[k + 1] - (k === 0 ? 0.45 : 0.3), REVEAL[k + 1]], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: "radial-gradient(120% 90% at 50% 40%, #11111c, #050508)", overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${960 - c.x * c.z}px, ${540 - c.y * c.z}px) scale(${c.z})`, filter: blur > 0.4 ? `blur(${blur}px)` : undefined}}>
        <svg width={6000} height={1300} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
          {NODES.slice(0, -1).map((a, k) => {
            const b = NODES[k + 1];
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const pr = segP(k);
            const col = k + 1 < SHOWN ? GOLD : "#7a7a9a";
            return (
              <g key={k}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#20202e" strokeWidth={16} strokeDasharray="30 18" />
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col} strokeWidth={16} strokeDasharray={`${len * pr} ${len}`} style={{filter: `drop-shadow(0 0 10px ${col})`}} />
                {pr > 0 && pr < 1 && <rect x={a.x + (b.x - a.x) * pr - 18} y={a.y + (b.y - a.y) * pr - 18} width={36} height={36} fill="#fffae8" transform={`rotate(45 ${a.x + (b.x - a.x) * pr} ${a.y + (b.y - a.y) * pr})`} />}
              </g>
            );
          })}
        </svg>
        {NODES.map((_, i) => <PathCard key={i} i={i} at={f(REVEAL[i])} />)}
      </div>
      {/* итог на отъезде */}
      <AbsoluteFill style={{alignItems: "center", paddingTop: 90, opacity: interpolate(t, [5.6, 6.0], [0, 1], clamp)}}>
        <PixelText text="5 BOSSES" scale={9} style="logo" />
        <div style={{height: 22}} />
        <PixelText text={`${SHOWN} REVEALED · ${5 - SHOWN} WAITING`} scale={3} style="dim" spacing={2} noOutline />
      </AbsoluteFill>
      <AbsoluteFill style={{background: "radial-gradient(85% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.6))"}} />
    </AbsoluteFill>
  );
};

/* ═════════════ B. Силуэты под прожектором ═════════════ */
export const bossLineupFrames = f(7.5);
const LX = [240, 600, 960, 1320, 1680]; // центры фигур
const LH = 410;
const LIGHT = [0.35, 1.85]; // включение прожектора на боссе 1 и 2
const QS = [3.85, 4.1, 4.35]; // «?» над 3, 4, 5

export const BossLineup: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // камера: близко на боссе 1 → плавно к боссу 2 → отъезд на весь ряд
  const keys: [number, number, number][] = [[0, LX[0], 1.75], [1.4, LX[0], 1.8], [1.8, LX[1], 1.75], [3.0, LX[1], 1.8], [3.6, 960, 1.0], [7.5, 960, 1.03]];
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const k = ease(Math.min(1, Math.max(0, (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]))));
  const cx = keys[i][1] + (keys[i + 1][1] - keys[i][1]) * k;
  const z = keys[i][2] + (keys[i + 1][2] - keys[i][2]) * k;
  const cy = 600;
  return (
    <AbsoluteFill style={{background: "#050508", overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(${960 - cx * z}px, ${540 - cy * z}px) scale(${z})`}}>
        {/* пол */}
        <div style={{position: "absolute", left: -400, right: -400, top: 760, height: 500, background: "linear-gradient(#14141f, #050508)"}} />
        {BOSSES.map((b, n) => {
          const world = WORLDS[b.world];
          const on = n < SHOWN ? interpolate(t, [LIGHT[n], LIGHT[n] + 0.25], [0, 1], clamp) : 0;
          const punch = n < SHOWN && frame >= f(LIGHT[n]) ? 1 + 0.05 * (1 - spring({frame: frame - f(LIGHT[n]), fps: FPS, config: SPAWN, durationInFrames: 14})) : 1;
          const name = n < SHOWN && frame >= f(LIGHT[n] + 0.2) ? spring({frame: frame - f(LIGHT[n] + 0.2), fps: FPS, config: SPAWN, durationInFrames: 18}) : 0;
          return (
            <React.Fragment key={b.id}>
              {/* луч прожектора */}
              <div style={{position: "absolute", left: LX[n] - 260, top: -200, width: 520, height: 1000, opacity: on * 0.55,
                background: `linear-gradient(${world.color}00, ${world.color}33 60%, ${world.color}10)`, clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)"}} />
              <div style={{position: "absolute", left: LX[n] - 210, top: 760 - 30, width: 420, height: 60, borderRadius: "50%", background: `radial-gradient(${world.color}${on > 0 ? "55" : "00"}, transparent 70%)`, opacity: on}} />
              <Img src={staticFile(`overspam/site/bosses/${b.id}.webp`)} style={{
                position: "absolute", left: LX[n] - (LH * 0.8) / 2, top: 790 - LH, width: LH * 0.8, height: LH, transformOrigin: "50% 100%", transform: `scale(${punch})`,
                filter: `brightness(${0.02 + 0.98 * on}) drop-shadow(0 0 3px ${on > 0.5 ? world.color : "#2a2a40"}) drop-shadow(0 0 ${30 * on}px ${world.color}88)`,
              }} />
              {n < SHOWN ? (
                <div style={{position: "absolute", left: LX[n] - 300, width: 600, top: 820, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: name, transform: `translateY(${(1 - name) * 12}px)`}}>
                  <PixelText text={b.name} scale={3} style="logo" />
                  <PixelText text={world.name} scale={2} style="dim" noOutline />
                </div>
              ) : (
                <div style={{position: "absolute", left: LX[n] - 60, top: 400, width: 120, display: "flex", justifyContent: "center"}}>
                  <GlitchQ at={f(QS[n - SHOWN])} scale={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <AbsoluteFill style={{alignItems: "center", paddingTop: 90, opacity: interpolate(t, [4.8, 5.2], [0, 1], clamp)}}>
        <PixelText text="5 BOSSES" scale={9} style="logo" />
        <div style={{height: 22}} />
        <PixelText text={`${SHOWN} REVEALED · ${5 - SHOWN} WAITING`} scale={3} style="dim" spacing={2} noOutline />
      </AbsoluteFill>
      <AbsoluteFill style={{background: "radial-gradient(85% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.65))"}} />
    </AbsoluteFill>
  );
};
