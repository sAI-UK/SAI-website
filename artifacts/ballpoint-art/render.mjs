// Redraws the ballpoint illustrations and saves them as images next to this file.
// Run after changing scenes.js or pen.js:  node artifacts/ballpoint-art/render.mjs
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const browser = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
if (!browser) throw new Error("Chrome or Edge not found. Set CHROME_PATH to its location.");

const dom = execFileSync(
  browser,
  ["--headless=new", "--disable-gpu", "--dump-dom", "--virtual-time-budget=120000", pathToFileURL(join(here, "render.html")).href],
  { encoding: "utf8", maxBuffer: 1024 * 1024 * 512, timeout: 300000, stdio: ["ignore", "pipe", "ignore"] },
);
const match = dom.match(/@@START@@(.*?)@@END@@/s);
if (!match) throw new Error("The render page did not finish. Open render.html in a browser and check the console.");

const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
for (const { name, w, h, pxW, pxH, data } of JSON.parse(decoded)) {
  const bytes = Buffer.from(data.split(",")[1], "base64");
  writeFileSync(join(here, `${name}.webp`), bytes);
  console.log(`${name}.webp  ${w}x${h} (${pxW}x${pxH}px)  ${Math.round(bytes.length / 1024)} KB`);
}
