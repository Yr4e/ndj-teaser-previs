import React, {useLayoutEffect, useRef, useState} from "react";
import {continueRender, delayRender, Img, staticFile} from "remotion";

/**
 * Текст игровым пиксельным шрифтом OVERSPAM (атлас 160×45 из билда игры, ячейка 10×9).
 * Рисуем в родных пикселях на canvas, потом увеличиваем без сглаживания.
 * Стиль "logo" повторяет логотип: полосы от кремового к персиковому, бордовая толщина снизу, тёмная обводка.
 */

const ROWS = [
  "ABCDEFGHIJKLMNOP",
  "QRSTUVWXYZ012345",
  "6789БГДЖИЙЁЛПУФЦ",
  "ЧШЩЪЫЬЭЮЯ.,:!?+-",
  "×/%'\"()[]·=→←#&@",
];
const CELL_W = 10;
const CELL_H = 9;

type Glyph = {sx: number; sy: number; x0: number; w: number};

let atlas: HTMLImageElement | null = null;
let glyphs: Map<string, Glyph> | null = null;
let loading: Promise<void> | null = null;

const load = () => {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      const map = new Map<string, Glyph>();
      ROWS.forEach((row, r) =>
        [...row].forEach((ch, col) => {
          const sx = col * CELL_W;
          const sy = r * CELL_H;
          let x0 = CELL_W;
          let x1 = -1;
          for (let x = 0; x < CELL_W; x++)
            for (let y = 0; y < CELL_H; y++)
              if (data[((sy + y) * img.width + sx + x) * 4 + 3] > 128) {
                x0 = Math.min(x0, x);
                x1 = Math.max(x1, x);
              }
          if (x1 >= 0) map.set(ch, {sx, sy, x0, w: x1 - x0 + 1});
        }),
      );
      atlas = img;
      glyphs = map;
      resolve();
    };
    img.onerror = reject;
    img.src = staticFile("overspam/game/160x45_pixelfont.png");
  });
  return loading;
};

export type PixelStyle = "logo" | "white" | "red" | "dim" | "black";

const FILLS: Record<PixelStyle, string[]> = {
  // строки 1..7 глифа, цвета взяты из логотипа игры
  logo: ["#fffae8", "#ffecc4", "#ffd696", "#ffc880", "#ffba6a", "#faac5c", "#faac5c"],
  white: ["#ffffff", "#ffffff", "#fffae8", "#fffae8", "#f6efe1", "#f6efe1", "#ffecc4"],
  red: ["#ffd2c4", "#ff8a7a", "#ff5a5a", "#f04048", "#e0303e", "#c82434", "#c82434"],
  dim: ["#9aa0b8", "#9aa0b8", "#8a90a8", "#8a90a8", "#7a8098", "#7a8098", "#7a8098"],
  black: ["#0d0b10", "#0d0b10", "#0d0b10", "#0d0b10", "#0d0b10", "#0d0b10", "#0d0b10"],
};
const DEPTH: Record<PixelStyle, number> = {logo: 2, white: 1, red: 2, dim: 0, black: 0};
const DEPTH_COLOR: Record<PixelStyle, string> = {logo: "#62162c", white: "#3a3550", red: "#5a0e1e", dim: "#000", black: "#000"};
const OUTLINE = "#090911";

/** Полосы под любой цвет: сверху светлее, к низу чистый цвет; толщина — тот же цвет, притемнённый */
const mix = (hex: string, to: number, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (sh: number) => Math.round(((n >> sh) & 255) * (1 - k) + to * k);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};
const colorFills = (hex: string) => [0.62, 0.45, 0.3, 0.18, 0.08, 0, 0].map((k) => mix(hex, 255, k));

const measure = (text: string, spacing: number) => {
  let w = 0;
  for (const ch of text.toUpperCase()) {
    if (ch === " ") {
      w += 4 + spacing;
      continue;
    }
    const g = glyphs?.get(ch);
    w += (g ? g.w : 4) + spacing;
  }
  return Math.max(0, w - spacing);
};

/** Ширина надписи в экранных пикселях (для раскладки) */
export const pixelTextWidth = (text: string, scale: number, spacing = 1) =>
  glyphs ? (measure(text, spacing) + 2) * scale : text.length * 7 * scale;

export const PixelText: React.FC<{
  text: string;
  scale: number;
  style?: PixelStyle;
  spacing?: number;
  /** Без обводки (для мелких подписей поверх тёмного) */
  noOutline?: boolean;
  /** Свой цвет вместо стиля (#rrggbb): полосы и толщина строятся от него */
  color?: string;
  css?: React.CSSProperties;
}> = ({text, scale, style = "logo", spacing = 1, noOutline = false, color, css}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => (glyphs ? null : delayRender("pixel font")));
  const [ready, setReady] = useState(!!glyphs);

  useLayoutEffect(() => {
    if (ready) return;
    load().then(() => {
      setReady(true);
      if (handle !== null) continueRender(handle);
    });
  }, [ready, handle]);

  const depth = color ? 2 : DEPTH[style];
  const pad = noOutline ? 0 : 1;
  const tw = ready ? measure(text, spacing) : 0;
  const W = tw + pad * 2;
  const H = 7 + depth + pad * 2;

  useLayoutEffect(() => {
    if (!ready || !atlas || !glyphs || !ref.current) return;
    const c = ref.current;
    c.width = Math.max(1, W);
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    // маска глифов
    const m = document.createElement("canvas");
    m.width = W;
    m.height = H;
    const mc = m.getContext("2d")!;
    mc.imageSmoothingEnabled = false;
    let x = pad;
    for (const ch of text.toUpperCase()) {
      if (ch === " ") {
        x += 4 + spacing;
        continue;
      }
      const g = glyphs.get(ch);
      if (!g) {
        x += 4 + spacing;
        continue;
      }
      mc.drawImage(atlas, g.sx + g.x0, g.sy + 1, g.w, 7, x, pad, g.w, 7);
      x += g.w + spacing;
    }
    const tint = (color: string) => {
      const t = document.createElement("canvas");
      t.width = W;
      t.height = H;
      const tc = t.getContext("2d")!;
      tc.drawImage(m, 0, 0);
      tc.globalCompositeOperation = "source-in";
      tc.fillStyle = color;
      tc.fillRect(0, 0, W, H);
      return t;
    };

    // обводка: маска + толщина, раздутая на 1 пиксель во все стороны
    if (!noOutline) {
      const o = tint(OUTLINE);
      for (let d = 0; d <= depth; d++)
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) ctx.drawImage(o, dx, dy + d);
    }
    // толщина снизу
    if (depth > 0) {
      const dp = tint(color ? mix(color, 0, 0.62) : DEPTH_COLOR[style]);
      for (let d = 1; d <= depth; d++) ctx.drawImage(dp, 0, d);
    }
    // лицевая заливка полосами
    const f = document.createElement("canvas");
    f.width = W;
    f.height = H;
    const fc = f.getContext("2d")!;
    (color ? colorFills(color) : FILLS[style]).forEach((col, i) => {
      fc.fillStyle = col;
      fc.fillRect(0, pad + i, W, 1);
    });
    fc.globalCompositeOperation = "destination-in";
    fc.drawImage(m, 0, 0);
    ctx.drawImage(f, 0, 0);
  }, [ready, text, style, spacing, noOutline, color, W, H, depth, pad]);

  return (
    <canvas
      ref={ref}
      style={{
        width: W * scale,
        height: H * scale,
        imageRendering: "pixelated",
        display: "block",
        ...css,
      }}
    />
  );
};

/** Логотип игры 60×14 из билда, увеличенный без сглаживания */
export const PixelLogo: React.FC<{scale: number; css?: React.CSSProperties}> = ({scale, css}) => (
  <Img
    src={staticFile("overspam/game/60x14_logo.png")}
    style={{width: 60 * scale, height: 14 * scale, imageRendering: "pixelated", display: "block", ...css}}
  />
);
