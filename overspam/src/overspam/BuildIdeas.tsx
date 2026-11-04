import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {CARD, GAME, ITEMS, TOMES, WEAPONS} from "./data";
import {PixelText} from "./PixelText";

/* Наброски трёх вариантов вставки билда (16,9–20,7 с трека v2): по одному стоп-кадру из середины (~18,6 с, гул).
   1 — формула крупно; 2 — гора лута; 3 — экран выбора карты из игры. Только для выбора владельцем. */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Glow: React.FC<{x?: string; y?: string; c?: string}> = ({x = "50%", y = "55%", c = "255,140,60"}) => (
  <AbsoluteFill style={{background: `radial-gradient(45% 50% at ${x} ${y}, rgba(${c},0.35), transparent 70%)`}} />
);

const V1: React.FC = () => (
  // середина: 33 WEAPONS и 85 ITEMS уже стоят, + 23 CARDS бьёт прямо сейчас, вокруг вспышка иконок
  <AbsoluteFill style={{background: "#06050b"}}>
    <Glow x="62%" y="50%" />
    {Array.from({length: 14}, (_, i) => {
      const a = rnd(i) * Math.PI * 2;
      const r = 180 + rnd(i + 9) * 160;
      return <Img key={i} src={staticFile(CARD(`${TOMES[i % TOMES.length]}_card`))} style={{position: "absolute", left: 1330 + Math.cos(a) * r - 40, top: 520 + Math.sin(a) * r * 0.7 - 54, width: 80, height: 108, transform: `rotate(${(rnd(i + 3) - 0.5) * 60}deg)`, opacity: 0.85, imageRendering: "pixelated", filter: "drop-shadow(0 0 14px rgba(255,150,70,0.6))"}} />;
    })}
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 90}}>
      {[["33", "WEAPONS", 0.55], ["+85", "ITEMS", 0.8], ["+23", "CARDS", 1]].map(([n, w, o], i) => (
        <div key={i} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: o as number, transform: `scale(${i === 2 ? 1.08 : 1})`}}>
          <PixelText text={n as string} scale={i === 2 ? 18 : 14} style="logo" />
          <PixelText text={w as string} scale={6} style="white" />
        </div>
      ))}
    </AbsoluteFill>
  </AbsoluteFill>
);

const V2: React.FC = () => {
  // середина: на чёрный упали пушка и уже десятки предметов и карт — растёт куча, сверху падают новые
  const pile = Array.from({length: 110}, (_, i) => {
    const row = Math.floor(Math.sqrt(i * 1.3));
    const x = 960 + (rnd(i * 2.1) - 0.5) * Math.max(160, 1250 - row * 105);
    const y = 1040 - row * 62 - rnd(i * 3.3) * 34;
    const src = i % 3 === 0 ? GAME(WEAPONS[i % WEAPONS.length]) : i % 3 === 1 ? GAME(ITEMS[(i * 7) % ITEMS.length]) : CARD(`${TOMES[i % TOMES.length]}_card`);
    return {x, y, src, r: (rnd(i * 5.7) - 0.5) * 80, s: 130 + rnd(i) * 60};
  });
  const falling = Array.from({length: 5}, (_, i) => ({x: 760 + i * 110 + rnd(i * 9) * 40, y: 120 + rnd(i * 4) * 260, src: GAME(ITEMS[(i * 13) % ITEMS.length])}));
  return (
    <AbsoluteFill style={{background: "#06050b"}}>
      <Glow y="80%" />
      {pile.map((p, i) => (
        <Img key={i} src={staticFile(p.src)} style={{position: "absolute", left: p.x - p.s / 2, top: p.y - p.s / 2, width: p.src.includes("224x304") ? p.s * 0.74 : p.s, height: p.s, transform: `rotate(${p.r}deg)`, imageRendering: "pixelated", filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.7))"}} />
      ))}
      {falling.map((p, i) => (
        <Img key={`f${i}`} src={staticFile(p.src)} style={{position: "absolute", left: p.x, top: p.y, width: 110, height: 110, imageRendering: "pixelated", filter: "blur(1.5px) drop-shadow(0 0 10px rgba(255,170,90,0.5))"}} />
      ))}
      <div style={{position: "absolute", left: 120, top: 120}}>
        <PixelText text="85 ITEMS" scale={8} style="logo" />
      </div>
    </AbsoluteFill>
  );
};

const V3: React.FC = () => (
  // середина: реальный экран CHOOSE A CARD замер, камера наехала на центральную карту, рядом всплыло число
  <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
    <Img src={staticFile("overspam/choose_card_mock.png")} style={{position: "absolute", width: 1920 * 1.45, height: 1080 * 1.45, left: -960 * 1.45 + 960, top: -540 * 1.45 + 560, filter: "brightness(0.8) saturate(1.15)"}} />
    <AbsoluteFill style={{background: "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0) 30%), radial-gradient(45% 60% at 50% 60%, transparent 45%, rgba(0,0,0,0.7))"}} />
    <div style={{position: "absolute", right: 140, top: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
      <PixelText text="23" scale={18} style="logo" />
      <PixelText text="CARDS" scale={6} style="white" />
    </div>
    <div style={{position: "absolute", left: 140, top: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.55}}>
      <PixelText text="33" scale={14} style="logo" />
      <PixelText text="WEAPONS" scale={5} style="white" />
    </div>
  </AbsoluteFill>
);

export const BuildIdeas: React.FC<{variant: number}> = ({variant}) => (variant === 1 ? <V1 /> : variant === 2 ? <V2 /> : <V3 />);
