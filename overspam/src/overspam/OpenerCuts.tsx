import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {FOOTAGE, GOLD} from "./data";
import {rand} from "./kit";
import {PixelLogo, PixelText} from "./PixelText";

/* ───────────── Опенер-шаблон под звук рефа Fast Cuts ─────────────
   Слоты стоят ровно на удары звука рефа (public/sfx/ref/fastcuts.wav, найдены по спектру).
   Владелец кладёт свои клипы в CapCut поверх слотов: начало и длина написаны на каждом слоте.
   С 4,00 с титр (удар в чёрное), с 6,76 с знак студии (второй удар). */
/* clips: клип владельца на каждый слот (null = пустой слот, владелец вставит сам). Клип берётся с начала;
   если он короче слота, чуть замедляется, чтобы закрыть слот без стоп-кадра. */
export type OpenerCutsProps = {audio: boolean; soon: string; begins: string; date: string; clips: (string | null)[]};
export const OPENER_CUTS_DEFAULTS: OpenerCutsProps = {
  audio: true,
  soon: "COMING SOON",
  begins: "THE ADVENTURE BEGINS",
  date: "12.12.2026",
  clips: [null, null, ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `opener/cut${String(n).padStart(2, "0")}.mp4`)],
};
// длины клипов владельца, кадры при 60 fps (cut03…cut12)
const CLIP_FRAMES: Record<string, number> = {
  "opener/cut03.mp4": 14, "opener/cut04.mp4": 15, "opener/cut05.mp4": 17, "opener/cut06.mp4": 8, "opener/cut07.mp4": 6,
  "opener/cut08.mp4": 9, "opener/cut09.mp4": 6, "opener/cut10.mp4": 8, "opener/cut11.mp4": 12, "opener/cut12.mp4": 9,
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

const Clip: React.FC<{src: string; slotFrames: number}> = ({src, slotFrames}) => {
  const frame = useCurrentFrame();
  const have = CLIP_FRAMES[src] ?? slotFrames;
  const rate = Math.min(1, have / slotFrames);
  const punch = interpolate(frame, [0, 8], [1.12, 1], clamp);
  const pop = interpolate(frame, [0, 4], [1.3, 1], clamp);
  return (
    <AbsoluteFill style={{transform: `scale(${punch})`, filter: `brightness(${pop}) contrast(1.05) saturate(1.08)`}}>
      <OffthreadVideo src={staticFile(FOOTAGE(src))} playbackRate={rate} muted style={{width: "100%", height: "100%"}} />
    </AbsoluteFill>
  );
};

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

/** Дата из пиксельного глитча, спокойная версия: цифры перебираются раз в 0,1 с, по одной встают на место, сдвиги на целые пиксели */
const GlitchDate: React.FC<{text: string; at: number; lock: number; scale: number}> = ({text, at, lock, scale}) => {
  const frame = useCurrentFrame();
  const chars = [...text];
  const lockAt = chars.map((_, i) => at + Math.round(((lock - at) * (i + 1)) / chars.length));
  const step = Math.floor(frame / 6);
  const POOL = "0123456789#%&?";
  const shown = chars.map((ch, i) => (ch === "." || frame >= lockAt[i] ? ch : POOL[Math.floor(rand(step * 31 + i * 7) * POOL.length)])).join("");
  // сила глитча плавно затухает к фиксации и ещё 0,4 с после
  const g = interpolate(frame, [at, lock, lock + 24], [1, 0.45, 0], clamp);
  const off = (k: number) => Math.round((rand(step * 13 + k) - 0.5) * 3 * g) * scale;
  const slice = g > 0.05 ? {top: Math.floor(rand(step * 5) * 6) * 14, dx: off(40)} : null;
  return (
    <div style={{position: "relative"}}>
      {g > 0.02 && (
        <>
          <div style={{position: "absolute", left: -scale + off(1), top: 0, opacity: 0.6 * g, mixBlendMode: "screen"}}><PixelText text={shown} scale={scale} style="red" /></div>
          <div style={{position: "absolute", left: scale + off(2), top: 0, opacity: 0.55 * g, filter: "hue-rotate(160deg) saturate(3)", mixBlendMode: "screen"}}><PixelText text={shown} scale={scale} style="red" /></div>
        </>
      )}
      <PixelText text={shown} scale={scale} style="logo" />
      {slice && (
        <div style={{position: "absolute", inset: 0, clipPath: `inset(${slice.top}% 0 ${Math.max(0, 100 - slice.top - 22)}% 0)`, transform: `translateX(${slice.dx}px)`}}>
          <PixelText text={shown} scale={scale} style="logo" />
        </div>
      )}
      {g > 0.3 &&
        Array.from({length: 4}, (_, k) => {
          const r = (n: number) => rand(step * 17 + k * 11 + n);
          return (
            <div key={k} style={{
              position: "absolute", left: `${Math.floor(r(2) * 95)}%`, top: Math.floor(r(3) * 10) * scale,
              width: (2 + Math.floor(r(1) * 6)) * scale, height: scale, background: [GOLD, "#6ff3ff", "#ff4fd8", "#fffae8"][k], opacity: (r(5) > 0.5 ? 0.8 : 0) * g,
            }} />
          );
        })}
    </div>
  );
};

const Store: React.FC<{icon: string; name: string}> = ({icon, name}) => (
  <div style={{display: "flex", alignItems: "center", gap: 14}}>
    <Img src={staticFile(`overspam/stores/${icon}.svg`)} style={{width: 34, height: 34, opacity: 0.9}} />
    <PixelText text={name} scale={3} style="white" noOutline />
  </div>
);

export const OpenerCuts: React.FC<OpenerCutsProps> = ({audio, soon, begins, date, clips}) => {
  const ends = [...OPENER_CUTS.slice(1), TITLE];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {OPENER_CUTS.map((s, i) => (
        <Sequence key={i} from={f(s)} durationInFrames={f(ends[i]) - f(s)}>
          {clips?.[i] ? <Clip src={clips[i]!} slotFrames={f(ends[i]) - f(s)} /> : <Slot n={i + 1} from={s} to={ends[i]} />}
        </Sequence>
      ))}
      {/* кадр 1: COMING SOON / OVERSPAM, снизу площадки */}
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 30}}>
        <Soft at={f(TITLE)} until={f(STUDIO)}>
          <PixelText text={soon} scale={3} style="dim" spacing={3} noOutline />
        </Soft>
        <Soft at={f(TITLE) + 3} until={f(STUDIO)}>
          <PixelLogo scale={14} />
        </Soft>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-end", paddingBottom: 96}}>
        <Soft at={f(TITLE) + 14} until={f(STUDIO)}>
          <div style={{display: "flex", alignItems: "center", gap: 46}}>
            <Store icon="steam" name="STEAM" />
            <div style={{width: 10, height: 10, border: `3px solid ${GOLD}`, transform: "rotate(45deg)", opacity: 0.8}} />
            <Store icon="epicgames" name="EPIC GAMES" />
          </div>
        </Soft>
      </AbsoluteFill>
      {/* кадр 2: THE ADVENTURE BEGINS / дата из глитча */}
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 30}}>
        <Soft at={f(STUDIO)} until={f(END) + 12}>
          <PixelText text={begins} scale={3} style="dim" spacing={3} noOutline />
        </Soft>
        <Soft at={f(STUDIO) + 6} until={f(END) + 12}>
          <GlitchDate text={date} at={f(STUDIO) + 6} lock={f(STUDIO + 1.5)} scale={8} />
        </Soft>
      </AbsoluteFill>
      {audio && <Audio src={staticFile("sfx/ref/fastcuts.wav")} />}
    </AbsoluteFill>
  );
};
