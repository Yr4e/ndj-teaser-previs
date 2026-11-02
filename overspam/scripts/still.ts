import fs from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";
const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Один кадр для согласования до полного рендера:
 * npm run still -- OS-End layout=versus → out/overspam/still-OS-End.png (последний кадр)
 * Пары key=value переопределяют настройки из teaser.json; frame=N — номер кадра.
 */
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "content/overspam/teaser.json"), "utf8"));
const [id = "OS-End", ...pairs] = process.argv.slice(2);
const overrides = Object.fromEntries(pairs.map((p) => p.split("=") as [string, string]));
const {frame: frameArg, ...rest} = overrides;
const inputProps = {bpm: cfg.bpm, sfx: false, bg: cfg.bg ?? "grid", ...(id === "OS-End" ? cfg.end : {}), ...rest};
const browser = process.env.REMOTION_BROWSER ? {browserExecutable: process.env.REMOTION_BROWSER} : {};
const out = path.join(ROOT, "out/overspam");
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public")});
const composition = await selectComposition({serveUrl, id, inputProps, ...browser});
const output = path.join(out, `still-${id}.png`);
const frame = frameArg ? Number(frameArg) : composition.durationInFrames - 1;
await renderStill({composition, serveUrl, inputProps, output, frame, ...browser});
console.log(output);
