// The ballpoint pen. Used live by the drawing pad and birds, and by scripts/ballpoint-art
// to export the site's illustrations, so everything is drawn with exactly the same strokes.
// Keep this file to plain, erasable TypeScript: render.mjs strips the types to run it in Chrome.

export const INK = "#2443a6";
export const PAPER = "#fdfcf8";
export const BLACK = "#15161a";

export type Point = [number, number];
export type Box = { x: number; y: number; w: number; h: number };
export type Rand = () => number;
type Ctx = CanvasRenderingContext2D;

// ---------- helpers ----------
export function mulberry32(seed: number): Rand {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sizes a canvas's bitmap for the current screen and returns its context, cleared and ready to draw on. */
export function fit(c: HTMLCanvasElement) {
  const d = Math.min(2, window.devicePixelRatio || 1);
  const w = c.clientWidth, h = c.clientHeight;
  c.width = Math.max(1, Math.round(w * d));
  c.height = Math.max(1, Math.round(h * d));
  const ctx = c.getContext("2d") as Ctx;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return { ctx, w, h };
}

/** Calls back when pixel density changes (browser zoom, or moving to another monitor). Returns a stop function. */
export function onPixelRatioChange(callback: () => void) {
  let query: MediaQueryList;
  const listen = () => {
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    query.addEventListener("change", changed, { once: true });
  };
  const changed = () => { callback(); listen(); };
  listen();
  return () => query.removeEventListener("change", changed);
}

const wob = (rand: Rand) => {
  const a = rand() * 6.28, b = rand() * 6.28;
  return (t: number) => Math.sin(t + a) * 0.6 + Math.sin(t * 2.3 + b) * 0.4;
};

export function poly(ctx: Ctx, pts: Point[], dx = 0, dy = 0) {
  ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
  ctx.closePath();
}

export function bbox(pts: Point[]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// ---------- the pen ----------
type HatchOptions = { alpha?: number; min?: number; max?: number; skip?: number; w?: number; color?: string; along?: number };

// Rows of short, slightly irregular strokes filling a box at a given angle.
export function hatch(ctx: Ctx, b: Box, ang: number, gap: number, rand: Rand, o: HatchOptions = {}) {
  const { alpha = 0.7, min = 6, max = 18, skip = 0.1, w = 1, color = INK, along = 4 } = o;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, L = Math.hypot(b.w, b.h) / 2 + 2;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  ctx.strokeStyle = color;
  for (let off = -L; off <= L; off += gap * (0.7 + rand() * 0.6)) {
    const px = cx + nx * off, py = cy + ny * off;
    let s0 = -Infinity, s1 = Infinity;
    if (Math.abs(dx) > 1e-6) {
      let a = (b.x - px) / dx, c = (b.x + b.w - px) / dx;
      if (a > c) [a, c] = [c, a];
      s0 = Math.max(s0, a); s1 = Math.min(s1, c);
    } else if (px < b.x || px > b.x + b.w) continue;
    if (Math.abs(dy) > 1e-6) {
      let a = (b.y - py) / dy, c = (b.y + b.h - py) / dy;
      if (a > c) [a, c] = [c, a];
      s0 = Math.max(s0, a); s1 = Math.min(s1, c);
    } else if (py < b.y || py > b.y + b.h) continue;
    if (s1 <= s0) continue;
    let s = s0 - rand() * max;
    while (s < s1) {
      const e = s + min + rand() * (max - min);
      if (rand() > skip) {
        const j1 = (rand() - 0.5) * gap * 0.4, j2 = (rand() - 0.5) * gap * 0.4;
        ctx.globalAlpha = alpha * (0.55 + rand() * 0.45);
        ctx.lineWidth = w * (0.75 + rand() * 0.5);
        ctx.beginPath();
        ctx.moveTo(px + dx * s + nx * j1, py + dy * s + ny * j1);
        ctx.lineTo(px + dx * e + nx * j2, py + dy * e + ny * j2);
        ctx.stroke();
      }
      s = e + rand() * along;
    }
  }
  ctx.globalAlpha = 1;
}

// Clip to "inside the shape but outside the shape moved towards the light": the shadow side.
function crescent(ctx: Ctx, pts: Point[], dx: number, dy: number, draw: () => void) {
  ctx.save();
  ctx.beginPath(); poly(ctx, pts); ctx.clip();
  ctx.beginPath(); ctx.rect(-1e4, -1e4, 2e4, 2e4); poly(ctx, pts, dx, dy); ctx.clip("evenodd");
  draw();
  ctx.restore();
}

export type InkOptions = { w?: number; alpha?: number; passes?: number; closed?: boolean };

export function inkPoly(ctx: Ctx, pts: Point[], rand: Rand, { w = 1.25, alpha = 0.9, passes = 2, closed = true }: InkOptions = {}) {
  ctx.strokeStyle = INK;
  for (let p = 0; p < passes; p++) {
    const f = wob(rand), ox = (rand() - 0.5) * 1.2, oy = (rand() - 0.5) * 1.2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const j = f((i / pts.length) * 12) * 0.6;
      if (i) ctx.lineTo(x + ox + j, y + oy + j);
      else ctx.moveTo(x + ox + j, y + oy + j);
    });
    if (closed) ctx.closePath();
    ctx.globalAlpha = p ? alpha * 0.35 : alpha;
    ctx.lineWidth = p ? w * 0.7 : w;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Scalloped treetop / cloud outline.
export function blobPath(cx: number, cy: number, R: number, rand: Rand, { bumps = true, squash = 0.86 } = {}) {
  const k = 7 + Math.floor(rand() * 5), ph = rand() * Math.PI;
  const amps = Array.from({ length: k }, () => 0.5 + rand());
  const w1 = rand() * 6.28, w2 = rand() * 6.28;
  const pts: Point[] = [], N = Math.max(60, Math.round(R * 2.2));
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2, s = (t * k) / 2 + ph;
    const bi = ((Math.floor(s / Math.PI) % k) + k) % k;
    let r = 1 + 0.045 * Math.sin(2 * t + w1) + 0.035 * Math.sin(3 * t + w2);
    if (bumps) r *= 0.87 + 0.13 * amps[bi] * Math.pow(Math.abs(Math.sin(s)), 0.7);
    pts.push([cx + Math.cos(t) * R * r, cy + Math.sin(t) * R * r * squash]);
  }
  return pts;
}

type ShadeOptions = { curls?: number; cx?: number; cy?: number; R?: number; outline?: InkOptions; tone?: number };

// Shade any closed shape as if lit from the top left.
export function shade(ctx: Ctx, pts: Point[], rand: Rand, size: number, { curls = 0, cx = 0, cy = 0, R = 0, outline = {}, tone = 1 }: ShadeOptions = {}) {
  const b = bbox(pts);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = PAPER;
  ctx.beginPath(); poly(ctx, pts); ctx.fill();
  ctx.globalCompositeOperation = "multiply";
  const a = -1.05 + (rand() - 0.5) * 0.25;
  const lx = -0.34 * size, ly = -0.4 * size;
  crescent(ctx, pts, lx * 1.9, ly * 1.9, () => hatch(ctx, b, a, 7.5, rand, { alpha: 0.3 * tone, min: 5, max: 12, skip: 0.35 }));
  crescent(ctx, pts, lx, ly, () => hatch(ctx, b, a, 3.4, rand, { alpha: 0.72 * tone, min: 7, max: 20 }));
  crescent(ctx, pts, lx * 0.42, ly * 0.42, () => hatch(ctx, b, a + 1.25, 3.6, rand, { alpha: 0.6 * tone, min: 5, max: 12, skip: 0.2 }));
  if (curls) {
    ctx.save();
    ctx.beginPath(); poly(ctx, pts); ctx.clip();
    ctx.strokeStyle = INK;
    for (let i = 0; i < curls; i++) {
      const ccx = cx + (rand() - 0.5) * R * 0.8, ccy = cy + (rand() * 0.5 - 0.1) * R * 0.6, r = R * (0.25 + rand() * 0.2);
      const a0 = Math.PI * (1 + rand() * 0.15), a1 = Math.PI * (1.65 + rand() * 0.25), kk = 3 + Math.floor(rand() * 2);
      ctx.beginPath();
      for (let j = 0; j <= 24; j++) {
        const t = a0 + ((a1 - a0) * j) / 24;
        const rr = r * (0.88 + 0.12 * Math.pow(Math.abs(Math.sin(((t - a0) * kk * Math.PI) / (a1 - a0))), 0.7));
        const X = ccx + Math.cos(t) * rr, Y = ccy + Math.sin(t) * rr * 0.86;
        if (j) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      }
      ctx.globalAlpha = 0.75; ctx.lineWidth = 1.1; ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  inkPoly(ctx, pts, rand, outline);
  ctx.globalCompositeOperation = "source-over";
}

export function drawTree(ctx: Ctx, cx: number, cy: number, R: number, rand: Rand, { bumps = true, curls = true } = {}) {
  const pts = blobPath(cx, cy, R, rand, { bumps, squash: bumps ? 0.86 : 0.92 });
  shade(ctx, pts, rand, R, { curls: curls ? 1 + Math.floor(rand() * 3) : 0, cx, cy, R });
}

export function drawBird(ctx: Ctx, x: number, y: number, s: number, flap: number, head: number) {
  const beat = Math.sin(flap);
  const tipY = -beat * 8, elbowY = -3.5 - beat * 3.5;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(head); ctx.scale(s, s);
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = "round"; ctx.globalAlpha = 0.92;
  ctx.lineWidth = 1.5 / Math.max(s, 0.7);
  ctx.beginPath();
  ctx.moveTo(-14, tipY);
  ctx.quadraticCurveTo(-6.5, elbowY, 0, 0);
  ctx.quadraticCurveTo(6.5, elbowY, 14, tipY);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0.8, 0.7, 3.2, 1.25, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
