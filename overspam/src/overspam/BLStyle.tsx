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

/* ───────────── Концовка ───────────── */
export type BLEndProps = {bpm: number; line1: string; line2: string; button: string; sfx: boolean};
export const BL_END_DEFAULTS: BLEndProps = {bpm: 168, line1: "COMING SOON", line2: "OVERSPAM.COM", button: "WISHLIST NOW", sfx: true};
const T_LOGO = 0; // логотип на чёрном
const T_FLY = 150; // пролёт сквозь логотип
const T_RED = 176; // красная карточка
const T_ART = 182; // арт влетает
const T_TYPE = 206; // печать текста
export const blEndFrames = () => 600;

const RED = "#c3121f";

const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const blobs = [
    [20, 30, 34, "#ff7a2a"], [70, 60, 40, "#ffb02e"], [45, 80, 30, "#ff5a1f"], [85, 25, 26, "#ff9a3c"], [10, 75, 28, "#ff6b2b"],
  ] as const;
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      {blobs.map(([x, y, r, c], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x + Math.sin(frame / (90 + i * 13) + i) * 6}%`,
            top: `${y + Math.cos(frame / (110 + i * 17) + i) * 5}%`,
            width: `${r}%`,
            height: `${r * 1.6}%`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(closest-side, ${c}aa, transparent)`,
            filter: "blur(40px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const LOGO = (scale: number) => ({width: 60 * scale, height: 14 * scale});

export const BLEnd: React.FC<BLEndProps> = ({line1, line2, button, sfx}) => {
  const frame = useCurrentFrame();
  // 1) логотип на чёрном: появление и медленный наезд; 2) пролёт сквозь логотип
  const logoIn = interpolate(frame, [T_LOGO, T_LOGO + 10], [0, 1], clamp);
  const push = interpolate(frame, [T_LOGO, T_FLY], [0.92, 1.0], clamp);
  const fly = frame >= T_FLY ? Math.pow(interpolate(frame, [T_FLY, T_RED], [0, 1], clamp), 3) : 0;
  const logoScale = push * (1 + fly * 14);
  const blur = fly * 18;
  // 3) красная карточка, шторка-полоса, арт
  const wipe = interpolate(frame, [T_RED - 4, T_RED + 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const art = frame >= T_ART ? spring({frame: frame - T_ART, fps: FPS, config: {damping: 15, stiffness: 240, mass: 0.7}, durationInFrames: 20}) : 0;
  // 4) печать текста по буквам с мерцанием
  const typed = (txt: string, start: number) => {
    const n = Math.max(0, Math.min(txt.length, Math.floor((frame - start) / 2)));
    return txt
      .split("")
      .map((ch, i) => (i < n ? ch : i < n + 2 && frame >= start && (frame + i) % 3 === 0 ? "#" : " "))
      .join("")
      .trimEnd();
  };
  const btn = frame >= T_TYPE + 30 ? spring({frame: frame - T_TYPE - 30, fps: FPS, config: {damping: 13, stiffness: 260, mass: 0.6}, durationInFrames: 16}) : 0;
  const red = frame >= T_RED - 4;
  return (
    <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
      {red && (
        <AbsoluteFill style={{background: RED, clipPath: `inset(0 ${100 - wipe * 100}% 0 0)`}}>
          <Smoke />
          <AbsoluteFill style={{background: "radial-gradient(80% 70% at 50% 50%, transparent 50%, rgba(60,0,0,0.55))"}} />
          {/* квадратный арт слева: герои и логотип */}
          <div
            style={{
              position: "absolute",
              left: 150,
              top: 230,
              width: 560,
              height: 560,
              transform: `translateY(${(1 - art) * 80}px) scale(${0.9 + 0.1 * art})`,
              opacity: art,
              overflow: "hidden",
              background: "linear-gradient(160deg, #e2262f, #8a0c16)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
            }}
          >
            {[["glitch", 120, 360], ["brakka", 300, 440], ["grindbone", 450, 380]].map(([h, x, hgt]) => (
              <Img key={h as string} src={staticFile(HERO_IMG(h as string))} style={{position: "absolute", left: (x as number) - ((hgt as number) * 0.75) / 2, bottom: -20, height: hgt as number, width: ((hgt as number) * 3) / 4}} />
            ))}
            <div style={{position: "absolute", left: 24, top: 22}}>
              <Img src={staticFile("overspam/game/logo_x22.png")} style={{...LOGO(6), imageRendering: "pixelated"}} />
            </div>
          </div>
          {/* текст справа */}
          <div style={{position: "absolute", left: 790, top: 390, display: "flex", flexDirection: "column", gap: 26}}>
            {frame >= T_TYPE && <PixelText text={typed(line1, T_TYPE) || " "} scale={11} style="white" spacing={2} />}
            {frame >= T_TYPE + 12 && <PixelText text={typed(line2, T_TYPE + 12) || " "} scale={6} style="white" spacing={2} />}
          </div>
          {/* кнопка и площадки */}
          <div style={{position: "absolute", right: 70, bottom: 60, transform: `scale(${btn})`, background: "#000", padding: "18px 30px"}}>
            <PixelText text={button} scale={4} style="white" noOutline spacing={2} />
          </div>
          <div style={{position: "absolute", left: 150, bottom: 70, display: "flex", gap: 30, alignItems: "center", opacity: interpolate(frame, [T_TYPE + 20, T_TYPE + 34], [0, 0.9], clamp)}}>
            {["steam", "epicgames"].map((s) => (
              <Img key={s} src={staticFile(`overspam/stores/${s}.svg`)} style={{width: 44, height: 44}} />
            ))}
          </div>
        </AbsoluteFill>
      )}
      {/* красная полоса-шторка на стыке */}
      {frame >= T_RED - 4 && frame <= T_RED + 10 && (
        <div style={{position: "absolute", top: 0, bottom: 0, left: `${wipe * 100 - 8}%`, width: "10%", background: "linear-gradient(90deg, transparent, #ff2a2a, #6a0008)", transform: "skewX(-12deg)"}} />
      )}
      {/* звуки ElevenLabs: удар на логотипе, вжух на пролёте (пик на смене кадра), свуш шторки, печать, кнопка */}
      {sfx && (
        <>
          <Sequence from={T_LOGO} durationInFrames={190}><Audio src={staticFile("sfx/el/logo_hit.mp3")} volume={0.9} /></Sequence>
          <Sequence from={T_RED - 17} durationInFrames={100}><Audio src={staticFile("sfx/el/fly_through.mp3")} volume={0.85} /></Sequence>
          <Sequence from={T_RED - 4} durationInFrames={60}><Audio src={staticFile("sfx/el/red_wipe.mp3")} volume={0.6} /></Sequence>
          <Sequence from={T_TYPE} durationInFrames={75}><Audio src={staticFile("sfx/el/type_ticks.mp3")} volume={0.45} /></Sequence>
          <Sequence from={T_TYPE + 30} durationInFrames={40}><Audio src={staticFile("sfx/el/button_pop.mp3")} volume={0.6} /></Sequence>
        </>
      )}
      {/* логотип на чёрном и пролёт сквозь него */}
      {frame < T_RED + 2 && (
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", opacity: logoIn * (1 - interpolate(frame, [T_RED - 4, T_RED + 2], [0, 1], clamp))}}>
          <div style={{position: "relative", ...LOGO(20), transform: `scale(${logoScale})`, filter: `blur(${blur}px)`}}>
            {Array.from({length: 18}, (_, k) => 18 - k).map((k) => (
              <Img key={k} src={staticFile("overspam/game/logo_x22_side.png")} style={{position: "absolute", left: 0, top: k * 1.6, ...LOGO(20), filter: `brightness(${0.5 + 0.5 * (1 - k / 18)})`}} />
            ))}
            <Img src={staticFile("overspam/game/logo_x22.png")} style={{position: "absolute", left: 0, top: 0, ...LOGO(20)}} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
