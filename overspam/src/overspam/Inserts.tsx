import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {CARD, GAME, GOLD, HERO_IMG, HEROES, ITEMS, TOMES, WEAPONS, WORLD_IMG, WORLDS} from "./data";
import {Backdrop, beatFrames, Camera, Counter, Flash, LAND, rand, SPAWN, ticksDone, TickSfx} from "./kit";
import {PixelText} from "./PixelText";

/** Общие настройки вставок: темп музыки и звук тиков */
export type InsertProps = {bpm: number; sfx: boolean; transparent?: boolean};
export const INSERT_DEFAULTS: InsertProps = {bpm: 120, sfx: true};

const FPS = 60;
const START = 10;
/** Тики через равные доли такта: n штук, шаг = beat * frac */
const grid = (n: number, bpm: number, frac: number, start = START) =>
  Array.from({length: n}, (_, i) => start + i * beatFrames(bpm, FPS) * frac);
const HOLD = (bpm: number) => beatFrames(bpm, FPS) * 1.75;

/* ───────────── 5 WORLDS ───────────── */
const worldTicks = (bpm: number) => grid(5, bpm, 0.5);
export const worldsFrames = (p: InsertProps) => Math.round(worldTicks(p.bpm)[4] + HOLD(p.bpm));

export const Worlds: React.FC<InsertProps> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ticks = worldTicks(bpm);
  const n = ticksDone(frame, ticks);
  const slam = ticks[4];
  const W = 300;
  const H = 560;
  const GAP = 28;
  const left = (1920 - (W * 5 + GAP * 4)) / 2;
  return (
    <AbsoluteFill>
      <Backdrop glow={WORLDS[Math.max(0, n - 1)].color} />
      <Camera hits={[slam]}>
        <AbsoluteFill style={{alignItems: "center", top: 110}}>
          <Counter value={n} label="WORLDS" ticks={ticks} />
        </AbsoluteFill>
        {WORLDS.map((w, i) => {
          const t = frame - ticks[i];
          if (t < 0) return null;
          const s = spring({frame: t, fps, config: SPAWN, durationInFrames: 18});
          const flash = interpolate(t, [0, 9], [0.9, 0], {extrapolateRight: "clamp"});
          const pulse = frame >= slam ? spring({frame: frame - slam - i * 2, fps, config: SPAWN, durationInFrames: 14}) : 1;
          return (
            <div
              key={w.id}
              style={{
                position: "absolute",
                left: left + i * (W + GAP),
                top: 380,
                width: W,
                height: H,
                transform: `translateY(${(1 - s) * -70}px) scale(${1 + (1 - pulse) * 0.06})`,
                opacity: Math.min(1, t / 3),
                border: `6px solid ${w.color}`,
                background: "#000",
                overflow: "hidden",
                boxShadow: `0 0 50px ${w.color}55, 0 20px 40px rgba(0,0,0,0.6)`,
              }}
            >
              <Img
                src={staticFile(WORLD_IMG(w.id))}
                style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.15 - s * 0.1})`}}
              />
              <AbsoluteFill style={{background: "linear-gradient(transparent 45%, rgba(7,7,13,0.95))"}} />
              <div style={{position: "absolute", left: 22, bottom: 24}}>
                <PixelText text={`0${i + 1}`} scale={9} style="logo" />
                <div style={{height: 10}} />
                <PixelText text={w.name} scale={Math.min(5, Math.floor(((W - 56) / (w.name.length * 7)) * 4) / 4)} style="white" />
              </div>
              <AbsoluteFill style={{background: "#fffae8", opacity: flash}} />
            </div>
          );
        })}
      </Camera>
      <Flash at={slam} strength={0.35} />
      {sfx && <TickSfx ticks={ticks} slam={slam} />}
    </AbsoluteFill>
  );
};

/* ───────────── 12 HEROES ───────────── */
const heroTicks = (bpm: number) => grid(12, bpm, 0.25);
export const heroesFrames = (p: InsertProps) => Math.round(heroTicks(p.bpm)[11] + HOLD(p.bpm));

export const Heroes: React.FC<InsertProps> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ticks = heroTicks(bpm);
  const n = ticksDone(frame, ticks);
  const slam = ticks[11];
  return (
    <AbsoluteFill>
      <Backdrop glow="#ff9a5a" glow2="#6ff3ff" />
      <Camera hits={[slam]}>
        <AbsoluteFill style={{alignItems: "center", top: 90}}>
          <Counter value={n} label="HEROES" ticks={ticks} />
        </AbsoluteFill>
        {HEROES.map((h, i) => {
          const t = frame - ticks[i];
          if (t < 0) return null;
          const back = i % 2 === 1;
          const s = spring({frame: t, fps, config: SPAWN, durationInFrames: 20});
          const hop = frame >= slam ? Math.sin(Math.min(1, (frame - slam - (i % 4) * 2) / 14) * Math.PI) : 0;
          const glow = interpolate(t, [0, 10], [3, 1], {extrapolateRight: "clamp"});
          const w = back ? 300 : 345;
          const x = 165 + i * 145 - w / 2;
          return (
            <Img
              key={h}
              src={staticFile(HERO_IMG(h))}
              style={{
                position: "absolute",
                left: x,
                bottom: back ? 150 : 40,
                width: w,
                height: (w * 4) / 3,
                zIndex: back ? 1 : 2,
                transform: `translateY(${(1 - s) * 220 - Math.max(0, hop) * 30}px)`,
                filter: `brightness(${glow * (back ? 0.72 : 1)}) drop-shadow(0 20px 30px rgba(0,0,0,0.6))`,
              }}
            />
          );
        })}
      </Camera>
      <Flash at={slam} strength={0.3} />
      {sfx && <TickSfx ticks={ticks} slam={slam} volume={0.45} />}
    </AbsoluteFill>
  );
};

/* ───────────── 33 WEAPONS ───────────── */
const weaponTicks = (bpm: number) => grid(33, bpm, 1 / 12);
export const weaponsFrames = (p: InsertProps) => Math.round(weaponTicks(p.bpm)[32] + HOLD(p.bpm));

const Slot: React.FC<{size: number; lit: number; children?: React.ReactNode}> = ({size, lit, children}) => (
  <div
    style={{
      width: size,
      height: size,
      background: "#11111c",
      border: `5px solid ${lit > 0.01 ? GOLD : "#262638"}`,
      boxShadow: lit > 0.01 ? `0 0 ${30 * lit}px ${GOLD}aa, inset 0 0 ${20 * lit}px ${GOLD}66` : "inset 0 0 0 3px #0a0a12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}
  >
    {children}
  </div>
);

export const Weapons: React.FC<InsertProps> = ({bpm, sfx, transparent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ticks = weaponTicks(bpm);
  const n = ticksDone(frame, ticks);
  const slam = ticks[32];
  const COLS = 11;
  const SIZE = 126;
  const GAP = 18;
  const left = (1920 - (COLS * SIZE + (COLS - 1) * GAP)) / 2;
  return (
    <AbsoluteFill>
      {!transparent && <Backdrop glow={GOLD} glow2="#ff4fd8" />}
      <Camera hits={[slam]}>
        <AbsoluteFill style={{alignItems: "center", top: 120}}>
          <Counter value={n} label="WEAPONS" ticks={ticks} />
        </AbsoluteFill>
        {Array.from({length: 33}, (_, i) => {
          const t = frame - ticks[i];
          const on = t >= 0;
          const s = on ? spring({frame: t, fps, config: SPAWN, durationInFrames: 16}) : 0;
          const lit = on ? interpolate(t, [0, 14], [1, 0], {extrapolateRight: "clamp"}) : 0;
          const wave = frame >= slam ? Math.max(0, Math.sin(Math.min(1, (frame - slam - (i % COLS) * 1.2) / 12) * Math.PI)) : 0;
          const weapon = WEAPONS[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: left + (i % COLS) * (SIZE + GAP),
                top: 430 + Math.floor(i / COLS) * (SIZE + GAP),
                transform: `translateY(${-wave * 18}px)`,
              }}
            >
              <Slot size={SIZE} lit={Math.max(lit, wave * 0.6)}>
                {on &&
                  (weapon ? (
                    <Img
                      src={staticFile(GAME(weapon))}
                      style={{width: SIZE - 18, height: SIZE - 18, imageRendering: "pixelated", transform: `scale(${s}) rotate(${(1 - s) * -25}deg)`}}
                    />
                  ) : (
                    <div style={{transform: `scale(${s})`}}>
                      <PixelText text="?" scale={9} style="dim" />
                    </div>
                  ))}
              </Slot>
            </div>
          );
        })}
      </Camera>
      {!transparent && <Flash at={slam} strength={0.3} />}
      {sfx && <TickSfx ticks={ticks} slam={slam} volume={0.35} />}
    </AbsoluteFill>
  );
};

/* ───────────── 85 ITEMS ───────────── */
const itemTicks = (bpm: number) => grid(85, bpm, 1 / 32);
export const itemsFrames = (p: InsertProps) => Math.round(itemTicks(p.bpm)[84] + HOLD(p.bpm));

/** Позиции предметов вокруг центра, центр под надпись оставляем пустым */
const itemSpots = (() => {
  const spots: {x: number; y: number; s: number; r: number}[] = [];
  let k = 0;
  while (spots.length < 85 && k < 5000) {
    k++;
    const x = 40 + rand(k) * 1840;
    const y = 40 + rand(k + 999) * 1000;
    if (x > 330 && x < 1590 && y > 330 && y < 750) continue;
    const s = 92 + rand(k + 77) * 70;
    if (spots.some((p) => Math.hypot(p.x - x, p.y - y) < (p.s + s) * 0.42)) continue;
    spots.push({x, y, s, r: (rand(k + 5) - 0.5) * 40});
  }
  return spots;
})();

export const Items: React.FC<InsertProps> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ticks = itemTicks(bpm);
  const n = ticksDone(frame, ticks);
  const slam = ticks[84];
  return (
    <AbsoluteFill>
      <Backdrop glow="#ff4fd8" glow2="#6ff3ff" />
      <Camera hits={[slam]} push={0.05}>
        {ITEMS.map((it, i) => {
          const p = itemSpots[i % itemSpots.length];
          const t = frame - ticks[i];
          if (t < 0 || !p) return null;
          const s = spring({frame: t, fps, config: SPAWN, durationInFrames: 14});
          const kick = frame >= slam ? spring({frame: frame - slam, fps, config: LAND, durationInFrames: 20}) : 0;
          const dx = (p.x - 960) * 0.06 * kick;
          const dy = (p.y - 540) * 0.06 * kick;
          return (
            <Img
              key={it}
              src={staticFile(GAME(it))}
              style={{
                position: "absolute",
                left: p.x - p.s / 2 + dx,
                top: p.y - p.s / 2 + dy,
                width: p.s,
                height: p.s,
                imageRendering: "pixelated",
                transform: `scale(${s}) rotate(${p.r + (1 - s) * 60}deg)`,
                filter: `drop-shadow(0 8px 10px rgba(0,0,0,0.7))`,
              }}
            />
          );
        })}
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
          <Counter value={n} label="ITEMS" ticks={ticks} numScale={26} labelScale={14} />
        </AbsoluteFill>
      </Camera>
      <Flash at={slam} strength={0.3} />
      {sfx && <TickSfx ticks={ticks} every={3} slam={slam} volume={0.3} />}
    </AbsoluteFill>
  );
};

/* ───────────── 23 TOMES ───────────── */
const tomeTicks = (bpm: number) => grid(23, bpm, 1 / 8);
export const tomesFrames = (p: InsertProps) => Math.round(tomeTicks(p.bpm)[22] + HOLD(p.bpm));

export const Tomes: React.FC<InsertProps> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ticks = tomeTicks(bpm);
  const n = ticksDone(frame, ticks);
  const slam = ticks[22];
  const PIVOT_Y = 1960;
  const R = 1330;
  return (
    <AbsoluteFill>
      <Backdrop glow="#ffba6a" glow2="#a070ff" />
      <Camera hits={[slam]}>
        <AbsoluteFill style={{alignItems: "center", top: 100}}>
          <Counter value={n} label="TOMES" ticks={ticks} />
        </AbsoluteFill>
        {TOMES.map((tm, i) => {
          const t = frame - ticks[i];
          if (t < 0) return null;
          const s = spring({frame: t, fps, config: LAND, durationInFrames: 18});
          const a = interpolate(i, [0, 22], [-44, 44]);
          const rad = (a * Math.PI) / 180;
          const r = R * (0.75 + 0.25 * s);
          const x = 960 + Math.sin(rad) * r;
          const y = PIVOT_Y - Math.cos(rad) * r;
          const lift = frame >= slam ? Math.max(0, Math.sin(Math.min(1, (frame - slam - Math.abs(i - 11)) / 12) * Math.PI)) * 30 : 0;
          return (
            <Img
              key={tm}
              src={staticFile(CARD(`${tm}_card`))}
              style={{
                position: "absolute",
                left: x - 100,
                top: y - 136 - lift,
                width: 200,
                height: 272,
                imageRendering: "pixelated",
                transform: `rotate(${a}deg)`,
                opacity: Math.min(1, t / 3),
                filter: `brightness(${interpolate(t, [0, 10], [2.2, 1], {extrapolateRight: "clamp"})}) drop-shadow(0 12px 18px rgba(0,0,0,0.7))`,
              }}
            />
          );
        })}
      </Camera>
      <Flash at={slam} strength={0.3} />
      {sfx && <TickSfx ticks={ticks} slam={slam} volume={0.4} />}
    </AbsoluteFill>
  );
};

/* ───────────── 33 + 85 + 23 + 12 = 1 BUILD NOBODY PLANNED ───────────── */
const buildBeats = (bpm: number) => grid(5, bpm, 1);
export const buildFrames = (p: InsertProps) => Math.round(buildBeats(p.bpm)[4] + beatFrames(p.bpm, FPS) * 2.5);

const TERMS = [
  {n: "33", label: "WEAPONS", icon: GAME("junk_rocket")},
  {n: "85", label: "ITEMS", icon: GAME("energy_drink")},
  {n: "23", label: "TOMES", icon: "overspam/game/224x232_chaos_mini.png"},
  {n: "12", label: "PASSIVES", icon: GAME("loot_dice")},
];

export const Build: React.FC<InsertProps> = ({bpm, sfx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beats = buildBeats(bpm);
  const slam = beats[4];
  const collapse = spring({frame: frame - slam + 6, fps, config: LAND, durationInFrames: 14});
  const big = spring({frame: frame - slam, fps, config: SPAWN, durationInFrames: 22});
  return (
    <AbsoluteFill>
      <Backdrop glow={frame >= slam ? "#ff9a5a" : "#6ff3ff"} glow2="#ff4fd8" />
      <Camera hits={[slam]} push={0.05}>
        {/* ряд слагаемых */}
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 40,
            opacity: 1 - collapse,
            transform: `scale(${1 - collapse * 0.5})`,
          }}
        >
          {TERMS.map((tm, i) => {
            const t = frame - beats[i];
            const s = t >= 0 ? spring({frame: t, fps, config: SPAWN, durationInFrames: 18}) : 0;
            return (
              <React.Fragment key={tm.label}>
                {i > 0 && (
                  <div style={{opacity: s}}>
                    <PixelText text="+" scale={12} style="dim" />
                  </div>
                )}
                <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: s, transform: `scale(${s})`}}>
                  <Img src={staticFile(tm.icon)} style={{width: 120, height: 120, objectFit: "contain", imageRendering: "pixelated"}} />
                  <PixelText text={tm.n} scale={16} style="logo" />
                  <PixelText text={tm.label} scale={5} style="white" />
                </div>
              </React.Fragment>
            );
          })}
        </AbsoluteFill>
        {/* итог */}
        {frame >= slam && (
          <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 46, transform: `scale(${0.6 + big * 0.4})`, opacity: Math.min(1, big * 2)}}>
            <div style={{display: "flex", alignItems: "flex-end", gap: 70}}>
              <PixelText text="1" scale={30} style="logo" />
              <PixelText text="BUILD" scale={30} style="logo" />
            </div>
            <PixelText text="NOBODY PLANNED" scale={11} style="white" />
          </AbsoluteFill>
        )}
      </Camera>
      <Flash at={slam} strength={0.7} len={14} />
      {sfx && <TickSfx ticks={beats.slice(0, 4)} slam={slam} volume={0.6} slamVolume={1} />}
    </AbsoluteFill>
  );
};
