import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {GOLD} from "./data";
import {rand, SPAWN} from "./kit";
import {PixelLogo, PixelText} from "./PixelText";

/* ───────────── Концовка тизера: две карточки с пиксельным переходом ─────────────
   1) COMING SOON → удар логотипа OVERSPAM → Steam и Epic Games снизу;
   2) пиксельный глитч, экран рассыпается на квадраты;
   3) THE ADVENTURE BEGINS печатается → дата собирается из пиксельного глитча → удар. */
export type ReleaseProps = {soon: string; begins: string; date: string; stores: boolean};
export const RELEASE_DEFAULTS: ReleaseProps = {soon: "COMING SOON", begins: "THE ADVENTURE BEGINS", date: "12.12.2026", stores: true};

const FPS = 60;
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// тайминг, секунды
const T = {
  soon: 0.25, logo: 0.85, stores: 1.6, glint: 2.5,
  out: 3.7, wipe: 3.95, wipeMid: 4.3, wipeEnd: 4.65,
  begins: 4.5, date: 5.35, lock: 6.55, end: 9.0,
};
export const releaseFrames = f(T.end);

const GRID = 60; // размер квадрата перехода

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const grain = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='256' height='256' filter='url(%23n)' opacity='0.5'/></svg>")`;
  return (
    <>
      <AbsoluteFill style={{backgroundImage: grain, opacity: 0.06, backgroundPosition: `${(frame * 37) % 256}px ${(frame * 91) % 256}px`, mixBlendMode: "screen"}} />
      <AbsoluteFill style={{background: "radial-gradient(80% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.75))"}} />
    </>
  );
};

/** Надпись по буквам: каждая буква выпрыгивает пружиной, за ней бежит пиксельный курсор */
const TypeIn: React.FC<{text: string; at: number; every: number; scale: number; style: "white" | "dim" | "logo"; spacing?: number; cursor?: boolean}> = ({
  text, at, every, scale, style, spacing = 2, cursor,
}) => {
  const frame = useCurrentFrame();
  const chars = [...text];
  const shown = Math.floor((frame - at) / every) + 1;
  const done = shown >= chars.length;
  return (
    <div style={{display: "flex", alignItems: "flex-end", height: 10 * scale}}>
      {chars.map((ch, i) => {
        const t = frame - at - i * every;
        if (ch === " ") return <div key={i} style={{width: (4 + spacing) * scale}} />;
        const s = t < 0 ? 0 : spring({frame: t, fps: FPS, config: SPAWN, durationInFrames: 14});
        return (
          <div key={i} style={{opacity: t < 0 ? 0 : 1, transform: `translateY(${Math.round((1 - s) * 3) * scale}px)`, marginRight: (spacing - 2) * scale}}>
            <PixelText text={ch} scale={scale} style={style} />
          </div>
        );
      })}
      {cursor && frame >= at && (!done || Math.floor(frame / 16) % 2 === 0) && (
        <div style={{width: 5 * scale, height: 7 * scale, background: GOLD, marginLeft: scale * 2, marginBottom: scale * 2, opacity: done ? 0.8 : 1}} />
      )}
    </div>
  );
};

/** Дата из пиксельного глитча: цифры перебираются, строки съезжают на целые пиксели, цвет расслаивается, по одной цифре встаёт на место */
const GlitchDate: React.FC<{text: string; at: number; lock: number; scale: number}> = ({text, at, lock, scale}) => {
  const frame = useCurrentFrame();
  if (frame < at) return <div style={{height: 10 * scale}} />;
  const chars = [...text];
  const lockIdx = chars.map((_, i) => at + Math.round(((lock - at) * (i + 1)) / chars.length));
  const step = Math.floor(frame / 3);
  const POOL = "0123456789#%&@?";
  const shown = chars.map((ch, i) => (ch === "." || frame >= lockIdx[i] ? ch : POOL[Math.floor(rand(step * 31 + i * 7) * POOL.length)])).join("");
  const glitching = frame < lock;
  const g = glitching ? 1 : interpolate(frame - lock, [0, 8], [1, 0], clamp);
  const off = (k: number) => Math.round((rand(step * 13 + k) - 0.5) * 6 * g) * scale;
  // полосы, которые съезжают
  const slices = glitching || g > 0 ? [0, 1, 2, 3].map((k) => ({top: Math.floor(rand(step * 5 + k) * 8) * 12.5, h: 12.5 + Math.floor(rand(step * 9 + k) * 3) * 12.5, dx: off(k + 40)})) : [];
  const show = glitching ? rand(step * 3 + 99) > 0.12 : true; // редкие пропуски кадра
  return (
    <div style={{position: "relative"}}>
      {g > 0.05 && (
        <>
          <div style={{position: "absolute", left: -2 * scale + off(1), top: 0, opacity: 0.75 * g, mixBlendMode: "screen"}}><PixelText text={shown} scale={scale} style="red" /></div>
          <div style={{position: "absolute", left: 2 * scale + off(2), top: 0, opacity: 0.7 * g, filter: "hue-rotate(160deg) saturate(3)", mixBlendMode: "screen"}}><PixelText text={shown} scale={scale} style="red" /></div>
        </>
      )}
      <div style={{position: "relative", opacity: show ? 1 : 0.35}}>
        <PixelText text={shown} scale={scale} style="logo" />
      </div>
      {slices.map((s, k) => (
        <div key={k} style={{position: "absolute", inset: 0, clipPath: `inset(${s.top}% 0 ${Math.max(0, 100 - s.top - s.h)}% 0)`, transform: `translateX(${s.dx}px)`}}>
          <PixelText text={shown} scale={scale} style="logo" />
        </div>
      ))}
      {/* шумовые блоки вокруг */}
      {glitching &&
        Array.from({length: 10}, (_, k) => {
          const r = (n: number) => rand(step * 17 + k * 11 + n);
          const w = (2 + Math.floor(r(1) * 10)) * scale;
          return (
            <div key={`b${k}`} style={{
              position: "absolute", left: `${Math.floor(r(2) * 100)}%`, top: Math.floor(r(3) * 12) * scale - scale * 2,
              width: w, height: scale * (1 + Math.floor(r(4) * 2)), background: [GOLD, "#6ff3ff", "#ff4fd8", "#fffae8"][k % 4], opacity: r(5) > 0.4 ? 0.9 : 0,
            }} />
          );
        })}
    </div>
  );
};

/** Переход: экран закрывается квадратами по диагонали (с золотой кромкой), потом открывается уже второй карточкой */
const PixelWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = Math.ceil(1920 / GRID), rows = Math.ceil(1080 / GRID);
  const a = f(T.wipe), m = f(T.wipeMid), b = f(T.wipeEnd);
  if (frame < a || frame > b + 2) return null;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const d = (x / cols) * 0.7 + (y / rows) * 0.3 + rand(x * 97 + y * 13) * 0.18; // 0..~1.2
      const inStart = a + d * (m - a) * 0.75;
      const outStart = m + d * (b - m) * 0.75;
      const cover = frame < m ? interpolate(frame, [inStart, inStart + 6], [0, 1], clamp) : interpolate(frame, [outStart, outStart + 6], [1, 0], clamp);
      if (cover <= 0) continue;
      const edge = cover > 0 && cover < 1;
      const size = Math.round((GRID * cover) / 6) * 6;
      cells.push(
        <div key={`${x}-${y}`} style={{
          position: "absolute", left: x * GRID + (GRID - size) / 2, top: y * GRID + (GRID - size) / 2, width: size, height: size,
          background: edge ? GOLD : "#07070d", boxShadow: edge ? `0 0 18px ${GOLD}` : undefined,
        }} />,
      );
    }
  return <AbsoluteFill>{cells}</AbsoluteFill>;
};

const Store: React.FC<{icon: string; name: string; at: number}> = ({icon, name, at}) => {
  const frame = useCurrentFrame();
  const s = spring({frame: frame - at, fps: FPS, config: {damping: 16, stiffness: 160}, durationInFrames: 24});
  return (
    <div style={{display: "flex", alignItems: "center", gap: 22, opacity: s, transform: `translateY(${Math.round((1 - s) * 6) * 4}px)`}}>
      <Img src={staticFile(`overspam/stores/${icon}.svg`)} style={{width: 58, height: 58, filter: "drop-shadow(0 4px 0 rgba(0,0,0,0.6))"}} />
      <PixelText text={name} scale={5} style="white" />
    </div>
  );
};

export const Release: React.FC<ReleaseProps> = ({soon, begins, date, stores}) => {
  const frame = useCurrentFrame();
  const card1 = frame < f(T.wipeMid);

  // карточка 1: удар логотипа
  const hit = f(T.logo);
  const logoS = frame < hit ? 0 : spring({frame: frame - hit, fps: FPS, config: SPAWN, durationInFrames: 18});
  const logoScale = frame < hit ? 0 : 1.35 - 0.35 * logoS + 0.008 * Math.sin((frame - hit) / 22);
  const shakeT = frame - hit;
  const shake = shakeT >= 0 && shakeT < 12 ? Math.round((1 - shakeT / 12) * 4) * 3 : 0;
  const sx = shake * Math.sin(shakeT * 2.9), sy = shake * Math.cos(shakeT * 3.7);
  const glow = interpolate(frame, [hit, hit + 4, hit + 40], [0, 1, 0.35], clamp);
  const glint = interpolate(frame, [f(T.glint), f(T.glint) + 28], [-30, 130], clamp);
  // уход карточки 1: глитч полосами перед квадратами
  const outG = interpolate(frame, [f(T.out), f(T.wipe) + 6], [0, 1], clamp);
  const outStep = Math.floor(frame / 2);
  const outDx = outG > 0 ? Math.round((rand(outStep) - 0.5) * 10 * outG) * 6 : 0;

  // карточка 2: удар на фиксации даты
  const lock = f(T.lock);
  const lockS = frame < lock ? 0 : 1 - spring({frame: frame - lock, fps: FPS, config: SPAWN, durationInFrames: 16});
  const ring = interpolate(frame, [lock, lock + 30], [0, 1], clamp);
  const breathe = frame > lock ? 0.006 * Math.sin((frame - lock) / 30) : 0;

  return (
    <AbsoluteFill style={{background: "#07070d", overflow: "hidden"}}>
      {card1 ? (
        <AbsoluteFill style={{transform: `translate(${sx + outDx}px, ${sy}px)`, filter: outG > 0.05 ? `hue-rotate(${outG * 40}deg) contrast(${1 + outG * 0.4})` : undefined}}>
          <AbsoluteFill style={{background: `radial-gradient(40% 32% at 50% 48%, rgba(255,170,90,${0.22 * glow}), transparent 70%)`}} />
          <AbsoluteFill style={{alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, paddingBottom: 90}}>
            <TypeIn text={soon} at={f(T.soon)} every={3} scale={6} style="white" spacing={3} />
            <div style={{position: "relative", transform: `scale(${logoScale})`, opacity: frame < hit ? 0 : 1, filter: `drop-shadow(0 0 ${30 * glow}px rgba(255,170,90,0.7))`}}>
              <PixelLogo scale={22} />
              {/* блик по логотипу */}
              <div style={{position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent ${glint - 12}%, rgba(255,255,255,0.55) ${glint}%, transparent ${glint + 12}%)`, mixBlendMode: "overlay",
                WebkitMaskImage: `url(${staticFile("overspam/game/60x14_logo.png")})`, WebkitMaskSize: "100% 100%"}} />
            </div>
          </AbsoluteFill>
          {stores && (
            <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-end", paddingBottom: 110}}>
              <div style={{width: interpolate(frame, [f(T.stores) - 8, f(T.stores) + 14], [0, 760], clamp), height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, marginBottom: 44, opacity: 0.8}} />
              <div style={{display: "flex", alignItems: "center", gap: 90}}>
                <Store icon="steam" name="STEAM" at={f(T.stores)} />
                <div style={{width: 18, height: 18, border: `4px solid ${GOLD}`, transform: "rotate(45deg)", opacity: interpolate(frame, [f(T.stores) + 4, f(T.stores) + 16], [0, 1], clamp)}} />
                <Store icon="epicgames" name="EPIC GAMES" at={f(T.stores) + 8} />
              </div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{transform: `scale(${1 + lockS * 0.06 + breathe})`}}>
          <AbsoluteFill style={{background: `radial-gradient(45% 30% at 50% 55%, rgba(255,170,90,${0.25 * (frame > lock ? 1 - lockS * 0.3 : 0.3)}), transparent 70%)`}} />
          <AbsoluteFill style={{alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 54}}>
            <TypeIn text={begins} at={f(T.begins)} every={2} scale={6} style="white" spacing={3} cursor />
            <GlitchDate text={date} at={f(T.date)} lock={lock} scale={20} />
          </AbsoluteFill>
          {/* квадратная волна от удара */}
          {ring > 0 && ring < 1 && (
            <AbsoluteFill style={{alignItems: "center", justifyContent: "center", paddingTop: 110}}>
              <div style={{width: 1100 + ring * 900, height: 230 + ring * 500, border: `${Math.round((1 - ring) * 3 + 1) * 4}px solid ${GOLD}`, opacity: 1 - ring, boxShadow: `0 0 30px ${GOLD}`}} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
      <PixelWipe />
      <Grain />
    </AbsoluteFill>
  );
};
