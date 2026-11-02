import React from "react";
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {FOOTAGE} from "./data";

/* ───────────── Сундуки: каждый кусок ждёт анимацию до конца ─────────────
   В каждом куске: чуть-чуть подхода (владелец сам подрежет) → выскакивает пиксельный сундук → карточка награды
   висит до конца → склейка. Без белой вспышки и без надписи сверху (владелец убрал счётчик CHESTS).
   Моменты найдены по яркости кадра: в начале анимации сундука экран резко темнеет. */
type Piece = {src: string; from: number; to: number; pop: number};
// from / to / pop — секунды в записи (pop = выскакивает сундук). Каждый кусок держится 0,85 с от сундука: владелец просил быстрее
export const CHEST_PIECES: Piece[] = [
  // 1-й кусок с подходом (владелец подрежет), дальше каждый начинается сразу с анимации сундука (кадр, где экран темнеет)
  {src: "chests/chest_3.mp4", from: 0.45, to: 1.87, pop: 1.02}, // Лес
  {src: "chests/chest_1.mp4", from: 1.82, to: 2.67, pop: 1.82}, // Dead Internet
  {src: "chests/chest_4.mp4", from: 0.82, to: 1.67, pop: 0.82}, // Луна
  {src: "chests/chest_5.mp4", from: 0.87, to: 1.72, pop: 0.87}, // Dead Internet, бой
];

const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const starts = CHEST_PIECES.reduce<number[]>((a, p, i) => [...a, i === 0 ? 0 : a[i - 1] + f(CHEST_PIECES[i - 1].to - CHEST_PIECES[i - 1].from)], []);
export const chestsOpenFrames = starts[starts.length - 1] + f(CHEST_PIECES[CHEST_PIECES.length - 1].to - CHEST_PIECES[CHEST_PIECES.length - 1].from);

const Piece: React.FC<{p: Piece}> = ({p}) => {
  const frame = useCurrentFrame();
  // мягкий наезд на склейке, без вспышки
  const punch = interpolate(frame, [0, 10], [1.06, 1], clamp);
  return (
    <AbsoluteFill style={{transform: `scale(${punch})`}}>
      <OffthreadVideo src={staticFile(FOOTAGE(p.src))} startFrom={f(p.from)} muted style={{width: "100%", height: "100%"}} />
    </AbsoluteFill>
  );
};

export const ChestsOpen: React.FC = () => {
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {CHEST_PIECES.map((p, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={f(p.to - p.from)}>
          <Piece p={p} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
