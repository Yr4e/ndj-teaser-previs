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
  {src: "events/event_2.mp4", color: "255,200,70", capture: {from: 3.0, to: 4.18}, cards: {from: 4.25, to: 4.6}, pick: {from: 5.75, to: 6.28}, slam: {from: 6.28, to: 6.88}}, // Лес, золотой
  {src: "events/event_1.mp4", color: "90,230,255", capture: {from: 5.0, to: 6.08}, cards: {from: 6.15, to: 6.5}, pick: {from: 7.75, to: 8.28}, slam: {from: 8.28, to: 8.88}}, // Луна, обычный
  {src: "events/event_3.mp4", color: "255,200,70", capture: {from: 4.9, to: 6.2}, cards: {from: 6.3, to: 6.65}, pick: {from: 7.5, to: 7.98}, slam: {from: 7.98, to: 8.58}}, // Abyss Dome, золотой
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
