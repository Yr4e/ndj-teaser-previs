import React from "react";
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {PixelText} from "./PixelText";

/* ───────────── Концовка покадрово по рефу Borderlands 4 Gameplay (IGN, 86,6–98 с) ─────────────
   удар и резкая склейка на сверхкрупный арт, который с размытием отъезжает в квадрат слева → красный фон с дымом,
   текст собирается рваными буквами и мерцает, кнопка: сначала пустой чёрный прямоугольник, потом надпись.
   Правки владельца: без логотипа на чёрном, без белых вспышек и чёрных полос. Удар клипа (0,1 с) ставится на
   финальный удар трека teaser60c_v2 (56,08 с). Арт — картинка владельца (public/overspam/keyart.webp). */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const LOGO = (scale: number) => ({width: 60 * scale, height: 14 * scale});

// tail: сколько кадров идёт концовка после удара (под трек teaser60c_v2: удар 56,08 с, файл кончается на 60,0 с → 235)
export type BLEndProps = {bpm: number; line1: string; line2: string; button: string; sfx: boolean; withLogo: boolean; tail: number};
export const BL_END_DEFAULTS: BLEndProps = {bpm: 168, line1: "COMING DECEMBER 12", line2: "OVERSPAM.COM", button: "WISHLIST NOW", sfx: true, withLogo: false, tail: 235};

const LOGO_HOLD = 96; // логотип на чёрном, кадры
const RED = "#d0121e";
const CARD = {left: 150, top: 200, w: 540, h: 680}; // арт владельца 1117×1408
const FACE = {x: 0.45, y: 0.47}; // лицо Бракки на арте: отсюда отъезжает камера

const timeline = (withLogo: boolean, tail = 235) => {
  const H = withLogo ? LOGO_HOLD : 6; // удар: склейка на арт (кадр 6 = 0,1 с от начала клипа)
  return {H, ZOOM: 40, TXT: H + 50, LINE2: H + 62, BTN: H + 70, END: H + tail};
};
export const blEndFrames = (p: {withLogo?: boolean; tail?: number} = {}) => timeline(p.withLogo ?? false, p.tail).END;

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

export const BLEnd: React.FC<BLEndProps> = ({line1, line2, button, sfx, withLogo, tail}) => {
  const frame = useCurrentFrame();
  const T = timeline(withLogo, tail);
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
  // 3) фон красный с дымом; вспышки и чёрные шторки убраны (правка владельца)
  const textOn = frame >= T.TXT;
  return (
    <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
      {frame >= T.H && (
        <AbsoluteFill style={{background: RED}}>
          <Smoke />
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
              {frame >= T.LINE2 && <PixelText text={ragged(line2, frame, T.LINE2, 47) || " "} scale={12} style="black" noOutline spacing={1} />}
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
          <div style={{position: "absolute", left: CARD.left, bottom: 60, display: "flex", gap: 30, alignItems: "center", opacity: frame >= T.LINE2 ? 0.9 : 0}}>
            {["steam", "epicgames"].map((st) => (
              <Img key={st} src={staticFile(`overspam/stores/${st}.svg`)} style={{width: 42, height: 42}} />
            ))}
          </div>
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
      {/* звуки: удар на склейку (в треке на этом месте свой финальный удар — громкость небольшая) и тихие щелчки на сборке текста */}
      {sfx && (
        <>
          <Sequence from={T.H} durationInFrames={150}><Audio src={staticFile("sfx/el/art_hit.mp3")} volume={0.55} /></Sequence>
          <Sequence from={T.TXT} durationInFrames={72}><Audio src={staticFile("sfx/el/ticks_soft.mp3")} volume={0.3} /></Sequence>
          <Sequence from={T.LINE2 + 10} durationInFrames={72}><Audio src={staticFile("sfx/el/ticks_soft.mp3")} volume={0.25} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
