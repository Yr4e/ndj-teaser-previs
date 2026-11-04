import React from "react";
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame} from "remotion";
import {HERO_IMG} from "./data";
import {beatFrames} from "./kit";
import {PixelText} from "./PixelText";

/* ───────────── Вставки по рефу Borderlands 4 Gameplay (IGN) ─────────────
   1) WordCards: чёрный кадр, белые слова появляются по одному на долю (BLOW → BLOW SHIT → … TOGETHER).
   2) WordOverlay: те же слова огромными жёлтыми буквами, прозрачный MOV поверх геймплея; персонажа перед
      текстом владелец кладёт слоем выше в CapCut (маска), как в рефе.
   3) BLEnd: концовка — объёмный логотип на чёрном с медленным наездом, пролёт сквозь логотип, красный фон
      с дымом, квадратный арт влетает через красную шторку, COMING SOON печатается по буквам, сайт,
      кнопка WISHLIST NOW, площадки внизу. */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export type WordProps = {bpm: number; lines: string[][]};
export const WORD_DEFAULTS: WordProps = {bpm: 168, lines: [["PLAY"], ["TOGETHER"]]};

const flat = (lines: string[][]) => lines.flatMap((l, li) => l.map((w, wi) => ({li, wi})));
export const wordCardsFrames = (p: WordProps) => Math.round(beatFrames(p.bpm, FPS) * (flat(p.lines).length + 1.5));
export const wordOverlayFrames = (p: WordProps) => Math.round(beatFrames(p.bpm, FPS) * 4);

export const WordCards: React.FC<WordProps> = ({bpm, lines}) => {
  const frame = useCurrentFrame();
  const beat = beatFrames(bpm, FPS);
  const order = flat(lines);
  const shown = Math.min(order.length, Math.floor(frame / beat) + 1);
  const at = Math.floor(frame / beat) * beat;
  const pop = interpolate(frame - at, [0, 4], [1.04, 1], clamp);
  return (
    <AbsoluteFill style={{background: "#000", alignItems: "center", justifyContent: "center", gap: 34}}>
      {lines.map((line, li) => {
        const words = line.filter((_, wi) => order.findIndex((o) => o.li === li && o.wi === wi) < shown);
        if (!words.length) return <div key={li} style={{height: 9 * 16}} />;
        return (
          <div key={li} style={{transform: `scale(${pop})`}}>
            <PixelText text={words.join(" ")} scale={16} style="white" spacing={2} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const WordOverlay: React.FC<WordProps> = ({bpm, lines}) => {
  const frame = useCurrentFrame();
  const total = wordOverlayFrames({bpm, lines});
  const punch = interpolate(frame, [0, 6], [1.08, 1], clamp) * interpolate(frame, [0, total], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 20}}>
      <div style={{transform: `scale(${punch})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, filter: "drop-shadow(0 18px 0 rgba(0,0,0,0.35))"}}>
        {lines.map((line, li) => (
          <PixelText key={li} text={line.join(" ")} scale={24} color="#ffc547" spacing={2} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
