import React from "react";
import {AbsoluteFill, Img, staticFile, useVideoConfig} from "remotion";
import {BOSSES, HERO_IMG, WORLDS} from "./data";
import {ENEMY_IMG, VersusSplit, WorldBackdrop} from "./EndCard";
import {PixelLogo} from "./PixelText";

/* ───────────── Капсулы Steam: тот же стиль, что у концовки (мобы слева, герои справа, логотип) ───────────── */
export const CAPSULES = {
  header: {width: 920, height: 430},
  small: {width: 462, height: 174},
  main: {width: 1232, height: 706},
  vertical: {width: 748, height: 896},
  library: {width: 600, height: 900},
  // библиотека Steam: широкий фон без текста и логотип на прозрачном фоне
  libraryHero: {width: 3840, height: 1240},
  libraryLogo: {width: 1280, height: 720},
} as const;
export type CapsuleKind = keyof typeof CAPSULES;
export type CapsuleProps = {kind: CapsuleKind; world: string};

// [имя, x центра в долях ширины, высота в долях высоты, задний ряд]
type Fig = [string, number, number, boolean];
const WIDE_MOBS: Fig[] = [["craterbrute", 0.1, 0.78, true], ["junkling", 0.05, 0.56, false], ["popup", 0.2, 0.56, false]];
const WIDE_HEROES: Fig[] = [["brakka", 0.9, 0.82, true], ["glitch", 0.8, 0.62, false], ["grindbone", 0.95, 0.66, false]];
const TALL_MOBS: Fig[] = [["overlord", 0.16, 0.42, true], ["junkling", 0.1, 0.32, false], ["ping", 0.33, 0.34, false]];
const TALL_HEROES: Fig[] = [["brakka", 0.82, 0.46, true], ["glitch", 0.66, 0.36, false], ["grindbone", 0.9, 0.4, false]];
// фон библиотеки 3840×1240: Steam кладёт логотип и кнопки поверх, поэтому толпы по краям, босс в центре
const HERO_MOBS: Fig[] = [
  ["overlord", 0.07, 0.8, true], ["craterbrute", 0.19, 0.74, true], ["skitter", 0.3, 0.5, true],
  ["junkling", 0.04, 0.58, false], ["popup", 0.14, 0.56, false], ["ping", 0.25, 0.5, false], ["blink", 0.35, 0.44, false],
];
const HERO_HEROES: Fig[] = [
  ["brakka", 0.93, 0.84, true], ["wizzle", 0.81, 0.78, true], ["lunamoth", 0.7, 0.66, true],
  ["grindbone", 0.97, 0.64, false], ["glitch", 0.87, 0.6, false], ["cosmonaut", 0.76, 0.58, false], ["bongo", 0.65, 0.54, false],
];

/** Босс мира, на фоне которого стоит капсула */
const bossOf = (world: string) => BOSSES.find((b) => WORLDS[b.world].id === world) ?? BOSSES[1];

const Logo: React.FC<{width: number; H: number}> = ({width, H}) => (
  <div style={{filter: `drop-shadow(0 ${H * 0.012}px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 ${H * 0.04}px rgba(255,170,90,0.35))`}}>
    {/* целый множитель, чтобы пиксели логотипа были одинаковыми */}
    <PixelLogo scale={Math.max(1, Math.floor(width / 60))} />
  </div>
);

export const Capsule: React.FC<CapsuleProps> = ({kind, world}) => {
  const {width: W, height: H} = useVideoConfig();

  if (kind === "libraryLogo") {
    return (
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <Logo width={W * 0.94} H={H} />
      </AbsoluteFill>
    );
  }

  const tall = kind === "vertical" || kind === "library";
  const wideHero = kind === "libraryHero";
  const figs =
    kind === "small"
      ? []
      : [
          ...(wideHero ? HERO_MOBS : tall ? TALL_MOBS : WIDE_MOBS).map((f) => [f, true] as const),
          ...(wideHero ? HERO_HEROES : tall ? TALL_HEROES : WIDE_HEROES).map((f) => [f, false] as const),
        ];
  const logoW = W * (kind === "small" ? 0.86 : tall ? 0.88 : 0.56);
  // в высоких капсулах и широком фоне середину занимает босс мира
  const boss = tall || wideHero ? bossOf(world) : null;
  const bossH = H * (wideHero ? 0.92 : 0.58);
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <WorldBackdrop world={world} />
      {/* в высоких капсулах картинка мира сильно растянута: глушим середину, чтобы не было мутного пятна */}
      {tall && <AbsoluteFill style={{background: "linear-gradient(transparent 18%, rgba(7,7,13,0.85) 40%, rgba(7,7,13,0.85) 62%, transparent 85%)"}} />}
      <VersusSplit reveal={1} />
      {boss && (
        <>
          <AbsoluteFill
            style={{background: `radial-gradient(${wideHero ? "16% 45%" : "38% 26%"} at 50% ${wideHero ? 58 : 56}%, rgba(255,190,120,0.22), transparent 72%)`}}
          />
          <Img
            src={staticFile(`overspam/site/bosses/${boss.id}.webp`)}
            style={{
              position: "absolute",
              left: W / 2 - (bossH * 0.8) / 2,
              bottom: wideHero ? H * 0.02 : H * 0.2,
              width: bossH * 0.8,
              height: bossH,
              filter: `brightness(0.8) drop-shadow(0 0 ${H * 0.03}px rgba(255,170,90,0.45)) drop-shadow(0 ${H * 0.02}px ${H * 0.03}px rgba(0,0,0,0.8))`,
            }}
          />
        </>
      )}
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
      {!wideHero && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(${tall ? "70% 22% at 50% 14%" : "40% 42% at 50% 46%"}, rgba(7,7,13,0.7), transparent 75%)`, zIndex: 3}} />
          <AbsoluteFill style={{zIndex: 4, alignItems: "center", justifyContent: tall ? "flex-start" : "center", paddingTop: tall ? H * 0.07 : 0}}>
            <Logo width={logoW} H={H} />
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  );
};
