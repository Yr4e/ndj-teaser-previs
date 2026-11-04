import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame} from "remotion";
import {WORLD_IMG, WORLDS} from "./data";
import {beatFrames, LAND, SPAWN} from "./kit";
import {PixelText} from "./PixelText";

/* ───────────── Вставки полноценного тизера ─────────────
   WorldsSplit: экран режется на 5 косых карт (набросок владельца), каждая влетает с поворотом в 3D
   на свою полудолю, внутри картинка мира едет медленнее рамки (параллакс). На сильную долю после пятой —
   удар и 5 WORLDS. Звуки из ElevenLabs владельца: public/sfx/el/. */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const K = 170; // наклон: верх карты сдвинут вправо относительно низа
const GAP = 7; // половина щели между картами
const LAND_DELAY = 8; // через сколько кадров после старта карта «приземляется» (пик звука)
const SLAM_PEAK = [0.11, 0.07]; // атака удара внутри card_slam_1/2, с
const TITLE_PEAK = 0; // title_hit бьёт сразу
const START = 6;

const timing = (bpm: number) => {
  const half = beatFrames(bpm, FPS) / 2;
  const starts = WORLDS.map((_, i) => Math.round(START + i * half));
  const title = Math.round(starts[4] + LAND_DELAY + 2 * half); // на сильную долю после пятой карты
  return {starts, title, end: Math.round(title + beatFrames(bpm, FPS) * 2)};
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
  const s = spring({frame: t, fps: FPS, config: SPAWN, durationInFrames: 22});
  const flash = interpolate(t, [LAND_DELAY - 2, LAND_DELAY, LAND_DELAY + 10], [0, 0.55, 0], clamp);
  // объём: влёт с разворотом, потом медленный доворот (без покачивания)
  const ry = interpolate(s, [0, 1], [-75, -9]) + interpolate(frame, [start, title + 120], [0, 5], clamp);
  const rx = interpolate(s, [0, 1], [18, 0]);
  const z = interpolate(s, [0, 1], [-500, 0]);
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
        transform: `translateZ(${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`,
        transformOrigin: `${width / 2}px 540px`,
        opacity: Math.min(1, t / 3),
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
  const big = tt >= 0 ? spring({frame: tt, fps: FPS, config: SPAWN, durationInFrames: 20}) : 0;
  const punch = tt >= 0 ? 0.035 * (1 - spring({frame: tt, fps: FPS, config: LAND, durationInFrames: 16})) : 0;
  const shake = tt >= 0 && tt < 12 ? Math.round((1 - tt / 12) * 3) * 3 : 0;
  return (
    <AbsoluteFill style={{background: "#07070d", overflow: "hidden"}}>
      <AbsoluteFill
        style={{
          perspective: 1700,
          transform: `translate(${shake * Math.sin(tt * 2.9)}px, ${shake * Math.cos(tt * 3.3)}px) scale(${1.04 + punch + (frame / 400) * 0.03})`,
        }}
      >
        {WORLDS.map((_, i) => (
          <Panel key={i} i={i} start={starts[i]} title={title} />
        ))}
      </AbsoluteFill>
      {tt >= 0 && (
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
          <div style={{display: "flex", alignItems: "flex-end", gap: 60, transform: `scale(${1.25 - 0.25 * big})`, opacity: Math.min(1, tt / 3), filter: "drop-shadow(0 16px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(0,0,0,0.7))"}}>
            <PixelText text="5" scale={26} style="logo" />
            <PixelText text="WORLDS" scale={15} style="white" css={{marginBottom: 14}} />
          </div>
        </AbsoluteFill>
      )}
      {sfx && (
        <>
          {starts.map((s, i) => (
            <Sequence key={i} from={Math.max(0, s + LAND_DELAY - Math.round(SLAM_PEAK[i % 2] * FPS))} durationInFrames={40}>
              <Audio src={staticFile(`sfx/el/card_slam_${(i % 2) + 1}.mp3`)} volume={0.55 + i * 0.05} />
            </Sequence>
          ))}
          <Sequence from={title - Math.round(TITLE_PEAK * FPS)} durationInFrames={100}>
            <Audio src={staticFile("sfx/el/title_hit.mp3")} volume={0.9} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
