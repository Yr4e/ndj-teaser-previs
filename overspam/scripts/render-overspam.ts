import fs from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Вставки для трейлера OVERSPAM: npm run overspam [-- OS-Weapons OS-End]
 * Настройки (bpm, звук, тексты концовки) в content/overspam/teaser.json.
 * Полноэкранные вставки → MP4, плашки боссов и вставки из "alpha" → MOV ProRes 4444 с прозрачностью.
 */
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "content/overspam/teaser.json"), "utf8"));
const only = process.argv.slice(2);
const ids: string[] = only.length ? only : cfg.render;
const out = path.join(ROOT, "out/overspam");
fs.mkdirSync(out, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public")});
const base = {bpm: cfg.bpm, sfx: cfg.sfx};
// In the cloud container point this at an installed headless Chrome instead of downloading one
const browser = process.env.REMOTION_BROWSER ? {browserExecutable: process.env.REMOTION_BROWSER} : {};

const jobs: {id: string; file: string; props: Record<string, unknown>; alpha: boolean}[] = [];
for (const id of ids) {
  if (id === "OS-Boss") {
    for (let boss = 0; boss < 5; boss++) jobs.push({id, file: `boss-${boss + 1}.mov`, props: {...base, boss}, alpha: true});
  } else if (id === "OS-End") {
    jobs.push({id, file: "end.mp4", props: {...base, ...cfg.end}, alpha: false});
  } else {
    const name = id.replace("OS-", "").toLowerCase();
    jobs.push({id, file: `${name}.mp4`, props: base, alpha: false});
    // Same insert without the backdrop, to lay over gameplay: listed in teaser.json "alpha"
    if ((cfg.alpha ?? []).includes(id)) jobs.push({id, file: `${name}-alpha.mov`, props: {...base, transparent: true}, alpha: true});
  }
}

for (const job of jobs) {
  const composition = await selectComposition({serveUrl, id: job.id, inputProps: job.props, ...browser});
  const outputLocation = path.join(out, job.file);
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    inputProps: job.props,
    outputLocation,
    ...browser,
    audioCodec: job.alpha ? "pcm-16" : "aac",
    ...(job.alpha
      ? {codec: "prores" as const, proResProfile: "4444" as const, pixelFormat: "yuva444p10le" as const, imageFormat: "png" as const}
      : {codec: "h264" as const, crf: 14, pixelFormat: "yuv420p" as const, audioBitrate: "256k"}),
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        process.stdout.write(`\r${job.file}: ${p * 10}%`);
      }
    },
  });
  console.log(`\r${job.file}: готово`);
}
console.log(`Все файлы: ${out}`);
