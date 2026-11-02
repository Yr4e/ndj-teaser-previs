import React from "react";
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {FOOTAGE, GOLD, HERO_INFO} from "./data";
import type {InsertProps} from "./Inserts";
import {beatFrames, Camera, Counter, Flash, LAND, SPAWN, TickSfx} from "./kit";
import {PixelText} from "./PixelText";

/* Вставки для трейлера «этой осенью» (PLAN.md): титр, плашки героев и карты, нарезки карт и сундуков */

const FPS = 60;
const fade = (frame: number, start: number, end: number, len = 10) =>
  interpolate(frame, [start, start + len, end - len, end], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

/** Плавное появление текста: из размытия и чуть снизу */
const Soft: React.FC<{at: number; until: number; children: React.ReactNode}> = ({at, until, children}) => {
  const frame = useCurrentFrame();
  const o = fade(frame, at, until, 14);
  const t = interpolate(frame - at, [0, 18], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <div style={{opacity: o, filter: `blur(${t * 8}px)`, transform: `translateY(${t * 10}px) scale(${1 + t * 0.04})`}}>{children}</div>;
};

/* ───────────── Титр по референсу Fast Cuts: чёрный экран, 2 карточки по такту ─────────────
   Карточка 1 в три яруса: мелко сверху, крупно название, мелко снизу (как INTRODUCING / FAST CUTS / SOUND DESIGN TRACKS).
   Карточка 2: маленький знак студии — ромбик и имя (как LENS DISTORTIONS). */
export type TitleProps = InsertProps & {top: string; main: string; bottom: string; byline: string; studio: string};
export const TITLE_DEFAULTS: TitleProps = {
  bpm: 130,
  sfx: false,
  top: "COMING",
  main: "THIS FALL",
  bottom: "5 WORLDS · 12 HEROES · ONE RIDICULOUS RUN",
  byline: "FROM THE CREATORS OF",
  studio: "INPUTLAG.APP",
};
export const titleFrames = (p: InsertProps) => Math.round(beatFrames(p.bpm, FPS) * 8);

export const Title: React.FC<TitleProps> = ({bpm, top, main, bottom, byline, studio}) => {
  const bar = beatFrames(bpm, FPS) * 4;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 26}}>
        <Soft at={2} until={bar}>
          <PixelText text={top} scale={3} style="dim" spacing={3} noOutline />
        </Soft>
        <Soft at={6} until={bar}>
          <PixelText text={main} scale={9} style="white" />
        </Soft>
        <Soft at={12} until={bar}>
          <PixelText text={bottom} scale={3} style="dim" spacing={2} noOutline />
        </Soft>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 22}}>
        <Soft at={bar + 2} until={bar * 2}>
          <PixelText text={byline} scale={3} style="dim" spacing={3} noOutline />
        </Soft>
        <Soft at={bar + 8} until={bar * 2}>
          <div style={{display: "flex", alignItems: "center", gap: 20}}>
            <div style={{width: 18, height: 18, border: `4px solid ${GOLD}`, transform: "rotate(45deg)", boxShadow: `0 0 14px ${GOLD}88`}} />
            <PixelText text={studio} scale={5} style="logo" />
          </div>
        </Soft>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── Плашка героя (прозрачная): имя, роль, пассивка ───────────── */
export type HeroTagProps = InsertProps & {hero: string};
export const heroTagFrames = (p: InsertProps) => Math.round(beatFrames(p.bpm, FPS) * 6);

export const HeroTag: React.FC<HeroTagProps> = ({hero}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const info = HERO_INFO[hero] ?? {name: hero.toUpperCase(), role: "", passive: ""};
  const inS = spring({frame, fps, config: LAND, durationInFrames: 18});
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const wipe = interpolate(frame, [4, 16], [0, 100], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 110,
          bottom: 130,
          padding: "34px 54px 34px 40px",
          background: "linear-gradient(90deg, rgba(7,7,13,0.82), rgba(7,7,13,0.55) 75%, transparent)",
          borderLeft: `10px solid ${GOLD}`,
          boxShadow: `-6px 0 30px ${GOLD}55`,
          opacity: (1 - out) * Math.min(1, frame / 4),
          transform: `translateX(${(1 - inS) * -160 - out * 120}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>
          <PixelText text={info.name} scale={11} style="logo" />
        </div>
        <div style={{opacity: fade(frame, 12, durationInFrames + 20, 8)}}>
          <PixelText text={info.role} scale={5} style="white" />
        </div>
        {info.passive && (
          <div style={{opacity: fade(frame, 20, durationInFrames + 20, 8), display: "flex", gap: 18, alignItems: "center"}}>
            <PixelText text="PASSIVE" scale={3} style="dim" noOutline />
            <PixelText text={info.passive} scale={4} style="logo" />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Метка на карте (прозрачная): CHESTS, SHRINES… поверх геймплея, 1–1,5 с ───────────── */
export type MapTagProps = InsertProps & {tag: string};
export const mapTagFrames = (p: InsertProps) => Math.round(beatFrames(p.bpm, FPS) * 3);

export const MapTag: React.FC<MapTagProps> = ({tag}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: SPAWN, durationInFrames: 16});
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-end", paddingBottom: 190}}>
      <div style={{opacity: 1 - out, transform: `scale(${0.6 + 0.4 * s}) translateY(${out * -20}px)`, display: "flex", alignItems: "center", gap: 26, filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.45)) drop-shadow(0 0 26px rgba(0,0,0,0.6))"}}>
        <div style={{width: 22, height: 22, background: GOLD, transform: "rotate(45deg)", boxShadow: `0 0 18px ${GOLD}`}} />
        <PixelText text={tag} scale={9} style="logo" />
        <div style={{width: 22, height: 22, background: GOLD, transform: "rotate(45deg)", boxShadow: `0 0 18px ${GOLD}`}} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── Нарезка записей по долям: общий кусок для карт и сундуков ───────────── */
type Shot = {src: string; at: number; beats: number; zoom?: number};
const shotStarts = (shots: Shot[], beat: number) => shots.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + shots[i - 1].beats * beat : 0], []);

const Cuts: React.FC<{shots: Shot[]; beat: number; zoomFrom?: number}> = ({shots, beat}) => {
  const starts = shotStarts(shots, beat);
  return (
    <>
      {shots.map((s, i) => (
        <Sequence key={i} from={Math.round(starts[i])} durationInFrames={Math.round(s.beats * beat) + 1}>
          <AbsoluteFill style={{transform: `scale(${s.zoom ?? 1})`}}>
            <OffthreadVideo src={staticFile(FOOTAGE(s.src))} startFrom={Math.round(s.at * FPS)} muted style={{width: "100%", height: "100%"}} />
          </AbsoluteFill>
        </Sequence>
      ))}
    </>
  );
};

/* ───────────── Карты: рероллы по полдоли, в конце выбор с золотым свечением ───────────── */
// секунды в footage/cards_reroll.mp4: чистые кадры разных рероллов и выбор карты
const REROLLS = [4.05, 10.05, 18.05, 26.05, 31.05, 35.05, 39.05, 45.05];
const CARD_PICK = 48.0;
const cardShots: Shot[] = [...REROLLS.map((at) => ({src: "cards_reroll.mp4", at, beats: 0.5, zoom: 1.3})), {src: "cards_reroll.mp4", at: CARD_PICK, beats: 1.5, zoom: 1.36}];
export const cardsFrames = (p: InsertProps) => Math.round(beatFrames(p.bpm, FPS) * cardShots.reduce((a, s) => a + s.beats, 0));

export const Cards: React.FC<InsertProps> = ({bpm, sfx}) => {
  const beat = beatFrames(bpm, FPS);
  const starts = shotStarts(cardShots, beat);
  const pick = starts[starts.length - 1];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Camera hits={[pick]} push={0.02}>
        <Cuts shots={cardShots} beat={beat} />
      </Camera>
      <AbsoluteFill style={{background: "linear-gradient(rgba(0,0,0,0.97) 6%, transparent 24%, transparent 82%, rgba(0,0,0,0.7))"}} />
      <AbsoluteFill style={{alignItems: "center", paddingTop: 54}}>
        <PixelText text="LEVEL UP" scale={10} style="logo" />
      </AbsoluteFill>
      <Flash at={pick} strength={0.25} />
      {sfx && <TickSfx ticks={starts.slice(0, -1)} slam={pick} volume={0.4} />}
    </AbsoluteFill>
  );
};

/* ───────────── Сундуки: 2 открытия по доле, на третьем ударе карточка награды, счётчик тикает ───────────── */
const chestShots: Shot[] = [
  {src: "chests/chest_3.mp4", at: 0.85, beats: 1, zoom: 1.08},
  {src: "chests/chest_1.mp4", at: 1.7, beats: 1, zoom: 1.08},
  {src: "chests/chest_1.mp4", at: 2.15, beats: 2.5, zoom: 1.18},
];
export const chestsFrames = (p: InsertProps) => Math.round(beatFrames(p.bpm, FPS) * chestShots.reduce((a, s) => a + s.beats, 0));

export const Chests: React.FC<InsertProps> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const beat = beatFrames(bpm, FPS);
  const starts = shotStarts(chestShots, beat);
  const slam = starts[2];
  const n = starts.filter((s) => frame >= s).length;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Camera hits={[slam]} push={0.03}>
        <Cuts shots={chestShots} beat={beat} />
      </Camera>
      <AbsoluteFill style={{background: "linear-gradient(rgba(0,0,0,0.75), transparent 24%)"}} />
      <AbsoluteFill style={{alignItems: "center", paddingTop: 50}}>
        <Counter value={n} label="CHESTS" ticks={starts} numScale={14} labelScale={8} />
      </AbsoluteFill>
      <Flash at={slam} strength={0.3} />
      {sfx && <TickSfx ticks={starts.slice(0, -1)} slam={slam} volume={0.45} />}
    </AbsoluteFill>
  );
};
