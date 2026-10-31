import React from "react";
import {AbsoluteFill, Audio, getInputProps, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
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

/** Варианты фона вставок, выбираются в teaser.json полем "bg"; "grid" — исходный со свечением и сеткой */
export type BgStyle = "grid" | "deep" | "spot" | "crt" | "dust";
const VIGNETTE = "radial-gradient(80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.75))";
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='256' height='256' filter='url(%23n)' opacity='0.5'/></svg>")`;

/** Почти чёрный фон без свечения и сетки: живая плёночная зернистость, мягкое пятно света, CRT-строки или пыль */
const DarkBackdrop: React.FC<{style: Exclude<BgStyle, "grid">}> = ({style}) => {
  const frame = useCurrentFrame();
  const base =
    style === "spot"
      ? "radial-gradient(48% 46% at 50% 56%, #1d1c26, #0b0b10 60%, #040406)"
      : "radial-gradient(120% 90% at 50% 40%, #121219, #060609 70%)";
  return (
    <AbsoluteFill style={{background: base}}>
      {style === "crt" && (
        <>
          <AbsoluteFill style={{backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 6px)"}} />
          <AbsoluteFill style={{background: `linear-gradient(transparent ${(frame * 0.6) % 140 - 20}%, rgba(255,255,255,0.03) ${(frame * 0.6) % 140 - 10}%, transparent ${(frame * 0.6) % 140}%)`}} />
        </>
      )}
      {style === "dust" &&
        Array.from({length: 60}, (_, i) => {
          const sp = 0.15 + rand(i + 7) * 0.35;
          const y = 1100 - ((frame * sp + rand(i + 3) * 1200) % 1200);
          const sz = 3 + Math.floor(rand(i + 11) * 3) * 2;
          return (
            <div
              key={i}
              style={{position: "absolute", left: rand(i) * 1920 + Math.sin(frame / 60 + i) * 12, top: y, width: sz, height: sz, background: "#ffffff", opacity: 0.05 + rand(i + 21) * 0.1}}
            />
          );
        })}
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.09, backgroundPosition: `${rand(frame) * 256}px ${rand(frame + 1) * 256}px`, mixBlendMode: "screen"}} />
      <AbsoluteFill style={{background: VIGNETTE}} />
    </AbsoluteFill>
  );
};

/** Тёмный фон с цветным свечением, пиксельной сеткой и виньеткой */
export const Backdrop: React.FC<{glow: string; glow2?: string}> = ({glow, glow2}) => {
  const bg = (getInputProps() as {bg?: BgStyle}).bg ?? "grid";
  if (bg !== "grid") return <DarkBackdrop style={bg} />;
  return <GridBackdrop glow={glow} glow2={glow2} />;
};

const GridBackdrop: React.FC<{glow: string; glow2?: string}> = ({glow, glow2}) => {
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
      <AbsoluteFill style={{background: VIGNETTE}} />
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
  // вставки из teaser.json "noFlash" рендерятся без белой вспышки на импакте
  if ((getInputProps() as {flash?: boolean}).flash === false) return null;
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
