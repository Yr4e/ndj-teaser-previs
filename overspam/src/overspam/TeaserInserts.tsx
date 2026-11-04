import React from "react";
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame} from "remotion";
import {WORLD_IMG, WORLDS} from "./data";
import {beatFrames, LAND} from "./kit";
import {PixelText} from "./PixelText";

/* ───────────── Вставки полноценного тизера ─────────────
   WorldsSplit: экран режется на 5 косых карт (набросок владельца). Карты въезжают вдоль наклона каждую
   четверть доли, быстро и мягко (правка владельца 2026-11-04: «быстрее и плавнее»), встают с лёгким
   поворотом для объёма, картинка мира внутри едет медленнее рамки (параллакс). Через долю — 5 WORLDS.
   Звук: один цельный вжух на весь проход и один глубокий удар на надпись (ElevenLabs, public/sfx/el/). */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const K = 170; // наклон: верх карты сдвинут вправо относительно низа
const GAP = 7; // половина щели между картами
const IN = 12; // кадров на въезд карты
const START = 4;

const timing = (bpm: number) => {
  const beat = beatFrames(bpm, FPS);
  const starts = WORLDS.map((_, i) => Math.round(START + (i * beat) / 4));
  const title = Math.round(START + beat * 1.5); // на долю после того, как встала последняя карта
  return {starts, title, end: Math.round(title + beat * 1.75)};
};
export const worldsSplitFrames = (p: {bpm: number}) => timing(p.bpm).end;

const Panel: React.FC<{i: number; start: number; title: number}> = ({i, start, title}) => {
  const frame = useCurrentFrame();
  const w = WORLDS[i];
  const X = (k: number) => -K + (k * (1920 + K)) / 5;
  const left = X(i);
  const width = X(i + 1) - X(i) + K;
  const t = frame - start;
  if (t < 0) return null;
  // мягкая посадка без перелёта: ease-out за IN кадров
  const s = interpolate(t, [0, IN], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const flash = interpolate(t, [0, 3, IN + 4], [0, 0.25, 0], clamp);
  // въезд вдоль наклона: чётные сверху, нечётные снизу; объём — лёгкий доворот, потом медленный дрейф
  const dir = i % 2 ? 1 : -1;
  const slide = (1 - s) * 260 * dir;
  const ry = interpolate(s, [0, 1], [-28, -8]) + interpolate(frame, [start, title + 120], [0, 4], clamp);
  const rx = 0;
  const z = (1 - s) * -120;
  const dim = interpolate(frame, [title - 4, title + 6], [1, 0.42], clamp);
  // параллакс: картинка едет против разворота и медленнее рамки
  const pan = interpolate(frame, [start, title + 120], [60, -60], clamp);
  const clip = `polygon(${K + GAP}px 0, ${width - GAP}px 0, ${width - K - GAP}px 1080px, ${GAP}px 1080px)`;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        width,
        height: 1080,
        transformStyle: "preserve-3d",
        transform: `translate(${(-slide * K) / 1080}px, ${slide}px) translateZ(${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`,
        transformOrigin: `${width / 2}px 540px`,
        opacity: Math.min(1, t / 4),
      }}
    >
      {/* толщина карты: тёмная подложка цвета мира, сдвинутая вглубь */}
      <div style={{position: "absolute", inset: 0, clipPath: clip, background: w.color, filter: "brightness(0.35)", transform: "translate(10px, 8px) translateZ(-24px)"}} />
      <div style={{position: "absolute", inset: 0, clipPath: clip, overflow: "hidden", background: "#000"}}>
        <Img
          src={staticFile(WORLD_IMG(w.id))}
          style={{position: "absolute", top: 0, left: -140 + pan, width: width + 280, height: 1080, objectFit: "cover", filter: `brightness(${dim}) saturate(1.1)`}}
        />
        {/* подпись у первой карты сдвинута в видимую часть (левый край за экраном) */}
        {/* блик по левому краю и затемнение к низу под подпись */}
        <AbsoluteFill style={{background: `linear-gradient(100deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 14%), linear-gradient(transparent 55%, rgba(7,7,13,0.9))`}} />
        <AbsoluteFill style={{background: "#fffae8", opacity: flash}} />
        <div style={{position: "absolute", left: Math.max(GAP, -left) + 34, bottom: 46, opacity: dim > 0.6 ? 1 : 0.5}}>
          <PixelText text={`0${i + 1}`} scale={7} color={w.color} />
          <div style={{height: 10}} />
          <PixelText text={w.name} scale={3} style="white" />
        </div>
      </div>
      {/* цветная кромка сверху и снизу */}
      <div style={{position: "absolute", inset: 0, clipPath: clip, boxShadow: `inset 0 6px 0 ${w.color}, inset 0 -6px 0 ${w.color}`}} />
    </div>
  );
};

export const WorldsSplit: React.FC<{bpm: number; sfx: boolean}> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {starts, title} = timing(bpm);
  const tt = frame - title;
  const big = tt >= 0 ? spring({frame: tt, fps: FPS, config: LAND, durationInFrames: 16}) : 0;
  const punch = tt >= 0 ? 0.025 * (1 - spring({frame: tt, fps: FPS, config: LAND, durationInFrames: 16})) : 0;
  return (
    <AbsoluteFill style={{background: "#07070d", overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          perspective: 1700,
          transform: `scale(${1.04 + punch + (frame / 400) * 0.03})`, // без тряски: удар держит звук и наезд
        }}
      >
        {WORLDS.map((_, i) => (
          <Panel key={i} i={i} start={starts[i]} title={title} />
        ))}
      </AbsoluteFill>
      {tt >= 0 && (
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
          <div style={{display: "flex", alignItems: "flex-end", gap: 60, transform: `scale(${1.12 - 0.12 * big})`, opacity: Math.min(1, tt / 5), filter: `blur(${Math.max(0, 6 - tt)}px) drop-shadow(0 16px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(0,0,0,0.7))`}}>
            <PixelText text="5" scale={26} style="logo" />
            <PixelText text="WORLDS" scale={15} style="white" css={{marginBottom: 14}} />
          </div>
        </AbsoluteFill>
      )}
      {sfx && (
        <>
          <Sequence from={Math.max(0, starts[0] - 2)} durationInFrames={110}>
            <Audio src={staticFile("sfx/el/cards_swoosh.mp3")} volume={(f) => 0.5 * interpolate(f, [80, 108], [1, 0], clamp)} />
          </Sequence>
          <Sequence from={title} durationInFrames={160}>
            <Audio src={staticFile("sfx/el/deep_hit.mp3")} volume={(f) => 0.85 * interpolate(f, [120, 158], [1, 0], clamp)} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
