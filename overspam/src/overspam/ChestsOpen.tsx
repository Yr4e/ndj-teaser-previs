import React from "react";
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {FOOTAGE} from "./data";
import {Counter} from "./kit";

/* ───────────── Сундуки: каждый кусок ждёт анимацию до конца ─────────────
   В каждом куске: чуть-чуть подхода (владелец сам подрежет) → выскакивает пиксельный сундук → карточка награды
   висит до конца → склейка. Без белой вспышки. Сверху счётчик CHESTS прибавляется в момент, когда выскакивает сундук. */
type Piece = {src: string; from: number; to: number; pop: number};
// from / to / pop — секунды в записи (pop = выскакивает сундук)
export const CHEST_PIECES: Piece[] = [
  {src: "chests/chest_3.mp4", from: 0.45, to: 2.45, pop: 0.9}, // Лес: сундук 0,9 → карточка до 2,4
  {src: "chests/chest_1.mp4", from: 1.4, to: 3.45, pop: 1.95}, // Dead Internet: сундук 1,95 → карточка до 3,4
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
  const frame = useCurrentFrame();
  const pops = CHEST_PIECES.map((p, i) => starts[i] + f(p.pop - p.from));
  const n = pops.filter((t) => frame >= t).length;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {CHEST_PIECES.map((p, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={f(p.to - p.from)}>
          <Piece p={p} />
        </Sequence>
      ))}
      <AbsoluteFill style={{background: "linear-gradient(rgba(0,0,0,0.7), transparent 22%)"}} />
      <AbsoluteFill style={{alignItems: "center", paddingTop: 50, opacity: interpolate(frame, [0, 10], [0, 1], clamp)}}>
        <Counter value={n} label="CHESTS" ticks={pops} numScale={14} labelScale={8} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
