import React from "react";
import {AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BG} from "./data";
import {PixelText, PixelStyle} from "./PixelText";

/** Пружина с перелётом для «спавна» */
export const SPAWN = {damping: 10, stiffness: 260, mass: 0.6};
export const LAND = {damping: 14, stiffness: 220, mass: 0.7};

/** Кадров в доле такта при данном BPM */
export const beatFrames = (bpm: number, fps: number) => (60 / bpm) * fps;

/** Детерминированный псевдослучайный генератор */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Тёмный фон с цветным свечением, пиксельной сеткой и виньеткой */
export const Backdrop: React.FC<{glow: string; glow2?: string}> = ({glow, glow2}) => {
  const frame = useCurrentFrame();
  const drift = frame * 0.15;
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 45% at ${50 + Math.sin(drift / 40) * 4}% 58%, ${glow}33, transparent 70%)${
            glow2 ? `, radial-gradient(40% 35% at 18% 20%, ${glow2}22, transparent 70%)` : ""
          }`,
        }}
      />
      {/* пиксельная сетка 8 px */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          backgroundPosition: `0 ${drift}px`,
        }}
      />
      <AbsoluteFill style={{background: "radial-gradient(80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.75))"}} />
    </AbsoluteFill>
  );
};

/** Тряска камеры после удара (затухает за ~14 кадров) и медленный наезд */
export const Camera: React.FC<{hits: number[]; push?: number; children: React.ReactNode}> = ({hits, push = 0.035, children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  let dx = 0;
  let dy = 0;
  let punch = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t < 0 || t > 16) continue;
    const a = Math.pow(1 - t / 16, 2);
    dx += Math.sin(t * 2.7 + h) * 14 * a;
    dy += Math.cos(t * 3.1 + h) * 10 * a;
    punch += 0.025 * a;
  }
  const s = 1 + (frame / durationInFrames) * push + punch;
  return (
    <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${s})`}}>{children}</AbsoluteFill>
  );
};

/** Белая вспышка во весь кадр */
export const Flash: React.FC<{at: number; strength?: number; len?: number}> = ({at, strength = 0.55, len = 10}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - at, [0, 1, len], [0, strength, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <AbsoluteFill style={{background: "#fffae8", opacity: o, pointerEvents: "none"}} />;
};

/** Сколько тиков уже прошло к текущему кадру */
export const ticksDone = (frame: number, ticks: number[]) => ticks.filter((t) => frame >= t).length;

/** Счётчик «12 HEROES»: число в стиле логотипа подпрыгивает на каждом тике */
export const Counter: React.FC<{
  value: number;
  label: string;
  ticks: number[];
  numScale?: number;
  labelScale?: number;
  labelStyle?: PixelStyle;
}> =({value, label, ticks, numScale = 22, labelScale = 12, labelStyle = "white"}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = [...ticks].reverse().find((t) => frame >= t) ?? -999;
  const isLast = last === ticks[ticks.length - 1];
  const bump = spring({frame: frame - last, fps, config: SPAWN, durationInFrames: 12});
  const s = frame >= last ? 1 + (isLast ? 0.35 : 0.14) * (1 - bump) : 1;
  const appear = spring({frame, fps, config: LAND, durationInFrames: 14});
  const digits = String(value);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: numScale * 3,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
      }}
    >
      <div style={{transform: `scale(${s})`, transformOrigin: "50% 80%"}}>
        <PixelText text={digits} scale={numScale} style="logo" />
      </div>
      <PixelText text={label} scale={labelScale} style={labelStyle} css={{marginBottom: numScale * 0.6}} />
    </div>
  );
};

/** Звук тика с повышением тона по кругу и финальный удар */
export const TickSfx: React.FC<{ticks: number[]; every?: number; volume?: number; slam?: number; slamVolume?: number}> = ({
  ticks,
  every = 1,
  volume = 0.5,
  slam,
  slamVolume = 0.8,
}) => (
  <>
    {ticks.map((t, i) =>
      i % every === 0 ? (
        <Sequence key={i} from={Math.round(t)} durationInFrames={30}>
          <Audio src={staticFile(`sfx/foley/count_tick_${Math.min(7, Math.floor((i / ticks.length) * 8))}.mp3`)} volume={volume} />
        </Sequence>
      ) : null,
    )}
    {slam !== undefined && (
      <Sequence from={Math.round(slam)} durationInFrames={90}>
        <Audio src={staticFile("sfx/foley/slam_soft_1.mp3")} volume={slamVolume} />
      </Sequence>
    )}
  </>
);

export const Sfx: React.FC<{at: number; src: string; volume?: number}> = ({at, src, volume = 0.6}) => (
  <Sequence from={Math.round(at)} durationInFrames={120}>
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);
