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

/* ───────────── TitleOverlay: надпись OVERSPAM на дропе, прозрачный оверлей ─────────────
   До удара буквы мигают пиксельным глитчем, на удар (DROP = 0,5 с) надпись схлопывается с перелётом,
   красная/голубая копии сходятся, разлетаются пиксельные осколки, тряска. Держится HOLD долей, потом
   буквы слева направо рассыпаются глитч-полосами. Владелец кладёт поверх кадров в CapCut. */
const LOGO_W = 60;
const LOGO_H = 14;
// границы букв в логотипе 60×14 (столбцы с контуром между буквами)
const LETTERS = [[1, 8], [8, 15], [15, 22], [22, 29], [29, 36], [36, 43], [43, 50], [50, 58]];
const TS = 22; // масштаб пикселя логотипа
const DROP = 30; // кадр удара
const HOLD_BEATS = 6;

export const titleOverlayFrames = (p: {bpm: number}) => Math.round(DROP + beatFrames(p.bpm, FPS) * HOLD_BEATS + 30);

const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const LetterSlice: React.FC<{i: number; dx?: number; dy?: number; clipTop?: number; clipH?: number; tint?: string; opacity?: number}> = ({i, dx = 0, dy = 0, clipTop = 0, clipH = LOGO_H, tint, opacity = 1}) => {
  const [x0, x1] = LETTERS[i];
  return (
    <div
      style={{
        position: "absolute",
        left: x0 * TS + dx,
        top: clipTop * TS + dy,
        width: (x1 - x0 + 1) * TS,
        height: clipH * TS,
        overflow: "hidden",
        opacity,
        mixBlendMode: tint ? "screen" : undefined,
      }}
    >
      {tint ? (
        // цветная копия по форме букв: заливка цветом через маску логотипа
        <div
          style={{
            position: "absolute",
            left: -x0 * TS,
            top: -clipTop * TS,
            width: LOGO_W * TS,
            height: LOGO_H * TS,
            background: tint,
            WebkitMaskImage: `url(${staticFile("overspam/game/60x14_logo.png")})`,
            WebkitMaskSize: `${LOGO_W * TS}px ${LOGO_H * TS}px`,
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      ) : (
        <Img
          src={staticFile("overspam/game/60x14_logo.png")}
          style={{position: "absolute", left: -x0 * TS, top: -clipTop * TS, width: LOGO_W * TS, height: LOGO_H * TS, imageRendering: "pixelated"}}
        />
      )}
    </div>
  );
};

export const TitleOverlay: React.FC<{bpm: number}> = ({bpm}) => {
  const frame = useCurrentFrame();
  const beat = beatFrames(bpm, FPS);
  const exitAt = Math.round(DROP + beat * HOLD_BEATS);
  const t = frame - DROP;
  const slam = t >= 0 ? spring({frame: t, fps: FPS, config: {damping: 11, stiffness: 320, mass: 0.6}, durationInFrames: 18}) : 0;
  const scale = t >= 0 ? 1.32 - 0.32 * slam : 1;
  const split = t >= 0 ? interpolate(t, [0, 10], [14, 0], clamp) : 0; // разъезд красной/голубой копий в пикселях экрана
  const shake = t >= 0 && t < 12 ? Math.round((prand(frame) - 0.5) * 2 * (1 - t / 12) * 3) * 6 : 0;
  const shakeY = t >= 0 && t < 12 ? Math.round((prand(frame + 50) - 0.5) * 2 * (1 - t / 12) * 2) * 6 : 0;
  const sinceBeat = t >= 0 ? t % beat : 0;
  const pulse = t >= 0 && frame < exitAt ? Math.exp(-sinceBeat / 6) : 0;
  const glow = t >= 0 ? interpolate(t, [0, 3, 24], [0, 0.95, 0.35], clamp) + pulse * 0.18 : 0;
  const glowOut = interpolate(frame, [exitAt, exitAt + 14], [1, 0], clamp);
  const W = LOGO_W * TS;
  const H = LOGO_H * TS;
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
      {/* тёплое свечение за надписью */}
      <div style={{position: "absolute", width: W * 1.3, height: H * 2.4, background: "radial-gradient(closest-side, rgba(255,150,70,0.55), rgba(255,80,60,0.18) 55%, transparent)", opacity: glow * glowOut, filter: "blur(10px)"}} />
      <div style={{position: "relative", width: W, height: H, transform: `translate(${shake}px, ${shakeY}px) scale(${scale})`}}>
        {LETTERS.map((_, i) => {
          // до удара: буквы мигают по одной, полупрозрачно, со сдвигом на целые пиксели логотипа
          if (t < 0) {
            const on = prand(Math.floor(frame / 3) * 13 + i * 7) > 0.55 - (frame / DROP) * 0.35;
            if (!on || frame < i * 2) return null;
            const jx = Math.round((prand(frame * 3 + i) - 0.5) * 4) * TS;
            return (
              <React.Fragment key={i}>
                <LetterSlice i={i} dx={jx + TS} tint="#ff3048" opacity={0.5} />
                <LetterSlice i={i} dx={jx - TS} tint="#3cd2ff" opacity={0.5} />
                <LetterSlice i={i} dx={jx} opacity={0.35 + 0.4 * (frame / DROP)} />
              </React.Fragment>
            );
          }
          // уход: буква рассыпается на 3 полосы, они разъезжаются и гаснут, слева направо
          const ex = frame - (exitAt + i * 1.5);
          if (ex >= 0) {
            if (ex > 12) return null;
            const k = ex / 12;
            return (
              <React.Fragment key={i}>
                {[0, 5, 10].map((top, s) => (
                  <LetterSlice key={s} i={i} clipTop={top} clipH={s === 2 ? 4 : 5} dx={Math.round((prand(i * 9 + s) - 0.5) * 2 * k * 14) * TS} opacity={1 - k} />
                ))}
                <LetterSlice i={i} dx={Math.round(k * 3) * TS} tint="#3cd2ff" opacity={0.6 * (1 - k)} />
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={i}>
              {split > 0.5 && <LetterSlice i={i} dx={split} tint="#ff3048" opacity={0.75} />}
              {split > 0.5 && <LetterSlice i={i} dx={-split} tint="#3cd2ff" opacity={0.75} />}
              <LetterSlice i={i} />
            </React.Fragment>
          );
        })}
      </div>
      {/* пиксельные осколки на ударе */}
      {t >= 0 && t < 40 &&
        Array.from({length: 36}, (_, k) => {
          const a = prand(k * 3.3) * Math.PI * 2;
          const sp = 10 + prand(k * 7.1) * 22;
          const sz = (1 + Math.floor(prand(k * 5.9) * 2)) * 14;
          const x = Math.cos(a) * (W * 0.42 + sp * t);
          const y = Math.sin(a) * (H * 0.55 + sp * t * 0.55) + 0.35 * t * t * 0.5;
          const c = ["#fffae8", "#ffc880", "#faac5c", "#ff8c3d", "#62162c"][k % 5];
          return <div key={k} style={{position: "absolute", width: sz, height: sz, background: c, transform: `translate(${x}px, ${y}px)`, opacity: interpolate(t, [0, 28, 40], [1, 0.8, 0], clamp)}} />;
        })}
    </AbsoluteFill>
  );
};
