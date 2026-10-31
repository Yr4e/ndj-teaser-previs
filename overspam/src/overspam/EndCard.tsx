import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BOSSES, GOLD, HERO_IMG, WORLDS} from "./data";
import {Backdrop, beatFrames, Camera, Flash, LAND, rand, Sfx, SPAWN, TickSfx} from "./kit";
import type {InsertProps} from "./Inserts";
import {PixelLogo, PixelText} from "./PixelText";

const FPS = 60;

/* ───────────── Концовка: герои, логотип, COMING SOON, кнопка Wishlist ───────────── */
export type EndCardProps = InsertProps & {line: string; button: string; site: string};
export const END_DEFAULTS: EndCardProps = {bpm: 120, sfx: true, line: "COMING SOON", button: "WISHLIST ON STEAM", site: "OVERSPAM.COM"};
export const endFrames = (p: InsertProps) => Math.round(beatFrames(p.bpm, FPS) * 12);

// слева и справа по 6 героев: [герой, x центра, высота, задний ряд]
const LEFT: [string, number, number, boolean][] = [
  ["wizzle", 110, 600, true], ["lunamoth", 300, 560, true], ["corvus", 450, 500, true],
  ["bongo", 90, 520, false], ["arcademon", 260, 540, false], ["cosmonaut", 410, 460, false],
];
const RIGHT: [string, number, number, boolean][] = [
  ["deadletter", 1470, 500, true], ["brakka", 1630, 580, true], ["junkpaw", 1810, 560, true],
  ["glitch", 1510, 460, false], ["grindbone", 1670, 540, false], ["spammer", 1840, 520, false],
];

const Gems: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: 46}, (_, i) => {
        const x = rand(i) * 1920;
        const sp = 0.6 + rand(i + 50) * 1.4;
        const y = 1100 - ((frame * sp + rand(i + 9) * 1200) % 1200);
        const sz = 6 + Math.floor(rand(i + 3) * 3) * 4;
        const c = [GOLD, "#6ff3ff", "#8fdc6a", "#ff4fd8"][i % 4];
        return (
          <div
            key={i}
            style={{position: "absolute", left: x, top: y, width: sz, height: sz, background: c, transform: "rotate(45deg)", opacity: 0.55, boxShadow: `0 0 12px ${c}`}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<EndCardProps> = ({bpm, sfx, line, button, site}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = beatFrames(bpm, FPS);
  const tHeroes = 4;
  const tLogo = B * 1;
  const tLine = B * 2;
  const tBtn = B * 3;
  const typed = Array.from({length: line.length}, (_, i) => tLine + i * (B / 8));
  const shown = typed.filter((t) => frame >= t).length;

  const logo = spring({frame: frame - tLogo, fps, config: SPAWN, durationInFrames: 26});
  const btn = spring({frame: frame - tBtn, fps, config: LAND, durationInFrames: 20});
  // кнопка «дышит» на каждую долю после появления
  const sinceBtn = frame - tBtn - B;
  const beatPhase = sinceBtn > 0 ? (sinceBtn % B) / B : 1;
  const pulse = sinceBtn > 0 ? Math.pow(1 - beatPhase, 3) : 0;

  const hero = (side: -1 | 1) => ([h, x, height, back]: [string, number, number, boolean], i: number) => {
    const s = spring({frame: frame - tHeroes - i * 2.5, fps, config: LAND, durationInFrames: 30});
    const w = (height * 3) / 4;
    return (
      <Img
        key={h}
        src={staticFile(HERO_IMG(h))}
        style={{
          position: "absolute",
          left: x - w / 2 + side * (1 - s) * 700,
          bottom: back ? 70 : -30,
          width: w,
          height,
          zIndex: back ? 1 : 2,
          filter: `brightness(${back ? 0.62 : 1}) drop-shadow(0 25px 30px rgba(0,0,0,0.7))`,
        }}
      />
    );
  };

  return (
    <AbsoluteFill>
      <Backdrop glow="#ff9a5a" glow2="#6ff3ff" />
      <Gems />
      <Camera hits={[tLogo]} push={0.03}>
        {LEFT.map(hero(-1))}
        {RIGHT.map(hero(1))}
        <AbsoluteFill style={{background: "radial-gradient(38% 50% at 50% 46%, rgba(7,7,13,0.75), transparent 75%)", zIndex: 3}} />
        <AbsoluteFill style={{alignItems: "center", zIndex: 4}}>
          <div
            style={{
              marginTop: 120,
              transform: `scale(${frame >= tLogo ? 2.2 - logo * 1.2 : 0})`,
              opacity: frame >= tLogo ? Math.min(1, (frame - tLogo) / 3) : 0,
              filter: "drop-shadow(0 18px 0 rgba(0,0,0,0.45)) drop-shadow(0 0 40px rgba(255,170,90,0.35))",
            }}
          >
            <PixelLogo scale={22} />
          </div>
          <div style={{marginTop: 70, height: 110}}>
            {shown > 0 && <PixelText text={line.slice(0, shown)} scale={11} style="white" />}
          </div>
          <div
            style={{
              marginTop: 40,
              opacity: btn,
              transform: `translateY(${(1 - btn) * 40}px) scale(${1 + pulse * 0.045})`,
              padding: "30px 54px",
              background: "#141020",
              border: `8px solid ${GOLD}`,
              boxShadow: `0 0 ${20 + pulse * 50}px ${GOLD}${pulse > 0.3 ? "cc" : "77"}, inset 0 -10px 0 #0a0812, 0 10px 0 #090911`,
            }}
          >
            <PixelText text={button} scale={7} style="logo" />
          </div>
          <div style={{marginTop: 44, opacity: interpolate(frame, [tBtn + B * 0.5, tBtn + B], [0, 0.85], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
            <PixelText text={site} scale={4} style="dim" noOutline />
          </div>
        </AbsoluteFill>
      </Camera>
      <Flash at={tLogo} strength={0.6} len={14} />
      {sfx && (
        <>
          <Sfx at={tHeroes} src="sfx/foley/whoosh_l_lr.mp3" volume={0.5} />
          <TickSfx ticks={typed} volume={0.35} slam={tLogo} slamVolume={1} />
          <Sfx at={tBtn} src="sfx/foley/drop_in.mp3" volume={0.6} />
        </>
      )}
    </AbsoluteFill>
  );
};

/* ───────────── Плашка босса (прозрачный фон, кладётся на стоп-кадр) ───────────── */
export type BossProps = {boss: number; bpm: number; sfx: boolean};
export const bossFrames = (p: {bpm: number}) => Math.round(beatFrames(p.bpm, FPS) * 5);

export const BossIntro: React.FC<BossProps> = ({boss, bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const B = beatFrames(bpm, FPS);
  const b = BOSSES[boss];
  const w = WORLDS[b.world];
  const tName = B;
  const out = durationInFrames - 12;
  const bars = spring({frame, fps, config: LAND, durationInFrames: 16}) * interpolate(frame, [out, durationInFrames], [1, 0], {extrapolateLeft: "clamp"});
  const name = spring({frame: frame - tName, fps, config: SPAWN, durationInFrames: 22});
  const hpTicks = Array.from({length: 20}, (_, i) => tName + B * 0.5 + i * (B / 16));
  const hp = hpTicks.filter((t) => frame >= t).length / 20;
  const fade = interpolate(frame, [out, durationInFrames], [1, 0], {extrapolateLeft: "clamp"});
  return (
    <AbsoluteFill>
      {/* затемнение и кинорамка */}
      <AbsoluteFill style={{background: `linear-gradient(90deg, rgba(7,7,13,${0.75 * bars}), rgba(7,7,13,${0.15 * bars}) 70%)`}} />
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 120 * bars, background: "#000"}} />
      <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 120 * bars, background: "#000"}} />
      <Camera hits={[tName]} push={0}>
        <div style={{position: "absolute", left: 130, top: 610, opacity: fade}}>
          <div style={{opacity: Math.min(1, frame / 10), transform: `translateX(${(1 - bars) * -60}px)`, display: "flex", gap: 22, alignItems: "center"}}>
            <div style={{width: 18, height: 18, background: w.color, transform: "rotate(45deg)"}} />
            <PixelText text={`BOSS · 0${b.world + 1} ${w.name}`} scale={5} style="white" />
          </div>
          <div style={{marginTop: 28, transform: `scale(${frame >= tName ? 1.5 - name * 0.5 : 0})`, transformOrigin: "0% 50%", opacity: frame >= tName ? 1 : 0}}>
            <PixelText text={b.name} scale={b.name.length > 13 ? 12 : 15} style="red" />
          </div>
          {/* полоска здоровья */}
          <div style={{marginTop: 34, width: 900, height: 34, background: "#1a0a10", border: "6px solid #090911", boxShadow: "0 0 0 4px #5a0e1e", opacity: frame >= tName ? 1 : 0}}>
            <div style={{width: `${hp * 100}%`, height: "100%", background: "linear-gradient(#ff6a6a, #c82434 60%, #8a1424)"}} />
          </div>
        </div>
      </Camera>
      <Flash at={tName} strength={0.35} />
      {sfx && (
        <>
          <Sfx at={0} src="sfx/foley/whoosh_l_lr.mp3" volume={0.4} />
          <TickSfx ticks={hpTicks} every={2} volume={0.3} slam={tName} slamVolume={1} />
        </>
      )}
    </AbsoluteFill>
  );
};
