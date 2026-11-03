// Redraws the ballpoint illustrations and saves them to public/ballpoint.
// Run after changing lib/ballpoint/pen.ts, scenes.js or sky.js:  node scripts/ballpoint-art/render.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const out = join(root, "public", "ballpoint");
const browser = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
if (!browser) throw new Error("Chrome or Edge not found. Set CHROME_PATH to its location.");

// Run the site's real pen in the browser: strip its types and turn its exports into a global.
const penSource = stripTypeScriptTypes(readFileSync(join(root, "lib", "ballpoint", "pen.ts"), "utf8"));
const exported = [...penSource.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const pen = `(() => {${penSource.replace(/^export /gm, "")}\nwindow.Pen = { ${exported.join(", ")} };})();`;

const page = `<!doctype html><meta charset="utf-8"><pre id="out"></pre>
<script>${pen}</script>
<script>${readFileSync(join(here, "scenes.js"), "utf8")}</script>
<script>${readFileSync(join(here, "sky.js"), "utf8")}</script>
<script>${readFileSync(join(here, "pieces.js"), "utf8")}</script>`;

const dir = mkdtempSync(join(tmpdir(), "ballpoint-"));
const file = join(dir, "render.html");
writeFileSync(file, page);
let dom;
try {
  dom = execFileSync(
    browser,
    ["--headless=new", "--disable-gpu", "--dump-dom", "--virtual-time-budget=120000", pathToFileURL(file).href],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 512, timeout: 300000, stdio: ["ignore", "pipe", "ignore"] },
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const match = dom.match(/<pre id="out">@@START@@(.*?)@@END@@/s);
if (!match) throw new Error("The drawing page did not finish. Check scenes.js, sky.js and pieces.js for errors.");

for (const { name, w, h, data } of JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"))) {
  const bytes = Buffer.from(data.split(",")[1], "base64");
  writeFileSync(join(out, `${name}.webp`), bytes);
  console.log(`${name}.webp  ${w}x${h}  ${Math.round(bytes.length / 1024)} KB`);
}
