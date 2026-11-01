import React from "react";
import {AbsoluteFill, Img, staticFile, useVideoConfig} from "remotion";
import {HERO_IMG} from "./data";
import {ENEMY_IMG, VersusSplit, WorldBackdrop} from "./EndCard";
import {PixelLogo} from "./PixelText";

/* ───────────── Капсулы Steam: тот же стиль, что у концовки (мобы слева, герои справа, логотип) ───────────── */
export const CAPSULES = {
  header: {width: 920, height: 430},
  small: {width: 462, height: 174},
  main: {width: 1232, height: 706},
  vertical: {width: 748, height: 896},
  library: {width: 600, height: 900},
} as const;
export type CapsuleKind = keyof typeof CAPSULES;
export type CapsuleProps = {kind: CapsuleKind; world: string};

// [имя, x центра в долях ширины, высота в долях высоты, задний ряд]
type Fig = [string, number, number, boolean];
const WIDE_MOBS: Fig[] = [["craterbrute", 0.1, 0.78, true], ["junkling", 0.05, 0.56, false], ["popup", 0.2, 0.56, false]];
const WIDE_HEROES: Fig[] = [["brakka", 0.9, 0.82, true], ["glitch", 0.8, 0.62, false], ["grindbone", 0.95, 0.66, false]];
const TALL_MOBS: Fig[] = [["overlord", 0.16, 0.42, true], ["junkling", 0.1, 0.32, false], ["ping", 0.33, 0.34, false]];
const TALL_HEROES: Fig[] = [["brakka", 0.82, 0.46, true], ["glitch", 0.66, 0.36, false], ["grindbone", 0.9, 0.4, false]];

export const Capsule: React.FC<CapsuleProps> = ({kind, world}) => {
  const {width: W, height: H} = useVideoConfig();
  const tall = kind === "vertical" || kind === "library";
  const figs = kind === "small" ? [] : [...(tall ? TALL_MOBS : WIDE_MOBS).map((f) => [f, true] as const), ...(tall ? TALL_HEROES : WIDE_HEROES).map((f) => [f, false] as const)];
  const logoW = W * (kind === "small" ? 0.86 : tall ? 0.88 : 0.56);
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <WorldBackdrop world={world} />
      <VersusSplit reveal={1} />
      {figs.map(([[name, x, h, back], mob]) => {
        const height = H * h;
        const w = mob ? height : (height * 3) / 4;
        return (
          <Img
            key={name}
            src={staticFile(mob ? ENEMY_IMG(name) : HERO_IMG(name))}
            style={{
              position: "absolute",
              left: W * x - w / 2,
              bottom: back ? H * 0.06 : -H * 0.03,
              width: w,
              height,
              zIndex: back ? 1 : 2,
              transform: mob ? "scaleX(-1)" : undefined,
              filter: `brightness(${back ? 0.62 : 1}) drop-shadow(0 ${H * 0.02}px ${H * 0.03}px rgba(0,0,0,0.7))`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{background: `radial-gradient(${tall ? "70% 22% at 50% 14%" : "40% 42% at 50% 46%"}, rgba(7,7,13,0.7), transparent 75%)`, zIndex: 3}} />
      <AbsoluteFill style={{zIndex: 4, alignItems: "center", justifyContent: tall ? "flex-start" : "center", paddingTop: tall ? H * 0.07 : 0}}>
        <div style={{filter: `drop-shadow(0 ${H * 0.012}px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 ${H * 0.04}px rgba(255,170,90,0.35))`}}>
          <PixelLogo scale={logoW / 60} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
