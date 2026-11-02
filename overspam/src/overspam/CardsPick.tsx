import React from "react";
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {FOOTAGE} from "./data";
import {SPAWN} from "./kit";

/* ───────────── Выбор карты по рефу: геймплей → БУМС, меню → карты листаются на щелчки → фиолетовая → сразу бой ─────────────
   Время звука взято из рефа владельца: бумс на 1,5 с, щелчки-слайды 1,86–2,99 с.
   audio = "ours" (свои звуки на те же моменты, можно в Steam) или "ref" (звук рефа, только для сравнения). */
export type CardsPickProps = {audio: "ours" | "ref"};
export const CARDS_PICK_DEFAULTS: CardsPickProps = {audio: "ours"};

const FPS = 60;
const SRC = FOOTAGE("cards_reroll_forest.mp4");
const f = (s: number) => Math.round(s * FPS);

const BOOM = 1.5; // меню открывается на бумс
const CLICKS = [1.862, 1.994, 2.134, 2.316, 2.495, 2.683, 2.797]; // смены карт (щелчки рефа + 0,5 с)
const PURPLE = 2.987; // последняя смена → фиолетовая
const PICK = 3.37; // выбор: без замедления, сразу в бой
const END = 5.3;
export const cardsPickFrames = f(END);

// в исходнике: кадры, где новые карты уже полностью видны (берём самые цветные наборы).
// Смена = жёсткая склейка, как в рефе: без полупрозрачной анимации реролла
const REROLLS = [2.44, 3.12, 7.77, 14.15, 18.4, 21.04, 25.07];

type Shot = {from: number; to: number; src: number; rate: number};
const SHOTS: Shot[] = (() => {
  const s: Shot[] = [];
  // 0–1,5 с: беготня в бою (1,25 с записи растянуты чуть-чуть, незаметно)
  s.push({from: 0, to: BOOM, src: 0, rate: 1.25 / BOOM});
  // меню выезжает (анимация игры 1,25–1,6 с), стоит до первого щелчка
  s.push({from: BOOM, to: CLICKS[0], src: 1.25, rate: 1});
  // каждая смена карт: склейка точно на щелчок
  CLICKS.forEach((c, i) => {
    const next = i + 1 < CLICKS.length ? CLICKS[i + 1] : PURPLE;
    s.push({from: c, to: next, src: REROLLS[i], rate: 1});
  });
  // фиолетовая
  s.push({from: PURPLE, to: PICK, src: 43.27, rate: 1});
  // бой после выбора
  s.push({from: PICK, to: END, src: 49.45, rate: 1});
  return s;
})();

/** удар камеры: короткий наезд, который пружиной возвращается */
const punch = (frame: number, at: number, amount: number) => {
  if (frame < at) return 0;
  return amount * (1 - spring({frame: frame - at, fps: FPS, config: SPAWN, durationInFrames: 16}));
};

export const CardsPick: React.FC<CardsPickProps> = ({audio}) => {
  const frame = useCurrentFrame();
  const scale =
    1 +
    punch(frame, f(BOOM), 0.05) +
    CLICKS.reduce((a, c) => a + punch(frame, f(c), 0.012), 0) +
    punch(frame, f(PURPLE), 0.06) +
    punch(frame, f(PICK), 0.09);
  // цветной разъезд на ударах
  const split = Math.max(...[BOOM, PURPLE, PICK].map((t) => interpolate(frame - f(t), [0, 2, 9], [0, 7, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})));
  // фиолетовое свечение по краям, пока висит фиолетовая
  const glow = interpolate(frame, [f(PURPLE), f(PURPLE) + 4, f(PICK) - 2, f(PICK) + 6], [0, 1, 0.8, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const gameVol = (fr: number) =>
    interpolate(fr, [0, f(BOOM) - 4, f(BOOM), f(PICK), f(PICK) + 6], [0.55, 0.55, 0.12, 0.12, 0.6], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

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
      <AbsoluteFill style={{transform: `scale(${scale})`, filter: split > 0.3 ? "url(#cp-split)" : undefined}}>
        {SHOTS.map((s, i) => (
          <Sequence key={i} from={f(s.from)} durationInFrames={f(s.to) - f(s.from)}>
            <OffthreadVideo
              src={staticFile(SRC)}
              startFrom={f(s.src)}
              playbackRate={s.rate}
              volume={(fr) => (audio === "ours" && (i === 0 || i === SHOTS.length - 1) ? gameVol(fr + f(s.from)) : 0)}
              style={{width: "100%", height: "100%"}}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: glow, boxShadow: "inset 0 0 220px 40px rgba(180,80,255,0.55)"}} />
      <AbsoluteFill style={{background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35))"}} />

      {audio === "ref" ? (
        <Sequence from={f(0.5)}>
          <Audio src={staticFile("sfx/ref/cards_ref.wav")} volume={(fr) => interpolate(fr, [0, 10, f(3.15), f(3.25)], [0, 1, 1, 0], {extrapolateRight: "clamp"})} />
        </Sequence>
      ) : (
        <>
          <Sequence from={f(BOOM) - 1}><Audio src={staticFile("sfx/foley/boom_open.mp3")} volume={0.9} /></Sequence>
          {[...CLICKS, PURPLE].map((c, i) => (
            <Sequence key={c} from={f(c)} durationInFrames={20}>
              <Audio src={staticFile(`sfx/foley/card_slide_${(i % 4) + 1}.mp3`)} volume={0.55} />
            </Sequence>
          ))}
          <Sequence from={f(PURPLE)}><Audio src={staticFile("sfx/foley/chime_soft.mp3")} volume={0.35} /></Sequence>
          <Sequence from={f(PICK) - 1}><Audio src={staticFile("sfx/foley/boom_pick.mp3")} volume={0.75} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
