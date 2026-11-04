import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {CARD, GAME, ITEMS, TOMES, WEAPONS} from "./data";
import {PixelText} from "./PixelText";

/* ───────────── Билд-турбина под трек teaser60c_v2 (16,80–21,8 с) ─────────────
   Клип ставится на 16,80 с трека. Кадр 6 = 16,90 глубокий удар: на чёрном тяжело встаёт кольцо из иконок
   (оружие, предметы, карты). 17–19 с гул: кольцо медленно вращается, проступают 33 WEAPONS · 85 ITEMS ·
   23 CARDS · 12 PASSIVES (по углам вокруг кольца). С 19,1 с звон «а-А-а» (пульс ~8,3 раза в секунду): кольцо разгоняется в такт
   и смазывается в раскалённый диск. 20,69 с дроп: диск схлопывается в центр, бьёт 1 BUILD / NOBODY PLANNED. */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const T0 = 16.8; // начало клипа на треке
const at = (s: number) => Math.round((s - T0) * FPS);
const HIT = at(16.9);
const HUM = at(19.1);
const DROP = at(20.69);
const PULSE = 0.12 * FPS; // период «а-А-а», кадры
export const buildTurbineFrames = DROP + 66;

const N = 24;
const R = 330;
const ICONS = Array.from({length: N}, (_, i) =>
  i % 3 === 0 ? GAME(WEAPONS[(i * 7) % WEAPONS.length]) : i % 3 === 1 ? GAME(ITEMS[(i * 11) % ITEMS.length]) : CARD(`${TOMES[(i * 5) % TOMES.length]}_card`),
);
const TERMS = [
  {n: "33", w: "WEAPONS", x: -560, y: -300},
  {n: "85", w: "ITEMS", x: 560, y: -300},
  {n: "23", w: "CARDS", x: 560, y: 300},
  {n: "12", w: "PASSIVES", x: -560, y: 300},
];

/** угол кольца (радианы) к кадру f: медленно на гуле, с HUM разгон по экспоненте */
const angleAt = (f: number) => {
  const slow = 0.18 / FPS; // рад за кадр
  if (f < HUM) return Math.max(0, f - HIT) * slow;
  const base = (HUM - HIT) * slow;
  const t = (f - HUM) / FPS;
  const k = 2.6; // скорость роста
  return base + slow * FPS * t + 0.9 * (Math.exp(k * t) - 1);
};

export const BuildTurbine: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - HIT;
  if (t < 0) return <AbsoluteFill style={{background: "#000"}} />;
  const land = spring({frame: t, fps: FPS, config: {damping: 13, stiffness: 260, mass: 0.8}, durationInFrames: 22});
  const shake = t < 14 ? Math.round((Math.sin(t * 2.7) * (1 - t / 14)) * 3) * 4 : 0;
  // разгон: 0 на гуле → 1 к дропу
  const spin = interpolate(frame, [HUM, DROP], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const pulse = frame >= HUM ? 0.5 + 0.5 * Math.cos(((frame - HUM) / PULSE) * Math.PI * 2) : 0;
  const ringScale = (0.86 + 0.14 * land) * (1 + 0.035 * spin * pulse) * (1 + 0.06 * spin);
  // схлопывание на дроп
  const c = frame >= DROP - 5 ? interpolate(frame, [DROP - 5, DROP + 1], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)}) : 1;
  const glow = interpolate(t, [0, 4, 30], [0.9, 0.9, 0.25], clamp) + spin * 0.75 + 0.15 * pulse * spin;
  const termsOut = interpolate(frame, [HUM + 10, HUM + 40], [1, 0], clamp);
  const post = frame - DROP;
  const big = post >= 0 ? spring({frame: post, fps: FPS, config: {damping: 11, stiffness: 300, mass: 0.6}, durationInFrames: 18}) : 0;
  const sub = post >= 8 ? spring({frame: post - 8, fps: FPS, config: {damping: 14, stiffness: 240, mass: 0.6}, durationInFrames: 16}) : 0;
  const postShake = post >= 0 && post < 14 ? Math.round((Math.sin(post * 3.1) * (1 - post / 14)) * 3) * 5 : 0;
  // смаз: копии кольца на прошлых углах, больше при разгоне
  const trails = Math.round(spin * 10);
  return (
    <AbsoluteFill style={{background: "#05040a", overflow: "hidden"}}>
      {/* жар в центре */}
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{width: 1100, height: 1100, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,140,60,0.55), rgba(255,60,40,0.18) 55%, transparent)", opacity: Math.min(1, glow) * (post >= 0 ? interpolate(post, [0, 30], [1.4, 0.5], clamp) : 1), transform: `scale(${0.6 + 0.5 * spin + (post >= 0 ? 0.3 : 0)})`, filter: "blur(20px)"}} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${shake + postShake}px, ${shake * 0.6}px)`}}>
        {/* кольцо иконок и смаз */}
        {c > 0.01 &&
          Array.from({length: trails + 1}, (_, k) => {
            const a0 = angleAt(frame - k * 0.6);
            const op = k === 0 ? 1 : 0.5 * (1 - k / (trails + 1)) * spin;
            return (
              <AbsoluteFill key={k} style={{alignItems: "center", justifyContent: "center", opacity: op}}>
                {ICONS.map((src, i) => {
                  const a = a0 + (i / N) * Math.PI * 2;
                  const r = R * ringScale * c;
                  const isCard = src.includes("224x304");
                  const s = 104 * (0.6 + 0.4 * land) * (1 + 0.15 * spin * pulse) * (0.4 + 0.6 * c);
                  return (
                    <Img
                      key={i}
                      src={staticFile(src)}
                      style={{
                        position: "absolute",
                        width: isCard ? s * 0.74 : s,
                        height: s,
                        transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px) rotate(${a + Math.PI / 2}rad)`,
                        imageRendering: "pixelated",
                        filter: `brightness(${1 + 0.8 * spin * (0.6 + 0.4 * pulse)}) drop-shadow(0 0 ${8 + 30 * spin}px rgba(255,150,70,${0.4 + 0.5 * spin}))`,
                      }}
                    />
                  );
                })}
              </AbsoluteFill>
            );
          })}
        {/* числа вокруг кольца, по одному на гуле */}
        {post < 0 &&
          TERMS.map((tm, i) => {
            const st = HIT + 8 + i * 26;
            const s = frame >= st ? spring({frame: frame - st, fps: FPS, config: {damping: 14, stiffness: 220, mass: 0.8}, durationInFrames: 18}) : 0;
            if (s <= 0) return null;
            return (
              <AbsoluteFill key={tm.w} style={{alignItems: "center", justifyContent: "center"}}>
                <div style={{position: "absolute", transform: `translate(${tm.x}px, ${tm.y}px) scale(${0.7 + 0.3 * s})`, opacity: s * termsOut, display: "flex", flexDirection: "column", alignItems: "center", gap: 8}}>
                  <PixelText text={tm.n} scale={11} style="logo" />
                  <PixelText text={tm.w} scale={4} style="white" />
                </div>
              </AbsoluteFill>
            );
          })}
        {/* дроп: 1 BUILD / NOBODY PLANNED */}
        {post >= 0 && (
          <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 40}}>
            <div style={{transform: `scale(${1.5 - 0.5 * big})`, opacity: Math.min(1, post / 2), display: "flex", gap: 60, alignItems: "flex-end"}}>
              <PixelText text="1" scale={28} style="logo" />
              <PixelText text="BUILD" scale={28} style="logo" />
            </div>
            <div style={{transform: `translateY(${(1 - sub) * 40}px)`, opacity: sub}}>
              <PixelText text="NOBODY PLANNED" scale={10} style="white" />
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
