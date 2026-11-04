import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {PixelText} from "./PixelText";

/* Эскизы финальных кадров концовки «уже доступно» для геймплейного ролика — по одному кадру на вариант */
const LOGO = (s: number) => ({width: 60 * s, height: 14 * s});
export const Logo: React.FC<{s: number}> = ({s}) => (
  <div style={{position: "relative", ...LOGO(s), filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.6))"}}>
    {Array.from({length: 14}, (_, k) => 14 - k).map((k) => (
      <Img key={k} src={staticFile("overspam/game/logo_x22_side.png")} style={{position: "absolute", left: 0, top: k * (s / 12), ...LOGO(s), imageRendering: "pixelated", filter: `brightness(${0.5 + 0.5 * (1 - k / 14)})`}} />
    ))}
    <Img src={staticFile("overspam/game/logo_x22.png")} style={{position: "absolute", left: 0, top: 0, ...LOGO(s), imageRendering: "pixelated"}} />
  </div>
);
export const Stores: React.FC<{size?: number}> = ({size = 46}) => (
  <div style={{display: "flex", gap: 34, alignItems: "center"}}>
    {["steam", "epicgames"].map((st) => <Img key={st} src={staticFile(`overspam/stores/${st}.svg`)} style={{width: size, height: size}} />)}
  </div>
);
export const Btn: React.FC<{text: string; bg?: string; s?: number; pressed?: boolean}> = ({text, bg = "#ffc547", s = 6, pressed}) => (
  <div style={{background: bg, padding: `${s * 4}px ${s * 8}px`, boxShadow: pressed ? `0 ${s / 2}px 0 #6e2a0c` : `0 ${s * 2}px 0 #6e2a0c, 0 ${s * 4}px 30px rgba(0,0,0,0.5)`, transform: pressed ? `translateY(${s * 1.5}px)` : undefined, border: `${s / 1.5}px solid #1c0c04`}}>
    <PixelText text={text} scale={s} style="black" noOutline spacing={2} />
  </div>
);
export const Cursor: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 9}) => {
  const rows = ["X", "XX", "XWX", "XWWX", "XWWWX", "XWWWWX", "XWWWWWX", "XWWWWWWX", "XWWWWXXXX", "XWWXWX", "XWX XWX", "XX  XWX", "X    XWX", "     XX"];
  return (
    <div style={{position: "absolute", left: x, top: y, filter: "drop-shadow(6px 8px 0 rgba(0,0,0,0.4))"}}>
      {rows.map((r, j) => r.split("").map((c, i) => c === " " ? null : <div key={`${i}-${j}`} style={{position: "absolute", left: i * s, top: j * s, width: s, height: s, background: c === "X" ? "#0d0b10" : "#fff"}} />))}
    </div>
  );
};
const Label: React.FC<{n: number; t: string}> = ({n, t}) => (
  <div style={{position: "absolute", left: 40, top: 30, background: "rgba(0,0,0,0.75)", padding: "14px 22px"}}>
    <PixelText text={`${n}. ${t}`} scale={4} style="white" noOutline spacing={1} />
  </div>
);

// 1 — геймплей рассыпается на пиксели, из них логотип
const V1: React.FC = () => (
  <AbsoluteFill style={{background: "#000"}}>
    <AbsoluteFill style={{filter: "blur(2px) brightness(0.5) saturate(1.2)"}}>
      <Img src={staticFile("overspam/pt_src/00100.png")} style={{width: "100%", height: "100%"}} />
    </AbsoluteFill>
    {/* пиксельные квадраты, летящие к центру */}
    {Array.from({length: 260}, (_, i) => {
      const a = Math.sin(i * 12.9898) * 43758.5453, r = a - Math.floor(a);
      const b = Math.sin(i * 78.233) * 12345.678, q = b - Math.floor(b);
      const ang = r * Math.PI * 2, d = 260 + q * 700;
      const sz = 10 + (i % 5) * 7;
      return <div key={i} style={{position: "absolute", left: 960 + Math.cos(ang) * d * 1.3, top: 420 + Math.sin(ang) * d * 0.6, width: sz, height: sz, background: ["#ffc547", "#ff8a2a", "#6fd3ff", "#b07cff", "#ffffff"][i % 5], opacity: 0.25 + (1 - q) * 0.75}} />;
    })}
    <AbsoluteFill style={{alignItems: "center", paddingTop: 230}}><Logo s={22} /></AbsoluteFill>
    <AbsoluteFill style={{alignItems: "center", paddingTop: 640, gap: 50}}>
      <PixelText text="AVAILABLE NOW" scale={11} style="white" spacing={1} />
      <div style={{display: "flex", gap: 60, alignItems: "center"}}><Btn text="PLAY NOW" /><Stores size={58} /></div>
    </AbsoluteFill>
    <Label n={1} t="GAMEPLAY -> PIXELS -> LOGO" />
  </AbsoluteFill>
);

// 2 — экран итогов забега
const STATS: [string, string][] = [["ENEMIES KILLED", "48 213"], ["DAMAGE DEALT", "9 871 004"], ["WEAPONS", "6"], ["ITEMS", "31"], ["CARDS", "12"], ["TIME", "30:00"]];
const V2: React.FC = () => (
  <AbsoluteFill style={{background: "#000"}}>
    <AbsoluteFill style={{filter: "blur(10px) brightness(0.35)"}}><Img src={staticFile("overspam/pt_src/00060.png")} style={{width: "100%", height: "100%"}} /></AbsoluteFill>
    <div style={{position: "absolute", left: 200, top: 120, width: 1520, height: 840, background: "rgba(22,12,40,0.88)", border: "8px solid #ffc547", boxShadow: "0 0 0 8px #1c0c04"}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center"}}><PixelText text="RUN COMPLETE" scale={10} style="logo" spacing={1} /></div>
      <div style={{position: "absolute", left: 90, top: 190, display: "flex", flexDirection: "column", gap: 22}}>
        {STATS.map(([k, v]) => (
          <div key={k} style={{display: "flex", width: 760, justifyContent: "space-between"}}>
            <PixelText text={k} scale={5} style="dim" noOutline spacing={1} />
            <PixelText text={v} scale={5} style="white" noOutline spacing={1} />
          </div>
        ))}
      </div>
      <div style={{position: "absolute", left: 960, top: 190, display: "grid", gridTemplateColumns: "repeat(4, 100px)", gap: 14}}>
        {["six_shot", "flame_mail", "frost_byte", "fork_bomb", "caps_lock", "ctrl_z", "energy_drink", "escape_key", "first_aid_kit", "cozy_campfire", "dark_mode_goggles", "forbidden_soda"].map((n) => (
          <div key={n} style={{width: 100, height: 100, background: "rgba(255,255,255,0.06)", border: "4px solid #3a3550"}}>
            <Img src={staticFile(`overspam/game/256x256_${n}.png`)} style={{width: "100%", height: "100%", imageRendering: "pixelated"}} />
          </div>
        ))}
      </div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 30}}>
        <PixelText text="YOUR RUN STARTS NOW" scale={9} style="red" spacing={1} />
        <div style={{display: "flex", gap: 60, alignItems: "center"}}><Btn text="PLAY NOW" s={5} /><Stores /></div>
      </div>
    </div>
    <Label n={2} t="RUN RESULTS SCREEN" />
  </AbsoluteFill>
);

// 3 — курсор жмёт кнопку
const V3: React.FC = () => (
  <AbsoluteFill style={{background: "radial-gradient(60% 60% at 50% 45%, #2a1446, #07040c)"}}>
    <AbsoluteFill style={{alignItems: "center", paddingTop: 170}}><Logo s={20} /></AbsoluteFill>
    <AbsoluteFill style={{alignItems: "center", paddingTop: 520}}><PixelText text="AVAILABLE NOW" scale={10} style="logo" spacing={1} /></AbsoluteFill>
    <AbsoluteFill style={{alignItems: "center", paddingTop: 700}}>
      <div style={{position: "relative"}}>
        <div style={{position: "absolute", inset: -40, background: "radial-gradient(closest-side, rgba(255,197,71,0.55), transparent)"}} />
        <Btn text="PLAY" s={10} pressed />
      </div>
    </AbsoluteFill>
    <Cursor x={1020} y={790} />
    <div style={{position: "absolute", bottom: 50, left: 0, right: 0, display: "flex", justifyContent: "center"}}><Stores /></div>
    <Label n={3} t="CURSOR CLICKS PLAY" />
  </AbsoluteFill>
);

// 4 — луна, логотип падает на кучу лута
const V4: React.FC = () => (
  <AbsoluteFill style={{background: "#000", overflow: "hidden"}}>
    <Img src={staticFile("overspam/end_moon_bg.png")} style={{position: "absolute", width: "100%", height: "100%", transform: "scale(1.3)", transformOrigin: "100% 75%"}} />
    <AbsoluteFill style={{background: "linear-gradient(rgba(10,4,30,0.6), transparent 45%, transparent 75%, rgba(0,0,0,0.6)), linear-gradient(90deg, rgba(8,4,20,0.95), transparent 30%)"}} />
    <AbsoluteFill style={{alignItems: "center", paddingTop: 110}}><Logo s={20} /></AbsoluteFill>
    <AbsoluteFill style={{alignItems: "center", paddingTop: 450}}><PixelText text="AVAILABLE NOW" scale={10} style="white" spacing={1} /></AbsoluteFill>
    <div style={{position: "absolute", bottom: 70, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60, alignItems: "center"}}><Btn text="PLAY NOW" /><Stores size={56} /></div>
    <Label n={4} t="MOON + LOOT PILE" />
  </AbsoluteFill>
);

export const EndConcepts: React.FC<{v: number}> = ({v}) => [<V1 key={1} />, <V2 key={2} />, <V3 key={3} />, <V4 key={4} />][v - 1] ?? null;
