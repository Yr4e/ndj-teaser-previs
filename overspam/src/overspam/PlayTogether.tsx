import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {PixelText} from "./PixelText";

/* ───────────── PLAY TOGETHER по приёму из рефа Borderlands 4 (IGN, SHOOT / LOOT / CUTE) ─────────────
   1) чёрный кадр, белое слово; внутри букв бледно проступает следующий кадр (робот и скелет на луне);
   2) щелчок — склейка на геймплей: то же слово жёлтое, персонажи стоят ПЕРЕД ним (маска SAM 2,
      кадры public/overspam/pt_fg — RGBA вырезка из клипа владельца sssss-2.mp4). */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const CARD = 36; // чёрная карточка, 0,6 с
const SRC_START = 40; // с какого кадра клипа идёт геймплей
const SHOT = 60; // сколько держим геймплей с жёлтым словом, 1 с
export const playTogetherFrames = CARD + SHOT;

const TOP = 110; // верх блока надписи: персонажи (y 440–730) встают перед нижней строкой
const LINES = ["PLAY", "TOGETHER"];
const S = 22;
const GAP = 74;

/** Объёмные буквы: лицо без обводки + выдавливание вниз-вправо из 30 слоёв (темнее к низу),
    общая тёмная обводка вокруг всего объёма — CSS-тенями, чтобы не резать толщину */
const OUT = (c: string, w: number) =>
  [[w, 0], [-w, 0], [0, w], [0, -w], [w, w], [-w, w], [w, -w], [-w, -w]].map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${c})`).join(" ");
const Words3D: React.FC<{face: string; side: [string, string]; depth: number; outline: string}> = ({face, side, depth, outline}) => (
  <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: GAP, filter: OUT(outline, 5)}}>
    {LINES.map((t) => (
      <div key={t} style={{position: "relative"}}>
        {Array.from({length: depth}, (_, k) => depth - k).map((k) => (
          <div key={k} style={{position: "absolute", left: k * 0.7, top: k * 2}}>
            <PixelText text={t} scale={S} color={k > depth * 0.55 ? side[1] : side[0]} spacing={2} noOutline />
          </div>
        ))}
        <div style={{position: "relative"}}>
          <PixelText text={t} scale={S} color={face} spacing={2} noOutline />
        </div>
      </div>
    ))}
  </div>
);
const Block: React.FC<{children: React.ReactNode; scale?: number}> = ({children, scale = 1}) => (
  <AbsoluteFill style={{alignItems: "center", paddingTop: TOP, transform: `scale(${scale})`, transformOrigin: "50% 30%"}}>{children}</AbsoluteFill>
);

export const PlayTogether: React.FC<{sfx?: boolean}> = ({sfx = true}) => (
  <AbsoluteFill>
    <PlayTogetherPicture />
    {/* щелчок на склейку */}
    {sfx && (
      <Sequence from={CARD} durationInFrames={40}>
        <Audio src={staticFile("sfx/el/pt_click.mp3")} volume={0.8} />
      </Sequence>
    )}
  </AbsoluteFill>
);

const PlayTogetherPicture: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = frame - CARD;
  // кадр клипа: на карточке внутри букв уже идёт подходящий кадр, после склейки — продолжение
  const src = frame < CARD ? SRC_START - CARD + frame : SRC_START + shot;
  const pad = String(Math.max(0, Math.min(148, src))).padStart(5, "0");
  if (frame < CARD) {
    const pop = interpolate(frame, [0, 4], [1.04, 1], clamp);
    return (
      <AbsoluteFill style={{background: "#000"}}>
        <Block scale={pop}>
          <Words3D face="#ffffff" side={["#8e8e9c", "#4a4a55"]} depth={30} outline="#000" />
        </Block>
        {/* проявка: кадр бледным ч/б поверх белых букв через multiply — на чёрном не видно, в буквах проступает */}
        <AbsoluteFill style={{mixBlendMode: "multiply", opacity: interpolate(frame, [0, CARD], [0.35, 0.6], clamp)}}>
          <Img src={staticFile(`overspam/pt_src/${pad}.png`)} style={{width: "100%", height: "100%", filter: "grayscale(1) brightness(1.5) contrast(0.9)"}} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const punch = interpolate(shot, [0, 5], [1.05, 1], clamp) * interpolate(shot, [0, SHOT], [1, 1.04], clamp);
  // надпись бьёт чуть сильнее кадра и садится за 6 кадров
  const slam = interpolate(shot, [0, 6], [1.12, 1], clamp);
  return (
    <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
      <AbsoluteFill style={{transform: `scale(${punch})`}}>
        <Img src={staticFile(`overspam/pt_src/${pad}.png`)} style={{position: "absolute", inset: 0, width: "100%", height: "100%"}} />
        {/* притемнение под надписью, чтобы жёлтый читался на звёздах и светлом грунте */}
        <AbsoluteFill style={{background: "radial-gradient(70% 45% at 50% 34%, rgba(0,0,0,0.45), transparent 75%)"}} />
        <Block scale={slam}>
          <div style={{filter: "drop-shadow(0 22px 18px rgba(0,0,0,0.55))"}}>
            <Words3D face="#ffc547" side={["#c8661a", "#6e2a0c"]} depth={30} outline="#1c0c04" />
          </div>
        </Block>
        {/* тень персонажей на буквах — чтобы было видно, что они стоят перед надписью */}
        <Img src={staticFile(`overspam/pt_fg/${pad}.png`)} style={{position: "absolute", inset: 0, width: "100%", height: "100%", transform: "translate(18px, 14px)", filter: "brightness(0) blur(10px)", opacity: 0.55}} />
        <Img src={staticFile(`overspam/pt_fg/${pad}.png`)} style={{position: "absolute", inset: 0, width: "100%", height: "100%"}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

