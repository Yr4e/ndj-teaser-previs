import React from "react";
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {GOLD} from "./data";
import {PixelLogo, PixelText} from "./PixelText";

/* ───────────── Опенер-шаблон под звук рефа Fast Cuts ─────────────
   Слоты стоят ровно на удары звука рефа (public/sfx/ref/fastcuts.wav, найдены по спектру).
   Владелец кладёт свои клипы в CapCut поверх слотов: начало и длина написаны на каждом слоте.
   С 4,00 с титр (удар в чёрное), с 6,76 с знак студии (второй удар). */
export type OpenerCutsProps = {audio: boolean; top: string; bottom: string; byline: string; studio: string};
export const OPENER_CUTS_DEFAULTS: OpenerCutsProps = {
  audio: true,
  top: "INTRODUCING",
  bottom: "5 WORLDS · 12 HEROES · ONE RIDICULOUS RUN",
  byline: "FROM THE CREATORS OF",
  studio: "INPUTLAG.APP",
};

const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/** начала слотов, секунды (удары звука рефа); последний = титр */
export const OPENER_CUTS = [0, 1.96, 2.33, 2.746, 3.036, 3.2, 3.375, 3.505, 3.664, 3.794, 3.866, 3.936];
const TITLE = 4.0;
const STUDIO = 6.755;
const END = 9.33;
export const openerCutsFrames = f(END);

const Slot: React.FC<{n: number; from: number; to: number}> = ({n, from, to}) => {
  const frame = useCurrentFrame();
  const len = to - from;
  const punch = n === 1 ? 1 : interpolate(frame, [0, 8], [1.12, 1], clamp);
  const pop = n === 1 ? 1 : interpolate(frame, [0, 4], [1.3, 1], clamp);
  const big = len > 0.2;
  return (
    <AbsoluteFill style={{background: n % 2 ? "linear-gradient(135deg, #1b1a28, #0b0b12)" : "linear-gradient(135deg, #12202a, #0b0b12)", transform: `scale(${punch})`, filter: `brightness(${pop})`}}>
      <AbsoluteFill style={{border: `10px solid ${n % 2 ? GOLD : "#6ff3ff"}`, opacity: 0.5}} />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 28}}>
        <PixelText text={`CUT ${String(n).padStart(2, "0")}`} scale={big ? 16 : 22} style="logo" />
        {big && <PixelText text={n === 1 ? "SLOW FLYBY / WIDE SHOT" : "YOUR CLIP"} scale={4} style="white" />}
        <PixelText text={`${from.toFixed(2)} S → ${to.toFixed(2)} S · ${len.toFixed(2)} S`} scale={big ? 4 : 5} style="dim" noOutline />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Мягкое проявление из размытия */
const Soft: React.FC<{at: number; until: number; children: React.ReactNode}> = ({at, until, children}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 6, until - 12, until], [0, 1, 1, 0], clamp);
  const t = interpolate(frame - at, [0, 14], [1, 0], clamp);
  return <div style={{opacity: o, filter: `blur(${t * 6}px)`, transform: `scale(${1 + t * 0.05})`}}>{children}</div>;
};

export const OpenerCuts: React.FC<OpenerCutsProps> = ({audio, top, bottom, byline, studio}) => {
  const ends = [...OPENER_CUTS.slice(1), TITLE];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {OPENER_CUTS.map((s, i) => (
        <Sequence key={i} from={f(s)} durationInFrames={f(ends[i]) - f(s)}>
          <Slot n={i + 1} from={s} to={ends[i]} />
        </Sequence>
      ))}
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 30}}>
        <Soft at={f(TITLE)} until={f(STUDIO)}>
          <PixelText text={top} scale={3} style="dim" spacing={3} noOutline />
        </Soft>
        <Soft at={f(TITLE) + 3} until={f(STUDIO)}>
          <PixelLogo scale={14} />
        </Soft>
        <Soft at={f(TITLE) + 8} until={f(STUDIO)}>
          <PixelText text={bottom} scale={3} style="dim" spacing={2} noOutline />
        </Soft>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 22}}>
        <Soft at={f(STUDIO)} until={f(END) + 12}>
          <PixelText text={byline} scale={3} style="dim" spacing={3} noOutline />
        </Soft>
        <Soft at={f(STUDIO) + 5} until={f(END) + 12}>
          <div style={{display: "flex", alignItems: "center", gap: 20}}>
            <div style={{width: 18, height: 18, border: `4px solid ${GOLD}`, transform: "rotate(45deg)", boxShadow: `0 0 14px ${GOLD}88`}} />
            <PixelText text={studio} scale={5} style="logo" />
          </div>
        </Soft>
      </AbsoluteFill>
      {audio && <Audio src={staticFile("sfx/ref/fastcuts.wav")} />}
    </AbsoluteFill>
  );
};
