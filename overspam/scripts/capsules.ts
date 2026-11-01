import fs from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";
const ROOT = path.resolve(import.meta.dirname, "..");

/** Капсулы Steam: npm run capsules → out/overspam/capsules/<вид>_<ширина>x<высота>.png (фон — end.world из teaser.json) */
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "content/overspam/teaser.json"), "utf8"));
const out = path.join(ROOT, "out/overspam/capsules");
fs.mkdirSync(out, {recursive: true});
const browser = process.env.REMOTION_BROWSER ? {browserExecutable: process.env.REMOTION_BROWSER} : {};
const serveUrl = await bundle({entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public")});
for (const kind of ["header", "small", "main", "vertical", "library"]) {
  const inputProps = {kind, world: cfg.end?.world ?? "moon"};
  const composition = await selectComposition({serveUrl, id: "OS-Capsule", inputProps, ...browser});
  const output = path.join(out, `${kind}_${composition.width}x${composition.height}.png`);
  await renderStill({composition, serveUrl, inputProps, output, frame: 0, ...browser});
  console.log(output);
}
