import React from "react";
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from "remotion";
import {FOOTAGE} from "./data";
import {SPAWN} from "./kit";

/* ───────────── Шрайны: показать механику ─────────────
   Золотой → обычный → золотой. В каждом куске: конец захвата (~70% круга) и вспышка → карты (коротко) →
   выбор → удар в землю. На ударе: глоу цвета шрайна, небольшая тряска и зум. Темп как у сундуков.
   Моменты найдены по яркости кадра (экран темнеет под картами, вспыхивает на ударе). */
type Seg = {from: number; to: number};
type Shrine = {src: string; color: string; capture: Seg; cards: Seg; pick: Seg; slam: Seg};
const SHRINES: Shrine[] = [
  // клипы владельца D:B8 (4 нояб.); длины кусков те же, что в первой версии; моменты найдены по яркости (карты — затемнение, удар — вспышка)
  {src: "shr/1028-1.mp4", color: "255,200,70", capture: {from: 5.2, to: 6.38}, cards: {from: 6.45, to: 6.8}, pick: {from: 7.317, to: 7.85}, slam: {from: 7.85, to: 8.45}}, // Лес, золотой
  {src: "shr/1028-3.mp4", color: "90,230,255", capture: {from: 4.567, to: 5.65}, cards: {from: 5.717, to: 6.067}, pick: {from: 6.133, to: 6.667}, slam: {from: 6.667, to: 7.267}}, // Купол, обычный
  {src: "shr/1028-2.mp4", color: "255,200,70", capture: {from: 3.45, to: 4.75}, cards: {from: 4.817, to: 5.167}, pick: {from: 5.95, to: 6.433}, slam: {from: 6.433, to: 7.033}}, // Пустыня, золотой
];

const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const len = (s: Seg) => f(s.to) - f(s.from);

type Shot = {start: number; src: string; seg: Seg; kind: "capture" | "cards" | "pick" | "slam"; color: string};
const SHOTS: Shot[] = [];
let cursor = 0;
for (const sh of SHRINES)
  for (const kind of ["capture", "cards", "pick", "slam"] as const) {
    SHOTS.push({start: cursor, src: sh.src, seg: sh[kind], kind, color: sh.color});
    cursor += len(sh[kind]);
  }
export const shrinesFrames = cursor;

const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const frame = useCurrentFrame();
  const slam = s.kind === "slam";
  const first = s.kind === "capture";
  // удар: зум-пружина, тряска, яркость
  const punch = slam ? 0.1 * (1 - spring({frame, fps: FPS, config: SPAWN, durationInFrames: 18})) : first ? interpolate(frame, [0, 8], [0.05, 0], clamp) : 0;
  const shake = slam && frame < 12 ? Math.round((1 - frame / 12) * 3) * 4 : 0;
  const bright = slam ? interpolate(frame, [0, 3, 18], [1.3, 1.25, 1], clamp) : 1;
  const glow = slam ? interpolate(frame, [0, 3, 30], [0, 1, 0], clamp) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${shake * Math.sin(frame * 2.9)}px, ${shake * Math.cos(frame * 3.6)}px) scale(${1 + punch})`, filter: `brightness(${bright}) contrast(1.05) saturate(1.1)`}}>
        <OffthreadVideo src={staticFile(FOOTAGE(s.src))} startFrom={f(s.seg.from)} muted style={{width: "100%", height: "100%"}} />
      </AbsoluteFill>
      {glow > 0 && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(45% 45% at 50% 58%, rgba(${s.color},${0.55 * glow}), transparent 70%)`, mixBlendMode: "screen"}} />
          <AbsoluteFill style={{boxShadow: `inset 0 0 220px 40px rgba(${s.color},${0.45 * glow})`}} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const Shrines: React.FC = () => (
  <AbsoluteFill style={{background: "#000"}}>
    {SHOTS.map((s, i) => (
      <Sequence key={i} from={s.start} durationInFrames={len(s.seg)}>
        <ShotView s={s} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
