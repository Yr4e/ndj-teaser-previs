import React from "react";
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame} from "remotion";
import {PixelText} from "./PixelText";
import {Btn, Cursor, Logo, Stores} from "./EndConcepts";

/* ───────────── Концовка геймплейного ролика «уже доступно» (вариант 3 из эскизов) ─────────────
   логотип падает → AVAILABLE NOW → выскакивает кнопка PLAY → пиксельный курсор подъезжает и жмёт её:
   кнопка вдавливается, щелчок, вспышка, пиксели разлетаются, тряска. Клик — кадр CLICK (1,9 с): его ставить на удар трека. */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const LOGO_AT = 6;
const TXT = 30;
const BTN = 48;
const CUR_IN = 62;
const CUR_ARRIVE = 102;
export const CLICK = 114;
const STORES = 132;
// под combat_surge_75s: клип с 65,20 с, клик (1,90 с) на финальный удар 67,10, конец вместе с треком 72,74
export const endPlayFrames = 453;

const BTN_C = {x: 960, y: 798}; // центр кнопки
const CUR_FROM = {x: 1820, y: 1120};
const CUR_TO = {x: 1000, y: 790};

const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const COLORS = ["#ffc547", "#ff8a2a", "#fffae8", "#6fd3ff", "#b07cff"];

export const EndPlay: React.FC<{sfx?: boolean}> = ({sfx = true}) => {
  const frame = useCurrentFrame();
  const sp = (at: number, damping = 12, stiffness = 180) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness, mass: 0.7}});

  // логотип: падает сверху с перелётом
  const lg = sp(LOGO_AT, 11, 200);
  const logoY = (1 - lg) * -260;
  const logoS = interpolate(frame - LOGO_AT, [0, 4, 10], [1.25, 0.94, 1], clamp);
  // AVAILABLE NOW: удар с масштаба
  const tx = sp(TXT, 14, 260);
  const txS = 1.5 - 0.5 * tx;
  // кнопка
  const bt = sp(BTN, 10, 220);
  const since = frame - CLICK;
  const pressed = since >= 0 && since < 7;
  const hover = interpolate(frame, [CUR_ARRIVE - 6, CUR_ARRIVE + 4], [0, 1], clamp);
  const pop = since >= 7 ? interpolate(since, [7, 12, 20], [1, 1.1, 1], clamp) : 1;
  const btnS = bt * pop * (1 + 0.04 * hover * (since < 0 ? 1 : 0));
  const glow = 0.35 + 0.35 * hover + (since >= 0 ? interpolate(since, [0, 4, 40], [0, 1.2, 0.4], clamp) : 0);
  // курсор
  const m = interpolate(frame, [CUR_IN, CUR_ARRIVE], [0, 1], {...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1)});
  const curX = CUR_FROM.x + (CUR_TO.x - CUR_FROM.x) * m + Math.sin(m * Math.PI) * -60;
  const curY = CUR_FROM.y + (CUR_TO.y - CUR_FROM.y) * m;
  const curS = pressed ? 0.86 : 1;
  // удар клика: вспышка и тряска
  const flash = since >= 0 ? interpolate(since, [0, 2, 10], [0, 0.28, 0], clamp) : 0;
  const shk = since >= 0 ? interpolate(since, [0, 14], [14, 0], clamp) : interpolate(frame - LOGO_AT, [0, 10], [10, 0], clamp) * (frame >= LOGO_AT ? 1 : 0);
  const sx = Math.sin(frame * 2.7) * shk;
  const sy = Math.cos(frame * 3.3) * shk;
  // фон чуть светлеет после клика
  const bgLift = since >= 0 ? interpolate(since, [0, 30], [0.25, 0.1], clamp) : 0;

  return (
    <AbsoluteFill style={{background: "#07040c", overflow: "hidden"}}>
      <AbsoluteFill style={{background: `radial-gradient(60% 60% at 50% 45%, rgba(${80 + 120 * bgLift},${36 + 60 * bgLift},120,1), #07040c)`, opacity: interpolate(frame, [0, 10], [0, 1], clamp)}} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {frame >= LOGO_AT && (
          <AbsoluteFill style={{alignItems: "center", paddingTop: 170, transform: `translateY(${logoY}px) scale(${logoS})`, transformOrigin: "50% 30%"}}>
            <Logo s={20} />
          </AbsoluteFill>
        )}
        {frame >= TXT && (
          <AbsoluteFill style={{alignItems: "center", paddingTop: 520, transform: `scale(${txS})`, transformOrigin: "50% 53%", opacity: interpolate(frame - TXT, [0, 3], [0, 1], clamp)}}>
            <PixelText text="AVAILABLE NOW" scale={10} style="logo" spacing={1} />
          </AbsoluteFill>
        )}
        {frame >= BTN && (
          <AbsoluteFill style={{alignItems: "center", paddingTop: 700}}>
            <div style={{position: "relative", transform: `scale(${btnS})`}}>
              <div style={{position: "absolute", inset: -60, background: `radial-gradient(closest-side, rgba(255,197,71,${Math.min(1, glow)}), transparent)`}} />
              <div style={{position: "relative"}}><Btn text="PLAY" s={10} pressed={pressed} bg={hover > 0.5 || since >= 0 ? "#ffd56b" : "#ffc547"} /></div>
            </div>
          </AbsoluteFill>
        )}
        {/* пиксели из кнопки на клик */}
        {since >= 0 &&
          Array.from({length: 70}, (_, i) => {
            const ang = prand(i) * Math.PI * 2;
            const v = 14 + prand(i + 50) * 30;
            const t = since;
            const x = BTN_C.x + Math.cos(ang) * (190 + v * t * (1 - t / 140));
            const y = BTN_C.y + Math.sin(ang) * (90 + v * 0.7 * t * (1 - t / 140)) + 0.12 * t * t;
            const sz = 8 + (i % 4) * 6;
            const o = interpolate(t, [0, 30, 60], [1, 0.8, 0], clamp);
            return <div key={i} style={{position: "absolute", left: x, top: y, width: sz, height: sz, background: COLORS[i % 5], opacity: o}} />;
          })}
        <div style={{position: "absolute", bottom: 50, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(frame, [STORES, STORES + 10], [0, 1], clamp), transform: `translateY(${interpolate(frame, [STORES, STORES + 12], [20, 0], clamp)}px)`}}>
          <Stores />
        </div>
        {frame >= CUR_IN && (
          <div style={{position: "absolute", left: 0, top: 0, transform: `translate(${curX}px, ${curY}px) scale(${curS})`, transformOrigin: "0 0"}}>
            <Cursor x={0} y={0} />
          </div>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{background: "#fff6e0", opacity: flash, pointerEvents: "none"}} />
      {sfx && (
        <>
          {/* звуки из библиотеки inputlag-studio (ElevenLabs-варианты владелец забраковал) */}
          <Sequence from={LOGO_AT} durationInFrames={110}><Audio src={staticFile("sfx/lib/lani_impact_07.mp3")} volume={(f) => interpolate(f, [0, 80, 110], [0.9, 0.9, 0], clamp)} /></Sequence>
          <Sequence from={BTN} durationInFrames={30}><Audio src={staticFile("sfx/lib/lani_pop_01.mp3")} volume={0.8} /></Sequence>
          <Sequence from={CLICK} durationInFrames={20}><Audio src={staticFile("sfx/lib/lani_click_14.mp3")} volume={1} /></Sequence>
          <Sequence from={CLICK} durationInFrames={50}><Audio src={staticFile("sfx/lib/button-pressed.mp3")} volume={0.9} /></Sequence>
          <Sequence from={CLICK + 2} durationInFrames={100}><Audio src={staticFile("sfx/lib/game-start.mp3")} volume={1} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
