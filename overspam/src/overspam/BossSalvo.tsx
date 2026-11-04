import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {PixelText} from "./PixelText";

/* ───────────── Боссы залпом под трек teaser60c_v2 (вариант 1 — шеренга, выбран владельцем) ─────────────
   Клип ставится на 35,60 с трека. В треке после последнего удара 35,72 идут ещё четыре затухающих удара
   (35,93 / 36,06 / 36,14 / 36,26) — по боссу на каждый: центр, потом попарно изнутри наружу.
   36,36 — 5 BOSSES. Дальше брейк с нарастанием до 37,54: медленный наезд, лёгкая дрожь растёт.
   37,58 бочка возвращается — клип кончается, склейка на геймплей. Глоу маленький, тонкая обводка цветом мира. */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const T0 = 35.6;
const at = (s: number) => Math.round((s - T0) * FPS);
const TXT = at(36.36);
const RISE_END = at(37.54);
export const bossSalvoFrames = at(37.58);

const ORDER = [
  {id: "rootmaw", c: "255,120,40", x: 0, s: 1.08, hit: at(35.72)},
  {id: "pharaoh", c: "255,190,60", x: -330, s: 0.92, hit: at(35.93)},
  {id: "mainframe", c: "60,230,255", x: 330, s: 0.92, hit: at(36.06)},
  {id: "tyrant", c: "170,90,255", x: -640, s: 0.82, hit: at(36.14)},
  {id: "captain", c: "60,140,255", x: 640, s: 0.82, hit: at(36.26)},
];
const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const outline = (c: string) =>
  [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([x, y]) => `drop-shadow(${x}px ${y}px 0 rgba(${c},0.9))`).join(" ");

export const BossSalvo: React.FC = () => {
  const frame = useCurrentFrame();
  // последний удар: дрожь затухает; на нарастании растёт мелкая дрожь
  const lastHit = Math.max(...ORDER.filter((b) => frame >= b.hit).map((b) => b.hit), -99);
  const k = frame - lastHit;
  const hitShake = k >= 0 && k < 10 ? (1 - k / 10) * 10 : 0;
  const rise = interpolate(frame, [TXT, RISE_END], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const amp = hitShake + rise * 5;
  const sx = Math.round((prand(frame * 1.7) - 0.5) * 2 * amp);
  const sy = Math.round((prand(frame * 2.9 + 4) - 0.5) * 2 * amp * 0.6);
  const push = interpolate(frame, [TXT, RISE_END], [1, 1.07], {...clamp, easing: Easing.in(Easing.sin)});
  const txt = frame >= TXT ? spring({frame: frame - TXT, fps: FPS, config: {damping: 16, stiffness: 320, mass: 0.6}, durationInFrames: 14}) : 0;
  return (
    <AbsoluteFill style={{background: "#06050b", overflow: "hidden"}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: "50% 70%"}}>
        {/* небольшой глоу за каждым: вспыхивает на ударе и садится */}
        {ORDER.map((b) => {
          if (frame < b.hit) return null;
          const g = interpolate(frame - b.hit, [0, 3, 24], [0.7, 0.7, 0.28], clamp) + rise * 0.12;
          return <div key={`g${b.id}`} style={{position: "absolute", left: 960 + b.x - 190, top: 560, width: 380, height: 460, background: `radial-gradient(closest-side, rgba(${b.c},${g}), transparent)`, filter: "blur(24px)"}} />;
        })}
        {[...ORDER].sort((a, b) => a.s - b.s).map((b) => {
          if (frame < b.hit) return null;
          const t = frame - b.hit;
          const land = spring({frame: t, fps: FPS, config: {damping: 15, stiffness: 420, mass: 0.6}, durationInFrames: 12});
          const w = 480 * b.s;
          const h = 600 * b.s;
          return (
            <Img
              key={b.id}
              src={staticFile(`overspam/site/bosses/${b.id}.webp`)}
              style={{
                position: "absolute",
                left: 960 + b.x - w / 2,
                top: 1050 - h,
                width: w,
                height: h,
                transformOrigin: "50% 100%",
                transform: `translateY(${(1 - land) * -90}px) scale(${1.18 - 0.18 * land})`,
                filter: `${outline(b.c)} brightness(${interpolate(t, [0, 2, 8], [1.8, 1.8, 1], clamp)}) drop-shadow(0 20px 30px rgba(0,0,0,0.8))`,
              }}
            />
          );
        })}
        <AbsoluteFill style={{background: "linear-gradient(transparent 78%, rgba(6,5,11,0.9))"}} />
      </AbsoluteFill>
      {frame >= TXT && (
        <div style={{position: "absolute", top: 90, width: "100%", display: "flex", justifyContent: "center", gap: 50, transform: `translate(${sx}px, ${sy}px) scale(${1.25 - 0.25 * txt})`}}>
          <PixelText text="5" scale={16} style="logo" />
          <PixelText text="BOSSES" scale={16} style="logo" />
        </div>
      )}
    </AbsoluteFill>
  );
};
