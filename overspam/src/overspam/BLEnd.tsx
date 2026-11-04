import React from "react";
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {PixelText} from "./PixelText";

/* ───────────── Концовка покадрово по рефу Borderlands 4 Gameplay (IGN, 86,6–98 с) ─────────────
   логотип на чёрном → удар и резкая склейка на сверхкрупный арт, который с размытием отъезжает в квадрат слева →
   тёмная штриховка → чёрная шторка (0,3 с, на чёрном начинает собираться текст) → красный фон с дымом, текст
   собирается рваными буквами и мерцает, кнопка: сначала пустой чёрный прямоугольник, потом надпись →
   яркая вспышка + чёрная шторка → вторая вспышка. Арт — картинка владельца (public/overspam/keyart.webp). */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const LOGO = (scale: number) => ({width: 60 * scale, height: 14 * scale});

export type BLEndProps = {bpm: number; line1: string; line2: string; button: string; sfx: boolean; withLogo: boolean};
export const BL_END_DEFAULTS: BLEndProps = {bpm: 168, line1: "COMING DECEMBER 12", line2: "OVERSPAM.COM", button: "WISHLIST NOW", sfx: true, withLogo: true};

const LOGO_HOLD = 96; // логотип на чёрном, кадры
const RED = "#d0121e";
const CARD = {left: 150, top: 200, w: 540, h: 680}; // арт владельца 1117×1408
const FACE = {x: 0.45, y: 0.47}; // лицо Бракки на арте: отсюда отъезжает камера

const timeline = (withLogo: boolean) => {
  const H = withLogo ? LOGO_HOLD : 6; // удар: склейка на арт
  return {H, ZOOM: 40, S1: H + 42, W2: H + 60, RED_BACK: H + 78, TXT: H + 62, BTN: H + 80, F1: H + 210, F2: H + 372, END: H + 480};
};
export const blEndFrames = (p: {withLogo?: boolean} = {}) => timeline(p.withLogo ?? true).END;

const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const blobs = [
    [25, 35, 38, "#ff8a2a"], [68, 55, 44, "#ffbf3a"], [48, 78, 34, "#ff6a1f"], [86, 28, 30, "#ffa63c"], [12, 72, 30, "#ff7b2b"], [58, 20, 26, "#ffd45a"],
  ] as const;
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      {blobs.map(([x, y, r, c], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x + Math.sin(frame / (70 + i * 11) + i) * 7}%`,
            top: `${y + Math.cos(frame / (90 + i * 13) + i) * 6}%`,
            width: `${r}%`,
            height: `${r * 1.5}%`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(closest-side, ${c}99, transparent)`,
            filter: "blur(46px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Диагональная штриховка/шторка: полосы проходят по кадру слева направо */
const Streaks: React.FC<{at: number; len: number; color: string; dark?: boolean}> = ({at, len, color, dark}) => {
  const frame = useCurrentFrame();
  const k = (frame - at) / len;
  if (k < 0 || k > 1) return null;
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      {Array.from({length: 14}, (_, i) => {
        const w = 20 + ((i * 37) % 90);
        const x = -30 + k * 160 - ((i * 53) % 40) + ((i * 7) % 30);
        return <div key={i} style={{position: "absolute", top: "-10%", bottom: "-10%", left: `${x}%`, width: w, background: color, opacity: dark ? 0.9 : 0.55, transform: "skewX(-14deg)"}} />;
      })}
    </AbsoluteFill>
  );
};

/** Текст собирается рваными буквами: каждая встаёт в свой случайный кадр, первые 40 кадров буквы мигают */
const ragged = (txt: string, frame: number, start: number, seed: number) =>
  txt
    .split("")
    .map((ch, i) => {
      if (ch === " ") return " ";
      const on = start + Math.floor(prand(seed + i * 3.7) * 26);
      if (frame < on) return " ";
      const flick = frame - on < 40 && prand(seed + i * 5.3 + Math.floor(frame / 3)) < 0.18;
      return flick ? " " : ch;
    })
    .join("");

export const BLEnd: React.FC<BLEndProps> = ({line1, line2, button, sfx, withLogo}) => {
  const frame = useCurrentFrame();
  const T = timeline(withLogo);
  // 1) логотип на чёрном, лёгкий наезд
  const logoOn = withLogo && frame < T.H;
  const push = interpolate(frame, [0, T.H], [0.96, 1.02], clamp);
  // 2) удар: арт с лица отъезжает в квадрат, размытие по скорости
  const ease = {...clamp, easing: Easing.out(Easing.cubic)};
  const z = interpolate(frame, [T.H, T.H + T.ZOOM], [0, 1], ease);
  const zPrev = interpolate(frame - 1, [T.H, T.H + T.ZOOM], [0, 1], ease);
  const scale = 3.4 - 2.4 * z;
  const faceX = CARD.left + FACE.x * CARD.w;
  const faceY = CARD.top + FACE.y * CARD.h;
  const dx = (960 - faceX) * (1 - z);
  const dy = (540 - faceY) * (1 - z);
  // первые 3 кадра крупного плана резкие, размытие только на отъезде (как в рефе)
  const blur = Math.min(12, (z - zPrev) * 220) * interpolate(frame - T.H, [2, 5], [0, 1], clamp);
  // 3) фон: красный; чёрный на время шторок; вспышки
  const black = frame >= T.W2 && frame < T.RED_BACK;
  const black2 = frame >= T.F1 + 4 && frame < T.F1 + 14;
  const flash = (at: number) => interpolate(frame, [at, at + 2, at + 10], [0, 0.85, 0], clamp);
  const fl = flash(T.F1) + flash(T.F2) * 0.8;
  const textOn = frame >= T.TXT && !black2;
  return (
    <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
      {frame >= T.H && (
        <AbsoluteFill style={{background: black || black2 ? "#050003" : RED}}>
          {!black && !black2 && <Smoke />}
          <AbsoluteFill style={{background: "radial-gradient(80% 70% at 50% 50%, transparent 55%, rgba(50,0,0,0.5))"}} />
          {/* арт */}
          <div
            style={{
              position: "absolute",
              left: CARD.left,
              top: CARD.top,
              width: CARD.w,
              height: CARD.h,
              transformOrigin: `${FACE.x * CARD.w}px ${FACE.y * CARD.h}px`,
              transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
              filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
              boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
            }}
          >
            <Img src={staticFile("overspam/keyart.webp")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
          </div>
          {/* текст: дата белым, сайт чёрным той же ширины */}
          {textOn && (
            <div style={{position: "absolute", left: 760, top: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 30}}>
              <PixelText text={ragged(line1, frame, T.TXT, 11) || " "} scale={8} style="white" spacing={1} />
              {frame >= T.RED_BACK && <PixelText text={ragged(line2, frame, T.RED_BACK, 47) || " "} scale={12} style="black" noOutline spacing={1} />}
            </div>
          )}
          {/* кнопка: сначала пустой чёрный прямоугольник, потом надпись */}
          {frame >= T.BTN && (
            <div style={{position: "absolute", right: 70, bottom: 60, background: "#000", padding: "18px 30px", minWidth: 300, display: "flex", justifyContent: "center"}}>
              <div style={{opacity: frame >= T.BTN + 8 ? 1 : 0}}>
                <PixelText text={button} scale={4} style="white" noOutline spacing={2} />
              </div>
            </div>
          )}
          <div style={{position: "absolute", left: CARD.left, bottom: 60, display: "flex", gap: 30, alignItems: "center", opacity: frame >= T.RED_BACK ? 0.9 : 0}}>
            {["steam", "epicgames"].map((st) => (
              <Img key={st} src={staticFile(`overspam/stores/${st}.svg`)} style={{width: 42, height: 42}} />
            ))}
          </div>
          <Streaks at={T.S1} len={10} color="#5a0008" />
          <Streaks at={T.W2 - 4} len={10} color="#000" dark />
          <Streaks at={T.F1 + 2} len={12} color="#000" dark />
        </AbsoluteFill>
      )}
      {/* логотип на чёрном */}
      {logoOn && (
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", opacity: interpolate(frame, [0, 8], [0, 1], clamp)}}>
          <div style={{position: "relative", ...LOGO(20), transform: `scale(${push})`}}>
            {Array.from({length: 18}, (_, k) => 18 - k).map((k) => (
              <Img key={k} src={staticFile("overspam/game/logo_x22_side.png")} style={{position: "absolute", left: 0, top: k * 1.6, ...LOGO(20), filter: `brightness(${0.5 + 0.5 * (1 - k / 18)})`}} />
            ))}
            <Img src={staticFile("overspam/game/logo_x22.png")} style={{position: "absolute", left: 0, top: 0, ...LOGO(20)}} />
          </div>
        </AbsoluteFill>
      )}
      {/* вспышки на весь кадр */}
      {fl > 0.01 && <AbsoluteFill style={{background: "radial-gradient(70% 70% at 40% 45%, #fff6f0, #ffb0b8 60%, #ff5a7a)", opacity: fl, mixBlendMode: "screen"}} />}
      {/* звуки по рефу: удар на склейку, щелчки на штриховке/шторке/мерцании текста, вспышки с ударом */}
      {sfx && (
        <>
          <Sequence from={T.H} durationInFrames={150}><Audio src={staticFile("sfx/el/art_hit.mp3")} volume={0.95} /></Sequence>
          <Sequence from={T.S1 - 15} durationInFrames={45}><Audio src={staticFile("sfx/el/wipe_crackle.mp3")} volume={0.45} /></Sequence>
          <Sequence from={T.W2 - 15} durationInFrames={45}><Audio src={staticFile("sfx/el/wipe_crackle.mp3")} volume={0.5} /></Sequence>
          <Sequence from={T.TXT} durationInFrames={72}><Audio src={staticFile("sfx/el/ticks_soft.mp3")} volume={0.35} /></Sequence>
          <Sequence from={T.RED_BACK + 10} durationInFrames={72}><Audio src={staticFile("sfx/el/ticks_soft.mp3")} volume={0.3} /></Sequence>
          <Sequence from={T.F1} durationInFrames={90}><Audio src={staticFile("sfx/el/flash_hit.mp3")} volume={0.75} /></Sequence>
          <Sequence from={T.F2} durationInFrames={90}><Audio src={staticFile("sfx/el/flash_hit.mp3")} volume={0.55} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
