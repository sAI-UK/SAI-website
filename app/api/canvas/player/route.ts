import { readFile } from "node:fs/promises";
import path from "node:path";
import { scriptPlaceholder } from "@/lib/canvas/player-shell";

export const runtime = "nodejs";

// Serves the player shell (p5 + the movie runtime) that the Canvas page loads into a sandboxed iframe.
// The page adds the movie script where the placeholder is.

const policy = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "connect-src 'none'",
  "font-src 'none'",
  "media-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

const inline = (source: string) => source.replace(/<\/script/gi, "<\\/script");

export async function GET() {
  const root = process.cwd();
  const [p5, runtime] = await Promise.all([
    // The player uses p5 1.x (installed as "p5-v1"): it is the version AI models know best.
    // The drawing board uses p5 2.x through p5.brush, which is a separate package.
    readFile(path.join(root, "node_modules/p5-v1/lib/p5.min.js"), "utf8"),
    readFile(path.join(root, "lib/canvas/movie-runtime.js"), "utf8"),
  ]);
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${policy}">
<style>html,body{margin:0;height:100%;background:#111;overflow:hidden;display:flex;align-items:center;justify-content:center}canvas{display:block}</style>
</head><body>
<script>${inline(p5)}</script>
<script>${inline(runtime)}</script>
<script>${scriptPlaceholder}</script>
<script>window.__saiReady();</script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
