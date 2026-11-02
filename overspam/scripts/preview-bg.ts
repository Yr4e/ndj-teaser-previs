import fs from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";
const ROOT = path.resolve(import.meta.dirname, "..");

/** Превью вариантов фона: npm run preview-bg [-- OS-Cards] → out/overspam/bg-<вариант>.png */
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "content/overspam/teaser.json"), "utf8"));
const id = process.argv[2] ?? "OS-Worlds";
const out = path.join(ROOT, "out/overspam");
fs.mkdirSync(out, {recursive: true});
const browser = process.env.REMOTION_BROWSER ? {browserExecutable: process.env.REMOTION_BROWSER} : {};
const serveUrl = await bundle({entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public")});
for (const bg of ["grid", "deep", "spot", "crt", "dust"]) {
  const inputProps = {bpm: cfg.bpm, sfx: false, bg, flash: false};
  const composition = await selectComposition({serveUrl, id, inputProps, ...browser});
  const output = path.join(out, `bg-${bg}.png`);
  await renderStill({composition, serveUrl, inputProps, output, frame: composition.durationInFrames - 2, ...browser});
  console.log(output);
}
