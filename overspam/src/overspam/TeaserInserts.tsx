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
   Заход резкий (правка владельца 2026-11-04): за 8 кадров до удара буквы вспыхивают слева направо.
   На удар (DROP = 0,5 с) надпись схлопывается с перелётом, красная/голубая копии сходятся, разлетаются
   пиксельные осколки, тряска. Держится HOLD долей, потом буквы слева направо подпрыгивают и падают
   (не глитч, правка владельца). Владелец кладёт поверх кадров в CapCut. */
const LOGO_W = 60;
const LOGO_H = 14;
// границы букв в логотипе 60×14 (столбцы с контуром между буквами)
const LETTERS = [[1, 8], [8, 15], [15, 22], [22, 29], [29, 36], [36, 43], [43, 50], [50, 58]];
const TS = 22; // масштаб пикселя логотипа
const DROP = 30; // кадр удара
const HOLD_BEATS = 6;

export const titleOverlayFrames = (p: {bpm: number}) => Math.round(DROP + beatFrames(p.bpm, FPS) * HOLD_BEATS + 44);

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
          const [lx0, lx1] = LETTERS[i];
          const origin = `${((lx0 + lx1 + 1) / 2) * TS}px ${(LOGO_H / 2) * TS}px`;
          // заход резкий: за 8 кадров до удара буквы вспыхивают слева направо по кадру на букву,
          // сразу целиком, падают сверху на 2 пикселя логотипа, с красной и голубой копией и вспышкой яркости
          if (t < 0) {
            const a = frame - (DROP - 8 + i);
            if (a < 0) return null;
            const dy = Math.round(interpolate(a, [0, 2], [-2, 0], clamp)) * TS;
            const sp = Math.round(interpolate(a, [0, 3], [2, 1], clamp)) * TS;
            return (
              <div key={i} style={{position: "absolute", inset: 0, transform: `translateY(${dy}px)`, filter: `brightness(${interpolate(a, [0, 2], [1.9, 1.15], clamp)})`}}>
                <LetterSlice i={i} dx={sp} tint="#ff3048" opacity={0.7} />
                <LetterSlice i={i} dx={-sp} tint="#3cd2ff" opacity={0.7} />
                <LetterSlice i={i} />
              </div>
            );
          }
          // уход: слева направо каждая буква подпрыгивает и падает вниз с поворотом, гаснет в конце (без глитча)
          const ex = frame - (exitAt + i * 2);
          if (ex >= 0) {
            if (ex > 26) return null;
            const fy = -16 * ex + 1.9 * ex * ex;
            const rot = (prand(i * 5.7) - 0.5) * 2 * 2.2 * ex;
            const fx = (prand(i * 3.1) - 0.5) * 6 * ex;
            return (
              <div key={i} style={{position: "absolute", inset: 0, transform: `translate(${fx}px, ${fy}px) rotate(${rot}deg)`, transformOrigin: origin, opacity: interpolate(ex, [16, 26], [1, 0], clamp)}}>
                <LetterSlice i={i} />
              </div>
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

/* ───────────── TitleOverlay3D: надпись как корабль из варпа (правка владельца 2026-11-04) ─────────────
   До удара плоская пиксельная надпись летит из точки к камере с ускорением и шлейфом. На удар (DROP)
   резкая остановка и выдавливание в объём. Надпись смотрит прямо, камера сама медленно плывёт и даёт
   слабый угол (−3,5° → +3,5°). Тёплое свечение, без блика. Уход: камера пролетает сквозь надпись в геймплей. */
const L3 = 40; // слоёв толщины
const DEPTH_PX = 120; // полная толщина, px
export const titleOverlay3DFrames = (p: {bpm: number}) => Math.round(DROP + beatFrames(p.bpm, FPS) * HOLD_BEATS + 22);

const LogoLayer: React.FC<{src: string; z: number; dim?: number; opacity?: number}> = ({src, z, dim = 1, opacity = 1}) => (
  <Img
    src={staticFile(src)}
    style={{position: "absolute", left: 0, top: 0, width: LOGO_W * TS, height: LOGO_H * TS, transform: `translateZ(${z}px)`, filter: dim !== 1 ? `brightness(${dim})` : undefined, opacity, imageRendering: "pixelated"}}
  />
);

export const TitleOverlay3D: React.FC<{bpm: number}> = ({bpm}) => {
  const frame = useCurrentFrame();
  const beat = beatFrames(bpm, FPS);
  const exitAt = Math.round(DROP + beat * HOLD_BEATS);
  const W = LOGO_W * TS;
  const H = LOGO_H * TS;
  const t = frame - DROP;
  // разгон: из точки к камере с ускорением, лёгкий перелёт, резкая остановка
  const u = Math.min(1, Math.max(0, frame / DROP));
  const approach = 0.015 + 1.16 * Math.pow(u, 3.2);
  const stop = t >= 0 ? spring({frame: t, fps: FPS, config: {damping: 18, stiffness: 420, mass: 0.6}, durationInFrames: 14}) : 0;
  // уход: камера пролетает сквозь надпись в геймплей (правка владельца) — надпись разлетается на камеру, размывается и гаснет
  const fly = Math.pow(interpolate(frame, [exitAt, exitAt + 16], [0, 1], clamp), 2.6);
  const fade = interpolate(frame, [exitAt + 8, exitAt + 16], [1, 0], clamp);
  const scale = t < 0 ? approach : (1.17 - 0.17 * stop) * interpolate(frame, [DROP, exitAt], [1, 1.03], clamp) * (1 + fly * 11);
  // объём: толщина появляется на остановке, надпись доворачивается под угол
  const depth = t < 0 ? 0 : spring({frame: t, fps: FPS, config: {damping: 14, stiffness: 200, mass: 0.7}, durationInFrames: 22});
  // надпись смотрит прямо; камера сама медленно плывёт и даёт слабый угол, толщина чуть видна то слева, то справа
  const drift = interpolate(frame, [DROP, exitAt], [0, 1], clamp);
  const ry = t < 0 ? 0 : depth * interpolate(drift, [0, 1], [-3.5, 3.5], {easing: Easing.inOut(Easing.sin)}); // слабее (правка владельца)
  const rx = t < 0 ? 0 : depth * interpolate(drift, [0, 1], [2, -1.2], {easing: Easing.inOut(Easing.sin)});
  const glow = t < 0 ? u * 0.4 : interpolate(t, [0, 3, 30], [1, 1, 0.45], clamp) * fade;
  // шлейф при разгоне и уходе: плоские копии позади, меньше и прозрачнее
  const trail = t < 0 ? u : 0; // шлейф только на разгоне
  const trailScales = [0.72, 0.5, 0.34];
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", perspective: 1600}}>
      <div style={{position: "absolute", width: W * 1.25 * Math.max(scale, 0.05), height: H * 2.6 * Math.max(scale, 0.05), background: "radial-gradient(closest-side, rgba(255,170,90,0.6), rgba(255,90,60,0.18) 60%, transparent)", opacity: glow, filter: "blur(14px)"}} />
      {t < 0 && trail > 0.05 &&
        trailScales.map((k, i) => (
          <Img key={i} src={staticFile("overspam/game/logo_x22.png")} style={{position: "absolute", width: W * scale * k, height: H * scale * k, opacity: 0.22 * trail * (1 - i * 0.28), filter: "blur(3px) brightness(1.6) saturate(0.6)", imageRendering: "pixelated"}} />
        ))}
      {/* фейд на обёртке: надпись гаснет целиком, задние слои не просвечивают */}
      <div style={{position: "relative", width: W, height: H, opacity: fade, perspective: 1600, filter: fly > 0.01 ? `blur(${fly * 16}px)` : undefined}}>
      <div style={{position: "relative", width: W, height: H, transformStyle: "preserve-3d", transform: `scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
        {Array.from({length: L3}, (_, k) => L3 - k).map((k) => (
          <LogoLayer key={k} src="overspam/game/logo_x22_side.png" z={(-k * DEPTH_PX * depth) / L3} dim={0.35 + 0.55 * (1 - k / L3)} />
        ))}
        <LogoLayer src="overspam/game/logo_x22.png" z={1} />
      </div>
      </div>
    </AbsoluteFill>
  );
};
