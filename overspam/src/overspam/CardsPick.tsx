import React from "react";
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {FOOTAGE} from "./data";
import {SPAWN} from "./kit";

/* ───────────── Выбор карты по рефу DRG: геймплей → бумс, меню → карты на щелчки → фиолетовая → импакт → бой ─────────────
   Всё порезано под звук владельца public/sfx/owner/drg_cards.mp3 (1,75 с), он стоит с 1,20 с:
   его бумс 0,30 → 1,50 (меню), щелчки → смены карт, последний щелчок 1,73 → 2,93 (фиолетовая).
   Звук игры молчит от бумса до импакта (как музыка в рефе) и возвращается на удар.
   audio = "drg" (со звуком владельца, для проверки) или "game" (без него, владелец кладёт сам с 1,20 с). */
export type CardsPickProps = {audio: "drg" | "game"};
export const CARDS_PICK_DEFAULTS: CardsPickProps = {audio: "drg"};

const FPS = 60;
const SRC = FOOTAGE("cards_reroll_forest.mp4");
const f = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const OWNER_SOUND_AT = 1.2;
const BOOM = 1.5;
const CLICKS = [1.854, 1.986, 2.088, 2.198, 2.307, 2.405, 2.552, 2.714, 2.836];
const PURPLE = 2.931;
const WHOOSH = 3.2; // подсос импакта: карта сжимается
const HIT = 3.3; // удар: карта взята, бой и звук игры возвращаются
const END = 5.2;
export const cardsPickFrames = f(END);

// кадры исходника, где новые карты уже полностью видны (самые цветные наборы)
const REROLLS = [2.44, 3.12, 7.77, 14.15, 18.4, 19.37, 21.04, 25.07, 30.99];
const PURPLE_SRC = 43.27;
const COMBAT_SRC = 49.45;
// фиолетовая карта в кадре исходника
const CARD = {x: 418, y: 278, w: 340, h: 575};

type Shot = {from: number; to: number; src: number; rate: number; sound: boolean};
const SHOTS: Shot[] = [
  // 0–1,5 с: бой (1,25 с записи чуть растянуты)
  {from: 0, to: BOOM, src: 0, rate: 1.25 / BOOM, sound: true},
  // меню выезжает на бумс
  {from: BOOM, to: CLICKS[0], src: 1.25, rate: 1, sound: false},
  ...CLICKS.map((c, i) => ({from: c, to: i + 1 < CLICKS.length ? CLICKS[i + 1] : PURPLE, src: REROLLS[i], rate: 1, sound: false})),
  {from: PURPLE, to: HIT, src: PURPLE_SRC, rate: 1, sound: false},
  {from: HIT, to: END, src: COMBAT_SRC, rate: 1, sound: true},
];

const punch = (frame: number, at: number, amount: number, len = 16) =>
  frame < at ? 0 : amount * (1 - spring({frame: frame - at, fps: FPS, config: SPAWN, durationInFrames: len}));

// искры на удар: заранее заданные направления
const SPARKS = Array.from({length: 22}, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.21;
  return {a, d: 260 + ((i * 97) % 180), s: 6 + (i % 4) * 3};
});

export const CardsPick: React.FC<CardsPickProps> = ({audio}) => {
  const frame = useCurrentFrame();
  const hitF = f(HIT);

  // общий кадр: удары камеры на бумс и щелчки, тряска на импакт
  const scale = 1 + punch(frame, f(BOOM), 0.05) + CLICKS.reduce((a, c) => a + punch(frame, f(c), 0.012), 0) + punch(frame, hitF, 0.07);
  const shakeT = frame - hitF;
  const shake = shakeT >= 0 && shakeT < 10 ? (1 - shakeT / 10) * 14 : 0;
  const sx = shake * Math.sin(shakeT * 2.7), sy = shake * Math.cos(shakeT * 3.3);
  const split = Math.max(...[BOOM, HIT].map((t) => interpolate(frame - f(t), [0, 2, 9], [0, 8, 0], clamp)));

  // фиолетовая: быстро выделяется, на подсос сжимается, на удар растёт и улетает в камеру
  const focus = spring({frame: frame - f(PURPLE), fps: FPS, config: {damping: 16, stiffness: 240, mass: 0.6}, durationInFrames: 14});
  const squeeze = interpolate(frame, [f(WHOOSH), hitF], [0, 1], clamp);
  const fly = interpolate(frame, [hitF, hitF + 11], [0, 1], clamp);
  const onCard = frame >= f(PURPLE) && frame < hitF + 11;
  const cardScale = 1 + 0.14 * focus - 0.05 * squeeze * (1 - fly) + punch(frame, hitF, 0.12, 10) + 1.4 * fly * fly;
  const cx = CARD.x + CARD.w / 2, cy = CARD.y + CARD.h / 2;
  const shiftX = (960 - cx) * 0.4 * focus, shiftY = (540 - cy) * 0.4 * focus;
  const dim = focus * (0.5 + 0.2 * squeeze) * (1 - fly);
  const flash = interpolate(frame - hitF, [0, 2, 14], [0, 1, 0], clamp);
  const glow = Math.max(focus * (1 - fly) * 0.7, flash);

  return (
    <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
      <svg width={0} height={0} style={{position: "absolute"}}>
        <filter id="cp-split">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="r" />
          <feOffset in="r" dx={split} result="r2" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" in="SourceGraphic" result="gb" />
          <feOffset in="gb" dx={-split} result="gb2" />
          <feBlend in="r2" in2="gb2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${scale})`, filter: split > 0.3 ? "url(#cp-split)" : undefined}}>
        {SHOTS.map((s, i) => (
          <Sequence key={i} from={f(s.from)} durationInFrames={f(s.to) - f(s.from)}>
            <OffthreadVideo src={staticFile(SRC)} startFrom={f(s.src)} playbackRate={s.rate} volume={s.sound ? 1 : 0} style={{width: "100%", height: "100%"}} />
          </Sequence>
        ))}
        {onCard && (
          <>
            <AbsoluteFill style={{background: `rgba(6,3,12,${dim})`, backdropFilter: `blur(${8 * dim}px)`}} />
            <div
              style={{
                position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, overflow: "hidden",
                transform: `translate(${shiftX}px, ${shiftY}px) scale(${cardScale})`,
                opacity: 1 - fly,
                filter: `brightness(${1 + 0.5 * flash}) drop-shadow(0 0 ${24 * focus + 40 * flash}px rgba(170,80,255,0.85)) drop-shadow(0 18px 30px rgba(0,0,0,0.7))`,
                clipPath: "polygon(0 2%, 3% 0, 100% 0, 100% 97%, 97% 100%, 0 100%)",
              }}
            >
              <Sequence from={f(PURPLE)} layout="none">
                <OffthreadVideo src={staticFile(SRC)} startFrom={f(PURPLE_SRC)} muted
                  style={{position: "absolute", left: -CARD.x, top: -CARD.y, width: 1920, height: 1080, filter: "contrast(1.08) saturate(1.15)"}} />
              </Sequence>
              {/* карта в игре полупрозрачная: закрашиваем просвечивающую траву */}
              <AbsoluteFill style={{background: "linear-gradient(rgba(40,14,72,0.32), rgba(26,8,48,0.45))", mixBlendMode: "multiply", opacity: focus}} />
            </div>
          </>
        )}
        {/* искры на удар */}
        {frame >= hitF && frame < hitF + 24 &&
          SPARKS.map((p, i) => {
            const k = (frame - hitF) / 24;
            const e = 1 - (1 - k) ** 3;
            return (
              <div key={i} style={{
                position: "absolute", left: 960 + Math.cos(p.a) * p.d * e - p.s / 2, top: 540 + Math.sin(p.a) * p.d * e - p.s / 2,
                width: p.s, height: p.s, background: i % 3 ? "#c58bff" : "#fff2ff", opacity: 1 - k, boxShadow: "0 0 12px rgba(190,110,255,0.9)",
              }} />
            );
          })}
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: glow, boxShadow: "inset 0 0 240px 50px rgba(170,80,255,0.6)"}} />
      <AbsoluteFill style={{background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35))"}} />

      {audio === "drg" && (
        <Sequence from={f(OWNER_SOUND_AT)}><Audio src={staticFile("sfx/owner/drg_cards.mp3")} /></Sequence>
      )}
      {/* импакт: удар внутри файла на 0,10 с */}
      <Sequence from={hitF - 6}><Audio src={staticFile("sfx/foley/card_impact.wav")} volume={0.85} /></Sequence>
    </AbsoluteFill>
  );
};
